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
  observacoes: string;
}

function calcularDiferencaDias(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  const diferenca = fim.getTime() - inicio.getTime();
  return Math.ceil(diferenca / (1000 * 3600 * 24));
}

function calcularJurosSimples(principal: number, taxa: number, tempo: number): number {
  return principal * (taxa / 100) * (tempo / 30); // tempo em meses
}

function calcularJurosCompostos(principal: number, taxa: number, tempo: number): number {
  return principal * (Math.pow(1 + (taxa / 100), tempo / 30) - 1);
}

function aplicarCorrecaoMonetaria(valor: number, indice: string, meses: number): number {
  // Simulação de índices de correção (valores aproximados)
  const indices = {
    ipca: 0.005, // 0.5% ao mês
    igpm: 0.007, // 0.7% ao mês
    inpc: 0.004, // 0.4% ao mês
    selic: 0.008  // 0.8% ao mês
  };
  
  const taxaCorrecao = indices[indice as keyof typeof indices] || 0.005;
  return valor * Math.pow(1 + taxaCorrecao, meses);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ContratoBancarioData = await req.json();
    
    const valorContrato = parseFloat(data.valorContrato);
    const taxaJuros = parseFloat(data.taxaJuros);
    const valorPago = parseFloat(data.valorPago) || 0;
    
    // Calcular período em dias e meses
    const diasPeriodo = calcularDiferencaDias(data.dataContrato, data.dataVencimento);
    const mesesPeriodo = diasPeriodo / 30;
    
    // Calcular juros
    let jurosTotal = 0;
    if (data.tipoJuros === 'simples') {
      jurosTotal = calcularJurosSimples(valorContrato, taxaJuros, diasPeriodo);
    } else {
      jurosTotal = calcularJurosCompostos(valorContrato, taxaJuros, diasPeriodo);
    }
    
    // Aplicar correção monetária
    const valorCorrigido = aplicarCorrecaoMonetaria(valorContrato, data.indiceCorrecao, mesesPeriodo);
    
    // Calcular valor total devido
    const valorTotal = valorCorrigido + jurosTotal;
    
    // Calcular diferença (valor devido - valor pago)
    const diferenca = Math.max(0, valorTotal - valorPago);
    
    // Gerar detalhamento
    const detalhamento = `CÁLCULO DE CONTRATO BANCÁRIO

Dados do Contrato:
- Valor Original: R$ ${valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Data do Contrato: ${new Date(data.dataContrato).toLocaleDateString('pt-BR')}
- Data de Vencimento: ${new Date(data.dataVencimento).toLocaleDateString('pt-BR')}
- Período: ${diasPeriodo} dias (${mesesPeriodo.toFixed(1)} meses)
- Taxa de Juros: ${taxaJuros}% a.m. (${data.tipoJuros})
- Índice de Correção: ${data.indiceCorrecao.toUpperCase()}

Cálculos:
1. Valor Original: R$ ${valorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
2. Correção Monetária (${data.indiceCorrecao.toUpperCase()}): R$ ${(valorCorrigido - valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
3. Valor Corrigido: R$ ${valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
4. Juros ${data.tipoJuros} (${taxaJuros}% a.m.): R$ ${jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
5. Valor Total Devido: R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
6. Valor Pago: R$ ${valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
7. Diferença a Pagar: R$ ${diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${data.observacoes ? `Observações: ${data.observacoes}` : ''}

Cálculo realizado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;

    const result = {
      valorTotal,
      jurosTotal,
      valorCorrigido,
      diferenca,
      detalhamento
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