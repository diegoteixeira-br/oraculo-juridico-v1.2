import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContratoBancarioData {
  valorContrato: string;
  dataContrato: string;
  dataVencimento: string;
  taxaJuros: string;
  tipoJuros: string;
  indiceCorrecao: string;
  valorPago: string;
  dataPagamentoParcial: string;
  multaAtraso: string;
  jurosMora: string;
  observacoes: string;
}

function calcularDiferencaDias(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  const diferenca = fim.getTime() - inicio.getTime();
  return Math.ceil(diferenca / (1000 * 3600 * 24));
}

function calcularDiferencaMeses(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  const anos = fim.getFullYear() - inicio.getFullYear();
  const meses = fim.getMonth() - inicio.getMonth();
  const dias = fim.getDate() - inicio.getDate();
  
  let totalMeses = anos * 12 + meses;
  if (dias > 0) {
    totalMeses += dias / 30; // Proporcional aos dias
  }
  
  return totalMeses;
}

function calcularJurosSimples(principal: number, taxa: number, tempo: number): number {
  return principal * (taxa / 100) * (tempo / 30); // tempo em meses
}

function calcularJurosCompostos(principal: number, taxa: number, tempo: number): number {
  return principal * (Math.pow(1 + (taxa / 100), tempo / 30) - 1);
}

function aplicarCorrecaoMonetaria(valor: number, indice: string, meses: number): number {
  // Índices de correção baseados em dados históricos aproximados
  const indices = {
    ipca: 0.005,   // 0.5% ao mês (6% ao ano)
    igpm: 0.007,   // 0.7% ao mês (8.7% ao ano)
    inpc: 0.004,   // 0.4% ao mês (4.9% ao ano)
    selic: 0.008   // 0.8% ao mês (10% ao ano)
  };
  
  const taxaCorrecao = indices[indice as keyof typeof indices] || 0.005;
  return valor * Math.pow(1 + taxaCorrecao, meses);
}

function calcularMultaEJurosMora(saldoDevedor: number, multaPerc: number, jurosMoraPerc: number, mesesAtraso: number): { multa: number, jurosMora: number } {
  const multa = saldoDevedor * (multaPerc / 100);
  const jurosMora = saldoDevedor * (jurosMoraPerc / 100) * mesesAtraso;
  
  return { multa, jurosMora };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Iniciando cálculo de contrato bancário');
  
  try {
    const data: ContratoBancarioData = await req.json();
    
    const valorContrato = parseFloat(data.valorContrato);
    const taxaJuros = parseFloat(data.taxaJuros);
    const valorPago = parseFloat(data.valorPago) || 0;
    const multaAtraso = parseFloat(data.multaAtraso) || 2;
    const jurosMora = parseFloat(data.jurosMora) || 1;
    
    // Calcular período do contrato até o vencimento
    const diasPeriodoContrato = calcularDiferencaDias(data.dataContrato, data.dataVencimento);
    const mesesPeriodoContrato = diasPeriodoContrato / 30;
    
    // 1. Aplicar correção monetária sobre o valor original até o vencimento
    const valorCorrigidoVencimento = aplicarCorrecaoMonetaria(valorContrato, data.indiceCorrecao, mesesPeriodoContrato);
    
    // 2. Calcular juros contratuais até o vencimento
    let jurosContratuais = 0;
    if (data.tipoJuros === 'simples') {
      jurosContratuais = calcularJurosSimples(valorCorrigidoVencimento, taxaJuros, diasPeriodoContrato);
    } else {
      jurosContratuais = calcularJurosCompostos(valorCorrigidoVencimento, taxaJuros, diasPeriodoContrato);
    }
    
    // 3. Valor total devido no vencimento
    const valorTotalVencimento = valorCorrigidoVencimento + jurosContratuais;
    
    // 4. Considerar pagamento parcial (se houver)
    let saldoDevedor = valorTotalVencimento;
    let valorPagoCorrigido = valorPago;
    
    if (valorPago > 0 && data.dataPagamentoParcial) {
      // Se o pagamento foi antes do vencimento, aplicar correção até o vencimento
      const diasPagamentoAteVencimento = calcularDiferencaDias(data.dataPagamentoParcial, data.dataVencimento);
      if (diasPagamentoAteVencimento > 0) {
        const mesesPagamentoAteVencimento = diasPagamentoAteVencimento / 30;
        valorPagoCorrigido = aplicarCorrecaoMonetaria(valorPago, data.indiceCorrecao, mesesPagamentoAteVencimento);
      }
      saldoDevedor = valorTotalVencimento - valorPagoCorrigido;
    } else if (valorPago > 0) {
      // Se não informou data, considera pagamento no vencimento
      saldoDevedor = valorTotalVencimento - valorPago;
    }
    
    // 5. Calcular atraso desde o vencimento até hoje
    const hoje = new Date().toISOString().split('T')[0];
    const diasAtraso = calcularDiferencaDias(data.dataVencimento, hoje);
    const mesesAtraso = Math.max(0, diasAtraso / 30);
    
    // 6. Aplicar multa e juros de mora sobre o saldo devedor
    let multa = 0;
    let jurosMoraTotal = 0;
    let valorFinalCorrigido = saldoDevedor;
    
    if (mesesAtraso > 0 && saldoDevedor > 0) {
      const penalidades = calcularMultaEJurosMora(saldoDevedor, multaAtraso, jurosMora, mesesAtraso);
      multa = penalidades.multa;
      jurosMoraTotal = penalidades.jurosMora;
      
      // Aplicar correção monetária sobre o saldo devedor desde o vencimento
      const saldoCorrigido = aplicarCorrecaoMonetaria(saldoDevedor, data.indiceCorrecao, mesesAtraso);
      valorFinalCorrigido = saldoCorrigido + multa + jurosMoraTotal;
    }
    
    // Calcular valor total devido hoje
    const valorTotal = Math.max(0, valorFinalCorrigido);
    const jurosTotal = jurosContratuais + jurosMoraTotal;
    const valorCorrigido = aplicarCorrecaoMonetaria(valorContrato, data.indiceCorrecao, mesesPeriodoContrato + mesesAtraso);
    const diferenca = valorTotal;
    
    // Gerar detalhamento completo
    const detalhamento = `CÁLCULO DETALHADO DE CONTRATO BANCÁRIO

═══════════════════════════════════════════════════════════════
DADOS DO CONTRATO
═══════════════════════════════════════════════════════════════
• Valor Original: R$ ${valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Data do Contrato: ${new Date(data.dataContrato).toLocaleDateString('pt-BR')}
• Data de Vencimento: ${new Date(data.dataVencimento).toLocaleDateString('pt-BR')}
• Período do Contrato: ${diasPeriodoContrato} dias (${mesesPeriodoContrato.toFixed(1)} meses)
• Taxa de Juros: ${taxaJuros}% a.m. (${data.tipoJuros})
• Índice de Correção: ${data.indiceCorrecao.toUpperCase()}
• Multa por Atraso: ${multaAtraso}%
• Juros de Mora: ${jurosMora}% a.m.

═══════════════════════════════════════════════════════════════
CÁLCULO ATÉ O VENCIMENTO
═══════════════════════════════════════════════════════════════
1. Valor Original: R$ ${valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
2. Correção Monetária (${data.indiceCorrecao.toUpperCase()}): R$ ${(valorCorrigidoVencimento - valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
3. Valor Corrigido no Vencimento: R$ ${valorCorrigidoVencimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
4. Juros Contratuais (${data.tipoJuros}): R$ ${jurosContratuais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
5. Total Devido no Vencimento: R$ ${valorTotalVencimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${valorPago > 0 ? `
═══════════════════════════════════════════════════════════════
PAGAMENTO PARCIAL
═══════════════════════════════════════════════════════════════
• Valor Pago: R$ ${valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${data.dataPagamentoParcial ? `• Data do Pagamento: ${new Date(data.dataPagamentoParcial).toLocaleDateString('pt-BR')}` : '• Data do Pagamento: No vencimento (não informada)'}
• Valor Pago Corrigido: R$ ${valorPagoCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Saldo Devedor: R$ ${saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : ''}

${mesesAtraso > 0 ? `
═══════════════════════════════════════════════════════════════
CÁLCULO DE ATRASO (${new Date(data.dataVencimento).toLocaleDateString('pt-BR')} até ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })})
═══════════════════════════════════════════════════════════════
• Período em Atraso: ${diasAtraso} dias (${mesesAtraso.toFixed(1)} meses)
• Saldo Devedor no Vencimento: R$ ${saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Correção Monetária do Saldo: R$ ${(aplicarCorrecaoMonetaria(saldoDevedor, data.indiceCorrecao, mesesAtraso) - saldoDevedor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Multa por Atraso (${multaAtraso}%): R$ ${multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Juros de Mora (${jurosMora}% a.m.): R$ ${jurosMoraTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : ''}

═══════════════════════════════════════════════════════════════
RESUMO FINAL
═══════════════════════════════════════════════════════════════
• Valor Total Devido Hoje: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Total de Juros: R$ ${jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Total de Correção: R$ ${(valorCorrigido - valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${multa > 0 ? `• Multa por Atraso: R$ ${multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

═══════════════════════════════════════════════════════════════
FUNDAMENTAÇÃO LEGAL
═══════════════════════════════════════════════════════════════
• Código Civil, Art. 406: "Quando os juros moratórios não forem convencionados, ou o forem sem taxa estipulada, ou quando provierem de determinação da lei, serão fixados segundo a taxa que estiver em vigor para a mora do pagamento de impostos devidos à Fazenda Nacional."

• Código Civil, Art. 408: "Incorre de pleno direito o devedor na mora: I - quando não efetuar o pagamento no tempo, lugar e forma que a lei ou a convenção estabelecer."

• Lei 10.406/2002 (Código Civil): A correção monetária visa manter o poder de compra da moeda, sendo aplicável para recompor o valor real da dívida.

${data.observacoes ? `
═══════════════════════════════════════════════════════════════
OBSERVAÇÕES ADICIONAIS
═══════════════════════════════════════════════════════════════
${data.observacoes}
` : ''}

═══════════════════════════════════════════════════════════════
Cálculo realizado em ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} às ${new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
Ferramenta: Oráculo Jurídico - Calculadora de Contrato Bancário
═══════════════════════════════════════════════════════════════`;

    const result = {
      valorTotal,
      jurosTotal,
      valorCorrigido,
      diferenca,
      detalhamento,
      // Dados adicionais para o frontend
      valorCorrigidoVencimento,
      jurosContratuais,
      saldoDevedor,
      multa,
      jurosMoraTotal,
      mesesAtraso: Math.max(0, mesesAtraso),
      diasAtraso: Math.max(0, diasAtraso)
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro no cálculo do contrato bancário:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});