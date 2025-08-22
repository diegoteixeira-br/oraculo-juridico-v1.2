import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Pagamento {
  data: string;
  valor: string;
  observacao: string;
}

interface PensaoAlimenticiaData {
  rendaAlimentante: string;
  numeroFilhos: string;
  idadeFilho: string;
  idadesFilhos: string[];
  percentualPensao: string;
  dataInicio: string;
  dataFim: string;
  valorFixo: string;
  tipoCalculo: string;
  valorEstipulado: string;
  diaVencimento: string;
  dataInicioObrigacao: string;
  pagamentos: Pagamento[];
  mesesAtraso: string; // Manter para compatibilidade
  observacoes: string;
}

function calcularPercentualSugerido(numeroFilhos: number, idadeFilho?: number): number {
  // Percentuais sugeridos baseados na jurisprudência
  let percentual = 0;
  
  switch (numeroFilhos) {
    case 1: percentual = 30; break;
    case 2: percentual = 25; break; // 25% cada = 50% total
    case 3: percentual = 20; break; // 20% cada = 60% total
    case 4: percentual = 15; break; // 15% cada = 60% total
    default: percentual = 12; break; // 12% cada para 5+ filhos
  }
  
  // Ajuste por idade (filhos universitários podem ter percentual maior)
  if (idadeFilho && idadeFilho >= 18 && idadeFilho <= 24) {
    percentual += 5; // Adicional para universitários
  }
  
  return percentual;
}

function calcularMesesEntreDatas(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio);
  const fim = dataFim ? new Date(dataFim) : new Date();
  
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  
  return anos * 12 + meses;
}

function calcularJurosEMulta(valorPrincipal: number, mesesAtraso: number): { juros: number, multa: number } {
  // Multa de 2% sobre o valor em atraso
  const multa = valorPrincipal * 0.02;
  
  // Juros de 1% ao mês sobre o valor em atraso
  const juros = valorPrincipal * 0.01 * mesesAtraso;
  
  return { juros, multa };
}

function gerarVencimentos(dataInicioObrigacao: string, diaVencimento: number, dataFinal: string): Date[] {
  const vencimentos: Date[] = [];
  const dataInicio = new Date(dataInicioObrigacao);
  const agora = new Date();
  // Usar a data atual se dataFinal for futura, para gerar apenas parcelas atrasadas
  const dataFim = new Date(dataFinal) > agora ? agora : new Date(dataFinal);
  
  // Primeiro vencimento baseado no mês da data de início mas no dia específico de vencimento
  let mesAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), diaVencimento);
  
  // Se a data de início for depois do dia de vencimento do mês, começar no próximo mês
  if (dataInicio.getDate() > diaVencimento) {
    mesAtual.setMonth(mesAtual.getMonth() + 1);
  }
  
  // Função para ajustar para o primeiro dia útil
  const ajustarParaDiaUtil = (data: Date): Date => {
    const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
    
    // Se cair no sábado (6), mover para segunda (adicionar 2 dias)
    if (diaSemana === 6) {
      data.setDate(data.getDate() + 2);
    }
    // Se cair no domingo (0), mover para segunda (adicionar 1 dia)
    else if (diaSemana === 0) {
      data.setDate(data.getDate() + 1);
    }
    
    return data;
  };
  
  // Gerar vencimentos até a data final
  while (mesAtual <= dataFim) {
    // Ajustar para o dia do vencimento específico no próximo mês
    // Se o dia não existir no próximo mês (ex: 31), usar o último dia do mês
    const ultimoDiaDoMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0).getDate();
    if (diaVencimento <= ultimoDiaDoMes) {
      mesAtual.setDate(diaVencimento);
    } else {
      mesAtual.setDate(ultimoDiaDoMes);
    }
    
    // Ajustar para primeiro dia útil se cair em fim de semana
    const vencimentoAjustado = ajustarParaDiaUtil(new Date(mesAtual));
    vencimentos.push(vencimentoAjustado);
    
    mesAtual.setMonth(mesAtual.getMonth() + 1);
  }
  
  return vencimentos;
}

function calcularAtrasoDetalhado(
  vencimentos: Date[], 
  valorMensal: number, 
  pagamentos: Pagamento[], 
  dataCalculoStr: string
): {
  totalDevido: number;
  totalPago: number;
  saldoDevedor: number;
  multa: number;
  juros: number;
  detalhePagamentos: string;
} {
  const dataCalculo = new Date(dataCalculoStr);
  let totalDevido = 0;
  let totalPago = 0;
  let saldoDevedor = 0;
  let multa = 0;
  let juros = 0;
  let detalhePagamentos = "\nDETALHAMENTO POR VENCIMENTO:\n";
  
  // Converter pagamentos para Date e ordenar
  const pagamentosOrdenados = pagamentos
    .filter(p => p.data && p.valor)
    .map(p => ({
      data: new Date(p.data),
      valor: parseFloat(p.valor) || 0,
      observacao: p.observacao || '',
      utilizado: false
    }))
    .sort((a, b) => a.data.getTime() - b.data.getTime());
  
  totalPago = pagamentosOrdenados.reduce((soma, p) => soma + p.valor, 0);
  
  // Criar uma cópia dos pagamentos para aplicação sequencial
  let pagamentosDisponiveis = [...pagamentosOrdenados];
  
  // Processar cada vencimento em ordem cronológica
  for (const vencimento of vencimentos) {
    if (vencimento <= dataCalculo) {
      totalDevido += valorMensal;
      
      let valorPagoVencimento = 0;
      let datasPagamentos: string[] = [];
      
      // Aplicar pagamentos disponíveis a este vencimento
      for (let i = 0; i < pagamentosDisponiveis.length && valorPagoVencimento < valorMensal; i++) {
        const pagamento = pagamentosDisponiveis[i];
        if (pagamento.valor > 0) {
          const valorAplicado = Math.min(pagamento.valor, valorMensal - valorPagoVencimento);
          valorPagoVencimento += valorAplicado;
          datasPagamentos.push(`${pagamento.data.toLocaleDateString('pt-BR')}: R$ ${valorAplicado.toFixed(2)}`);
          
          // Reduzir o valor disponível do pagamento
          pagamento.valor -= valorAplicado;
        }
      }
      
      const valorRestante = valorMensal - valorPagoVencimento;
      // Acumular APENAS os valores que realmente estão em falta
      if (valorRestante > 0) {
        saldoDevedor += valorRestante;
      }
      
      // Calcular dias de atraso apenas se houver valor restante
      let diasAtraso = 0;
      if (valorRestante > 0) {
        diasAtraso = Math.max(0, Math.floor((dataCalculo.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));
      }
      
      // Calcular juros e multas sobre o valor restante (se houver atraso)
      if (valorRestante > 0 && diasAtraso > 0) {
        const mesesAtraso = Math.max(1, Math.ceil(diasAtraso / 30));
        
        // Multa de 2% sobre o valor em atraso
        const multaParcela = valorRestante * 0.02;
        // Juros de 1% ao mês sobre o valor em atraso
        const jurosParcela = valorRestante * 0.01 * mesesAtraso;
        
        multa += multaParcela;
        juros += jurosParcela;
        
        detalhePagamentos += `\nVencimento: ${vencimento.toLocaleDateString('pt-BR')}\n`;
        detalhePagamentos += `  Valor devido: R$ ${valorMensal.toFixed(2)}\n`;
        detalhePagamentos += `  Valor pago: R$ ${valorPagoVencimento.toFixed(2)}\n`;
        if (datasPagamentos.length > 0) {
          detalhePagamentos += `  Pagamentos: ${datasPagamentos.join(', ')}\n`;
        }
        detalhePagamentos += `  Valor em atraso: R$ ${valorRestante.toFixed(2)}\n`;
        detalhePagamentos += `  Dias de atraso: ${diasAtraso} dias (${mesesAtraso} meses)\n`;
        detalhePagamentos += `  Multa (2%): R$ ${multaParcela.toFixed(2)}\n`;
        detalhePagamentos += `  Juros (1% a.m.): R$ ${jurosParcela.toFixed(2)}\n`;
        detalhePagamentos += `  Total desta parcela: R$ ${(valorRestante + multaParcela + jurosParcela).toFixed(2)}\n`;
      } else if (valorPagoVencimento > 0) {
        detalhePagamentos += `\nVencimento: ${vencimento.toLocaleDateString('pt-BR')}\n`;
        detalhePagamentos += `  Valor devido: R$ ${valorMensal.toFixed(2)}\n`;
        detalhePagamentos += `  Valor pago: R$ ${valorPagoVencimento.toFixed(2)}\n`;
        if (datasPagamentos.length > 0) {
          detalhePagamentos += `  Pagamentos: ${datasPagamentos.join(', ')}\n`;
        }
        if (valorRestante === 0) {
          detalhePagamentos += `  Status: PAGO EM DIA\n`;
        } else if (diasAtraso === 0) {
          detalhePagamentos += `  Status: PARCIALMENTE PAGO (sem atraso ainda)\n`;
        }
      }
    }
  }
  
  // Adicionar resumo dos pagamentos não utilizados (antecipados)
  const pagamentosNaoUtilizados = pagamentosDisponiveis.filter(p => p.valor > 0);
  if (pagamentosNaoUtilizados.length > 0) {
    detalhePagamentos += `\nPAGAMENTOS ANTECIPADOS:\n`;
    for (const pagamento of pagamentosNaoUtilizados) {
      detalhePagamentos += `  ${pagamento.data.toLocaleDateString('pt-BR')}: R$ ${pagamento.valor.toFixed(2)} (crédito para próximas parcelas)\n`;
    }
  }
  
  return {
    totalDevido,
    totalPago,
    saldoDevedor,
    multa,
    juros,
    detalhePagamentos
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Iniciando cálculo de pensão alimentícia');
  
  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obter token de autenticação do header
    const authHeader = req.headers.get('Authorization');
    let userTimezone = 'America/Sao_Paulo'; // Padrão
    let userId = null;

    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          userId = user.id;
          console.log('Usuário autenticado:', userId);
          // Buscar timezone do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.timezone) {
            userTimezone = profile.timezone;
            console.log('Timezone do usuário encontrado:', userTimezone);
          } else {
            console.log('Timezone não encontrado no perfil, usando padrão');
          }
        }
      } catch (error) {
        console.log('Erro ao buscar timezone:', error);
      }
    }

    const data: PensaoAlimenticiaData = await req.json();
    
    const numeroFilhos = parseInt(data.numeroFilhos);
    const idadeFilho = data.idadeFilho ? parseInt(data.idadeFilho) : undefined;
    const diaVencimento = parseInt(data.diaVencimento) || 5;
    
    let valorPensao = 0;
    let percentualRenda = 0;
    
    // Calcular valor da pensão
    valorPensao = parseFloat(data.valorEstipulado);
    percentualRenda = 0; // Não calculamos mais percentual da renda
    
    // Calcular atrasos baseado nos pagamentos detalhados se disponível
    let valorTotalAtrasado = 0;
    let multa = 0;
    let juros = 0;
    let detalhePagamentos = '';
    let saldoDevedor = 0;
    let totalParcelas = 0;
    
    const agora = new Date();
    const dataAtual = agora.toLocaleDateString('en-CA', { timeZone: userTimezone });
    
    if (data.dataInicioObrigacao && data.valorEstipulado) {
      // Novo cálculo detalhado
      const dataFinalCalculo = data.dataFim || dataAtual;
      const vencimentos = gerarVencimentos(data.dataInicioObrigacao, diaVencimento, dataFinalCalculo);
      totalParcelas = vencimentos.length;
      
      const calculoDetalhado = calcularAtrasoDetalhado(
        vencimentos, 
        valorPensao, 
        data.pagamentos || [], 
        dataFinalCalculo
      );
      
      saldoDevedor = calculoDetalhado.saldoDevedor;
      valorTotalAtrasado = saldoDevedor; // O saldo devedor já é o valor em atraso correto
      multa = calculoDetalhado.multa;
      juros = calculoDetalhado.juros;
      detalhePagamentos = calculoDetalhado.detalhePagamentos;
    } else if (data.mesesAtraso) {
      // Cálculo antigo para compatibilidade
      const mesesAtraso = parseInt(data.mesesAtraso);
      if (mesesAtraso > 0) {
        valorTotalAtrasado = valorPensao * mesesAtraso;
        const penalidades = calcularJurosEMulta(valorTotalAtrasado, mesesAtraso);
        multa = penalidades.multa;
        juros = penalidades.juros;
      }
    }
    
    // Valor total corrigido
    const valorCorrigido = valorPensao + Math.max(0, saldoDevedor) + multa + juros;
    
    // Calcular período total se as datas foram informadas (usar variáveis já declaradas)
    const mesesPeriodo = data.dataFim ? 
      calcularMesesEntreDatas(data.dataInicio || data.dataInicioObrigacao, data.dataFim) : 
      calcularMesesEntreDatas(data.dataInicio || data.dataInicioObrigacao, dataAtual);
    
    // Gerar detalhamento
    let proximoVencimento = '';
    let proximoVencimentoAjustado = '';
    
    if (data.dataInicioObrigacao) {
      // Calcular próximo vencimento
      const dataProximoVencimento = new Date();
      dataProximoVencimento.setMonth(dataProximoVencimento.getMonth() + 1);
      dataProximoVencimento.setDate(diaVencimento);
      
      // Função para ajustar para o primeiro dia útil
      const ajustarParaDiaUtil = (data: Date): Date => {
        const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
        
        // Se cair no sábado (6), mover para segunda (adicionar 2 dias)
        if (diaSemana === 6) {
          data.setDate(data.getDate() + 2);
        }
        // Se cair no domingo (0), mover para segunda (adicionar 1 dia)
        else if (diaSemana === 0) {
          data.setDate(data.getDate() + 1);
        }
        
        return data;
      };
      
      proximoVencimento = dataProximoVencimento.toLocaleDateString('pt-BR');
      proximoVencimentoAjustado = ajustarParaDiaUtil(new Date(dataProximoVencimento)).toLocaleDateString('pt-BR');
    }
    
    const detalhamento = `CÁLCULO DE PENSÃO ALIMENTÍCIA - ATRASOS E CORREÇÕES

Dados da Pensão:
- Valor Mensal Estipulado: R$ ${parseFloat(data.valorEstipulado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Número de Filhos: ${numeroFilhos}
${idadeFilho ? `- Idade do Filho: ${idadeFilho} anos` : ''}
- Início da Obrigação: ${new Date(data.dataInicioObrigacao).toLocaleDateString('pt-BR')}
- Dia do Vencimento: ${diaVencimento}
${totalParcelas > 0 ? `- Total de Parcelas: ${totalParcelas}` : ''}

${proximoVencimento ? `PRÓXIMO VENCIMENTO:
- Data Original: ${proximoVencimento}
${proximoVencimento !== proximoVencimentoAjustado ? `- Data Ajustada (dia útil): ${proximoVencimentoAjustado}` : ''}
- Valor a Pagar: R$ ${valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : ''}

Cálculos de Regularização:
1. Valor da Pensão Mensal: R$ ${valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${saldoDevedor > 0 || valorTotalAtrasado > 0 ? `
Valores em Atraso:
3. Valor Total em Atraso: R$ ${Math.max(valorTotalAtrasado, saldoDevedor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
4. Multa (2%): R$ ${multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
5. Juros (1% a.m.): R$ ${juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
6. Total com Correções: R$ ${valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${data.pagamentos && data.pagamentos.length > 0 ? `
Histórico de Pagamentos:
${data.pagamentos.map((p, i) => `${i + 1}. ${new Date(p.data).toLocaleDateString('pt-BR')}: R$ ${parseFloat(p.valor || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ${p.observacao ? `(${p.observacao})` : ''}`).join('\n')}
` : ''}

${detalhePagamentos}
` : `
3. Total Mensal: R$ ${valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
`}

${proximoVencimento ? `Próximo Vencimento: ${proximoVencimento}` : ''}

Observações Legais:
- A pensão alimentícia é devida até que o filho complete 18 anos, podendo se estender até os 24 anos se estiver cursando ensino superior
- O percentual sugerido varia entre 15% a 30% da renda líquida do alimentante por filho
- Em caso de atraso, aplicam-se multa de 2% e juros de 1% ao mês
- O valor pode ser revisado a qualquer tempo mediante comprovação de mudança na situação financeira

${data.observacoes ? `Observações Adicionais: ${data.observacoes}` : ''}

Cálculo realizado em ${agora.toLocaleDateString('pt-BR', { timeZone: userTimezone, year: 'numeric', month: '2-digit', day: '2-digit' })} às ${agora.toLocaleTimeString('pt-BR', { timeZone: userTimezone, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
Ferramenta: Oráculo Jurídico - Calculadora de Pensão Alimentícia`;

    // Calcular o valor da próxima pensão (próximo vencimento) com correção monetária se necessário
    const dataCalculoObj = new Date(dataAtual);
    const proximaDataVencimento = new Date(data.dataInicioObrigacao);
    proximaDataVencimento.setDate(parseInt(diaVencimento));
    
    // Ajustar para o próximo mês se já passou do vencimento atual
    if (proximaDataVencimento <= dataCalculoObj) {
      proximaDataVencimento.setMonth(proximaDataVencimento.getMonth() + 1);
    }
    
    let valorProximaPensao = valorPensao;
    
    // Calcular próxima pensão: valor normal + saldo devedor (se houver) + juros e multa sobre o saldo
    if (saldoDevedor > 0) {
      // Aplicar juros e multa sobre o saldo devedor
      const multaSaldoDevedor = saldoDevedor * 0.02;
      const jurosSaldoDevedor = saldoDevedor * 0.01; // 1% ao mês
      valorProximaPensao = valorPensao + saldoDevedor + multaSaldoDevedor + jurosSaldoDevedor;
    }

    const result = {
      valorPensao,
      percentualRenda,
      valorTotalAtrasado: Math.max(valorTotalAtrasado, saldoDevedor),
      multa,
      juros,
      valorCorrigido,
      detalhamento,
      totalParcelas,
      saldoDevedor,
      proximoVencimento,
      valorProximaPensao: valorProximaPensao
    };

    // Salvar no histórico se usuário autenticado
    if (userId) {
      try {
        console.log('Tentando salvar pensão no histórico...');
        const { data: insertData, error: insertError } = await supabase
          .from('calculo_pensao_historico')
          .insert({
            user_id: userId,
            tipo_calculo: 'fixo',
            renda_alimentante: null,
            percentual_pensao: null,
            valor_fixo: valorPensao,
            numero_filhos: parseInt(data.numeroFilhos),
            idades_filhos: (data.idadesFilhos || []).map((idade: string) => parseInt(idade)).filter((idade: number) => !isNaN(idade)),
            data_inicio: data.dataInicioObrigacao,
            data_fim: null,
            meses_atraso: null,
            observacoes: data.observacoes || null,
            valor_pensao: valorPensao,
            percentual_renda: 0,
            valor_total_atrasado: Math.max(valorTotalAtrasado, saldoDevedor),
            multa: multa,
            juros: juros,
            valor_corrigido: valorCorrigido,
            detalhamento: detalhamento
          });
        
        if (insertError) {
          console.error('Erro detalhado ao salvar histórico de pensão:', insertError);
        } else {
          console.log('Cálculo de pensão salvo no histórico com sucesso:', insertData);
        }
      } catch (error) {
        console.error('Erro ao salvar histórico de pensão:', error);
      }
    } else {
      console.log('Usuário não autenticado, não salvando pensão no histórico');
    }

    console.log('Cálculo concluído com sucesso:', { 
      valorPensao, 
      percentualRenda: percentualRenda.toFixed(1) + '%',
      valorCorrigido 
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no cálculo da pensão alimentícia:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});