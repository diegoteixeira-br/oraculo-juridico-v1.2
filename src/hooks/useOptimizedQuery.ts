import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
  cacheTime?: number;
}

export const useOptimizedQuery = <T>(
  key: string,
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const { enabled = true, cacheTime = 5 * 60 * 1000 } = options; // 5 min cache

  const execute = useCallback(async (force = false) => {
    const now = Date.now();
    const isCacheValid = now - lastFetch < cacheTime;
    
    if (!force && isCacheValid && data) {
      return data;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      setLastFetch(now);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [queryFn, cacheTime, data, lastFetch]);

  useEffect(() => {
    if (enabled) {
      execute();
    }
  }, [enabled, execute]);

  const refetch = () => execute(true);

  return {
    data,
    loading,
    error,
    refetch
  };
};