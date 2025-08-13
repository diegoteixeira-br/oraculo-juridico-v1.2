import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProductType {
  id: string;
  name: string;
  category: 'subscription' | 'token_pack';
  tokens_included: number;
  price_cents: number;
  price_currency: string;
  billing_period: 'monthly' | 'yearly' | 'one_time' | null;
  description: string;
  is_active: boolean;
}

export function useProductTypes() {
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductTypes = async () => {
      try {
        const { data, error } = await supabase
          .from('product_types')
          .select('*')
          .eq('is_active', true)
          .order('category', { ascending: true })
          .order('price_cents', { ascending: true });

        if (error) throw error;
        setProductTypes((data as ProductType[]) || []);
      } catch (err) {
        console.error('Erro ao buscar tipos de produtos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchProductTypes();
  }, []);

  const subscriptions = productTypes.filter(p => p.category === 'subscription');
  const tokenPacks = productTypes.filter(p => p.category === 'token_pack');

  const formatPrice = (priceCents: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(priceCents / 100);
  };

  return {
    productTypes,
    subscriptions,
    tokenPacks,
    loading,
    error,
    formatPrice,
  };
}