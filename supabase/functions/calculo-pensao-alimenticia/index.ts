import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PensaoAlimenticiaData {
  rendaAlimentante: string;
  numeroFilhos: string;
  idadeFilho: string;
  percentualPensao: string;
  dataInicio: string;
  dataFim: string;
  valorFixo: string;
  tipoCalculo: string;
  mesesAtraso: string;
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Iniciando cálculo de pensão alimentícia');
  
  try {
    const data: PensaoAlimenticiaData = await req.json();
    
    const numeroFilhos = parseInt(data.numeroFilhos);
    const idadeFilho = data.idadeFilho ? parseInt(data.idadeFilho) : undefined;
    const mesesAtraso = data.mesesAtraso ? parseInt(data.mesesAtraso) : 0;
    
    let valorPensao = 0;
    let percentualRenda = 0;
    
    if (data.tipoCalculo === 'percentual') {
      const rendaAlimentante = parseFloat(data.rendaAlimentante);
      percentualRenda = data.percentualPensao ? 
        parseFloat(data.percentualPensao) : 
        calcularPercentualSugerido(numeroFilhos, idadeFilho);
      
      valorPensao = rendaAlimentante * (percentualRenda / 100);
    } else {
      valorPensao = parseFloat(data.valorFixo);
      // Para valor fixo, calcular o percentual baseado na renda se informada
      if (data.rendaAlimentante) {
        const renda = parseFloat(data.rendaAlimentante);
        percentualRenda = (valorPensao / renda) * 100;
      }
    }
    
    // Calcular valores em atraso se houver
    let valorTotalAtrasado = 0;
    let multa = 0;
    let juros = 0;
    
    if (mesesAtraso > 0) {
      valorTotalAtrasado = valorPensao * mesesAtraso;
      const penalidades = calcularJurosEMulta(valorTotalAtrasado, mesesAtraso);
      multa = penalidades.multa;
      juros = penalidades.juros;
    }
    
    // Valor total corrigido
    const valorCorrigido = valorPensao + valorTotalAtrasado + multa + juros;
    
    // Calcular período total se as datas foram informadas
    const mesesPeriodo = data.dataFim ? 
      calcularMesesEntreDatas(data.dataInicio, data.dataFim) : 
      calcularMesesEntreDatas(data.dataInicio, new Date().toISOString());
    
    // Gerar detalhamento
    const detalhamento = `CÁLCULO DE PENSÃO ALIMENTÍCIA

Dados da Pensão:
- Tipo de Cálculo: ${data.tipoCalculo === 'percentual' ? 'Percentual da Renda' : 'Valor Fixo'}
${data.rendaAlimentante ? `- Renda do Alimentante: R$ ${parseFloat(data.rendaAlimentante).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
- Número de Filhos: ${numeroFilhos}
${idadeFilho ? `- Idade do Filho: ${idadeFilho} anos` : ''}
- Data de Início: ${new Date(data.dataInicio).toLocaleDateString('pt-BR')}
${data.dataFim ? `- Data de Fim: ${new Date(data.dataFim).toLocaleDateString('pt-BR')}` : ''}
- Período: ${mesesPeriodo} meses

Cálculos:
1. Valor da Pensão Mensal: R$ ${valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
2. Percentual da Renda: ${percentualRenda.toFixed(1)}%

${mesesAtraso > 0 ? `
Valores em Atraso:
3. Meses em Atraso: ${mesesAtraso}
4. Valor Total Atrasado: R$ ${valorTotalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
5. Multa (2%): R$ ${multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
6. Juros (1% a.m.): R$ ${juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
7. Total com Correções: R$ ${valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : `
3. Total Mensal: R$ ${valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
`}

Observações Legais:
- A pensão alimentícia é devida até que o filho complete 18 anos, podendo se estender até os 24 anos se estiver cursando ensino superior
- O percentual sugerido varia entre 15% a 30% da renda líquida do alimentante por filho
- Em caso de atraso, aplicam-se multa de 2% e juros de 1% ao mês
- O valor pode ser revisado a qualquer tempo mediante comprovação de mudança na situação financeira

${data.observacoes ? `Observações Adicionais: ${data.observacoes}` : ''}

Cálculo realizado em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    const result = {
      valorPensao,
      percentualRenda,
      valorTotalAtrasado,
      multa,
      juros,
      valorCorrigido,
      detalhamento
    };

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