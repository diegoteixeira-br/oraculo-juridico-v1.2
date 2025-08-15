import { useState } from 'react';
import { toast } from 'sonner';

interface CalculoContrato {
  valorTotal: number;
  jurosTotal: number;
  valorCorrigido: number;
  diferenca: number;
  detalhamento: string;
}

interface CalculoPensao {
  valorPensao: number;
  percentualRenda: number;
  valorTotalAtrasado: number;
  multa: number;
  juros: number;
  valorCorrigido: number;
  detalhamento: string;
}

export const useExportDocument = () => {
  const [loading, setLoading] = useState(false);

  const copyCalculoContrato = async (calculo: CalculoContrato, formData: any) => {
    setLoading(true);
    try {
      const hoje = new Date();
      const dataFormatada = hoje.toLocaleDateString('pt-BR');
      const horaFormatada = hoje.toLocaleTimeString('pt-BR');

      const textoFormatado = `
═══════════════════════════════════════════════════════════════════════════════
                     RELATÓRIO DE CÁLCULO DE CONTRATO BANCÁRIO
                            Oráculo Jurídico - Sistema Especializado
═══════════════════════════════════════════════════════════════════════════════

📋 DADOS DO CONTRATO
──────────────────────────────────────────────────────────────────────────────
• Valor do Contrato:        R$ ${parseFloat(formData.valorContrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Data do Contrato:         ${new Date(formData.dataContrato).toLocaleDateString('pt-BR')}
• Data de Vencimento:       ${new Date(formData.dataVencimento).toLocaleDateString('pt-BR')}
• Taxa de Juros:            ${formData.taxaJuros}% a.m.
• Tipo de Juros:            ${formData.tipoJuros === 'simples' ? 'Juros Simples' : 'Juros Compostos'}
• Índice de Correção:       ${formData.indiceCorrecao.toUpperCase()}
• Multa por Atraso:         ${formData.multaAtraso || '2'}%
• Juros de Mora:            ${formData.jurosMora || '1'}% a.m.
${formData.valorPago ? `• Valor Pago:               R$ ${parseFloat(formData.valorPago).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
${formData.dataPagamentoParcial ? `• Data do Pagamento:        ${new Date(formData.dataPagamentoParcial).toLocaleDateString('pt-BR')}` : ''}

💰 RESULTADOS DO CÁLCULO
──────────────────────────────────────────────────────────────────────────────
• VALOR TOTAL DEVIDO:       R$ ${calculo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Valor Corrigido:          R$ ${calculo.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Juros Totais:             R$ ${calculo.jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Diferença Detectada:      R$ ${Math.abs(calculo.diferenca).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Status: ${calculo.valorCorrigido > calculo.valorTotal ? 'COBRANÇA EXCESSIVA DETECTADA' : 'VALORES DENTRO DOS PARÂMETROS LEGAIS'}

📄 DETALHAMENTO TÉCNICO E JURÍDICO
──────────────────────────────────────────────────────────────────────────────
${calculo.detalhamento}

═══════════════════════════════════════════════════════════════════════════════
Documento gerado em: ${dataFormatada} às ${horaFormatada}
Sistema: Oráculo Jurídico - Calculadora Especializada em Contratos Bancários
═══════════════════════════════════════════════════════════════════════════════
`.trim();

      await navigator.clipboard.writeText(textoFormatado);
      toast.success('Relatório copiado para a área de transferência! Cole em qualquer editor.');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      toast.error('Erro ao copiar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const copyCalculoPensao = async (calculo: CalculoPensao, formData: any) => {
    setLoading(true);
    try {
      const hoje = new Date();
      const dataFormatada = hoje.toLocaleDateString('pt-BR');
      const horaFormatada = hoje.toLocaleTimeString('pt-BR');

      const textoFormatado = `
═══════════════════════════════════════════════════════════════════════════════
                    RELATÓRIO DE CÁLCULO DE PENSÃO ALIMENTÍCIA
                            Oráculo Jurídico - Sistema Especializado
═══════════════════════════════════════════════════════════════════════════════

👨‍👩‍👧‍👦 DADOS DA PENSÃO ALIMENTÍCIA
──────────────────────────────────────────────────────────────────────────────
• Tipo de Cálculo:          ${formData.tipoCalculo === 'percentual' ? 'Percentual da Renda' : 'Valor Fixo'}
${formData.rendaAlimentante ? `• Renda do Alimentante:     R$ ${parseFloat(formData.rendaAlimentante).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
${formData.valorFixo ? `• Valor Fixo da Pensão:     R$ ${parseFloat(formData.valorFixo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}
• Número de Filhos:         ${formData.numeroFilhos}
• Idades dos Filhos:        ${formData.idadesFilhos?.filter(idade => idade).join(', ') || 'Não informado'} anos
• Data de Início:           ${new Date(formData.dataInicio).toLocaleDateString('pt-BR')}
${formData.dataFim ? `• Data de Fim:              ${new Date(formData.dataFim).toLocaleDateString('pt-BR')}` : ''}
${formData.mesesAtraso ? `• Meses em Atraso:          ${formData.mesesAtraso}` : ''}

💰 RESULTADOS DO CÁLCULO
──────────────────────────────────────────────────────────────────────────────
• VALOR DA PENSÃO MENSAL:   R$ ${calculo.valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${formData.tipoCalculo === 'percentual' ? `• Percentual da Renda:      ${calculo.percentualRenda.toFixed(2)}%` : ''}
• VALOR TOTAL CORRIGIDO:    R$ ${calculo.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
${calculo.valorTotalAtrasado > 0 ? `
• Valor em Atraso:          R$ ${calculo.valorTotalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Multa (2%):               R$ ${calculo.multa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
• Juros de Mora (1% a.m.):  R$ ${calculo.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}

📄 DETALHAMENTO TÉCNICO E JURÍDICO
──────────────────────────────────────────────────────────────────────────────
${calculo.detalhamento}

${formData.observacoes ? `
📝 OBSERVAÇÕES ADICIONAIS
──────────────────────────────────────────────────────────────────────────────
${formData.observacoes}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
Documento gerado em: ${dataFormatada} às ${horaFormatada}
Sistema: Oráculo Jurídico - Calculadora Especializada em Pensão Alimentícia
═══════════════════════════════════════════════════════════════════════════════
`.trim();

      await navigator.clipboard.writeText(textoFormatado);
      toast.success('Relatório copiado para a área de transferência! Cole em qualquer editor.');
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      toast.error('Erro ao copiar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return {
    copyCalculoContrato,
    copyCalculoPensao,
    loading
  };
};