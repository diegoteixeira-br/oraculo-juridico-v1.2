import { useState } from 'react';
import { toast } from 'sonner';
import { useUserTimezone } from './useUserTimezone';

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
  const { formatDateInUserTimezone } = useUserTimezone();

  const copyCalculoContrato = async (calculo: CalculoContrato, formData: any) => {
    setLoading(true);
    try {
      // Usar o detalhamento que já vem do backend com timestamp correto
      const textoFormatado = calculo.detalhamento;

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
      // Usar o detalhamento que já vem do backend com timestamp correto
      const textoFormatado = calculo.detalhamento;

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