import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function usePaymentMethod() {
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkPaymentMethod = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.functions.invoke('check-payment-method');
      
      if (error) {
        setError(error.message);
        setHasPaymentMethod(false);
      } else if (data) {
        setHasPaymentMethod(data.hasPaymentMethod || false);
      }
    } catch (err) {
      console.error('Erro ao verificar método de pagamento:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setHasPaymentMethod(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPaymentMethod();
  }, []);

  return {
    hasPaymentMethod,
    loading,
    error,
    refetch: checkPaymentMethod,
  };
}