import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  const dataFim = new Date(dataFinal);
  
  // Primeiro vencimento baseado na data de início da obrigação
  let mesAtual = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), diaVencimento);
  
  // Se a data de início for depois do dia de vencimento do mês, começar no próximo mês
  if (dataInicio.getDate() > diaVencimento) {
    mesAtual.setMonth(mesAtual.getMonth() + 1);
  }
  
  // Gerar vencimentos até a data final
  while (mesAtual <= dataFim) {
    vencimentos.push(new Date(mesAtual));
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
      observacao: p.observacao || ''
    }))
    .sort((a, b) => a.data.getTime() - b.data.getTime());
  
  let saldoParaPagamentos = pagamentosOrdenados.reduce((soma, p) => soma + p.valor, 0);
  totalPago = saldoParaPagamentos;
  
  // Processar cada vencimento
  for (const vencimento of vencimentos) {
    if (vencimento <= dataCalculo) {
      totalDevido += valorMensal;
      let valorParcela = valorMensal;
      
      // Verificar se há pagamentos para esta parcela
      if (saldoParaPagamentos > 0) {
        const valorUtilizado = Math.min(saldoParaPagamentos, valorParcela);
        valorParcela -= valorUtilizado;
        saldoParaPagamentos -= valorUtilizado;
      }
      
      // Se ainda há saldo devedor para esta parcela
      if (valorParcela > 0) {
        const diasAtraso = Math.max(0, Math.floor((dataCalculo.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24)));
        const mesesAtraso = Math.max(0, Math.floor(diasAtraso / 30));
        
        if (mesesAtraso > 0) {
          // Multa de 2% sobre o valor em atraso
          const multaParcela = valorParcela * 0.02;
          // Juros de 1% ao mês sobre o valor em atraso
          const jurosParcela = valorParcela * 0.01 * mesesAtraso;
          
          multa += multaParcela;
          juros += jurosParcela;
          
          detalhePagamentos += `Vencimento: ${vencimento.toLocaleDateString('pt-BR')} - `;
          detalhePagamentos += `Valor: R$ ${valorMensal.toFixed(2)} - `;
          detalhePagamentos += `Atraso: ${diasAtraso} dias (${mesesAtraso} meses) - `;
          detalhePagamentos += `Multa: R$ ${multaParcela.toFixed(2)} - `;
          detalhePagamentos += `Juros: R$ ${jurosParcela.toFixed(2)}\n`;
        }
        
        saldoDevedor += valorParcela;
      }
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
    
    // Calcular valor da pensão baseado no tipo
    if (data.valorEstipulado) {
      // Novo modelo: valor estipulado
      valorPensao = parseFloat(data.valorEstipulado);
      if (data.rendaAlimentante) {
        const renda = parseFloat(data.rendaAlimentante);
        percentualRenda = (valorPensao / renda) * 100;
      }
    } else if (data.tipoCalculo === 'percentual') {
      // Modelo antigo: percentual da renda
      const rendaAlimentante = parseFloat(data.rendaAlimentante);
      percentualRenda = data.percentualPensao ? 
        parseFloat(data.percentualPensao) : 
        calcularPercentualSugerido(numeroFilhos, idadeFilho);
      
      valorPensao = rendaAlimentante * (percentualRenda / 100);
    } else {
      // Modelo antigo: valor fixo
      valorPensao = parseFloat(data.valorFixo);
      if (data.rendaAlimentante) {
        const renda = parseFloat(data.rendaAlimentante);
        percentualRenda = (valorPensao / renda) * 100;
      }
    }
    
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
      
      valorTotalAtrasado = calculoDetalhado.totalDevido - calculoDetalhado.totalPago;
      saldoDevedor = calculoDetalhado.saldoDevedor;
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
    const proximoVencimento = data.dataInicioObrigacao ? 
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, diaVencimento).toLocaleDateString('pt-BR') : '';
    
    const detalhamento = `CÁLCULO DE PENSÃO ALIMENTÍCIA

Dados da Pensão:
${data.valorEstipulado ? `- Valor Estipulado Mensal: R$ ${parseFloat(data.valorEstipulado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : `- Tipo de Cálculo: ${data.tipoCalculo === 'percentual' ? 'Percentual da Renda' : 'Valor Fixo'}`}
${data.rendaAlimentante ? `- Renda do Alimentante: R$ ${parseFloat(data.rendaAlimentante).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
- Número de Filhos: ${numeroFilhos}
${idadeFilho ? `- Idade do Filho: ${idadeFilho} anos` : ''}
${data.dataInicioObrigacao ? `- Início da Obrigação: ${new Date(data.dataInicioObrigacao).toLocaleDateString('pt-BR')}` : data.dataInicio ? `- Data de Início: ${new Date(data.dataInicio).toLocaleDateString('pt-BR')}` : ''}
${data.diaVencimento ? `- Dia do Vencimento: ${data.diaVencimento}` : ''}
${data.dataFim ? `- Data de Fim: ${new Date(data.dataFim).toLocaleDateString('pt-BR')}` : ''}
${totalParcelas > 0 ? `- Total de Parcelas: ${totalParcelas}` : mesesPeriodo ? `- Período: ${mesesPeriodo} meses` : ''}

Cálculos:
1. Valor da Pensão Mensal: R$ ${valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
2. Percentual da Renda: ${percentualRenda.toFixed(1)}%

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
      proximoVencimento
    };

    // Salvar no histórico se usuário autenticado
    if (userId) {
      try {
        console.log('Tentando salvar pensão no histórico...');
        const { data: insertData, error: insertError } = await supabase
          .from('calculo_pensao_historico')
          .insert({
            user_id: userId,
            tipo_calculo: data.tipoCalculo,
            renda_alimentante: data.rendaAlimentante ? parseFloat(data.rendaAlimentante) : null,
            percentual_pensao: data.percentualPensao ? parseFloat(data.percentualPensao) : null,
            valor_fixo: data.valorFixo ? parseFloat(data.valorFixo) : null,
            numero_filhos: parseInt(data.numeroFilhos),
            idades_filhos: (data.idadesFilhos || []).map((idade: string) => parseInt(idade)).filter((idade: number) => !isNaN(idade)),
            data_inicio: data.dataInicio,
            data_fim: data.dataFim || null,
            meses_atraso: data.mesesAtraso ? parseInt(data.mesesAtraso) : null,
            observacoes: data.observacoes || null,
            valor_pensao: valorPensao,
            percentual_renda: percentualRenda,
            valor_total_atrasado: valorTotalAtrasado,
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