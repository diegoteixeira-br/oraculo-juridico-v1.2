import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CachedDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  content: string;
  min_tokens_required: number;
  cached_at: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'legal_documents_cache';

export const useDocumentCache = () => {
  const [documents, setDocuments] = useState<CachedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const getCachedDocuments = (): CachedDocument[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_DURATION;
      
      return isExpired ? null : data;
    } catch {
      return null;
    }
  };

  const setCachedDocuments = (docs: CachedDocument[]) => {
    try {
      const cacheData = {
        data: docs,
        timestamp: Date.now()
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Erro ao cachear documentos:', error);
    }
  };

  const loadDocuments = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCachedDocuments();
      if (cached) {
        setDocuments(cached);
        setLoading(false);
        return cached;
      }
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('id, title, description, category, content, min_tokens_required')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;

      const documentsWithCache: CachedDocument[] = (data || []).map(doc => ({
        ...doc,
        cached_at: Date.now()
      }));

      setDocuments(documentsWithCache);
      setCachedDocuments(documentsWithCache);
      
      return documentsWithCache;
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const refreshDocuments = () => loadDocuments(true);

  return {
    documents,
    loading,
    refreshDocuments
  };
};