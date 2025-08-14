import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CachedAudio {
  text: string;
  audioUrl: string;
  textHash: string;
  voice: string;
  createdAt: number;
}

export const useTextToSpeech = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Cache no localStorage com hash do texto
  const getCacheKey = (text: string, voice: string = 'alloy') => {
    const hash = btoa(text).replace(/[/+=]/g, '').substring(0, 20);
    return `audio_cache_${hash}_${voice}`;
  };

  const getCachedAudio = (text: string, voice: string = 'alloy'): string | null => {
    try {
      const cacheKey = getCacheKey(text, voice);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const audioData: CachedAudio = JSON.parse(cached);
        // Cache válido por 7 dias
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - audioData.createdAt < sevenDays) {
          return audioData.audioUrl;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading audio cache:', error);
    }
    return null;
  };

  const cacheAudio = (text: string, audioUrl: string, voice: string = 'alloy') => {
    try {
      const cacheKey = getCacheKey(text, voice);
      const textHash = btoa(text).replace(/[/+=]/g, '').substring(0, 20);
      const audioData: CachedAudio = {
        text,
        audioUrl,
        textHash,
        voice,
        createdAt: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(audioData));
    } catch (error) {
      console.error('Error caching audio:', error);
    }
  };

  const calculateTokens = (text: string): number => {
    // OpenAI TTS cobra aproximadamente 1 token por 4 caracteres
    return Math.ceil(text.length / 4);
  };

  const generateSpeech = useCallback(async (
    text: string, 
    voice: string = 'alloy',
    speed: number = 1.0
  ): Promise<string | null> => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para usar esta funcionalidade",
        variant: "destructive",
      });
      return null;
    }

    // Verificar cache primeiro
    const cachedAudio = getCachedAudio(text, voice);
    if (cachedAudio) {
      console.log('Using cached audio for text:', text.substring(0, 50) + '...');
      setCurrentAudio(cachedAudio);
      return cachedAudio;
    }

    const tokensNeeded = calculateTokens(text);
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voice,
          speed
        }
      });

      if (error) {
        console.error('Text-to-speech error:', error);
        throw new Error(error.message || 'Erro ao gerar áudio');
      }

      if (!data?.audioContent) {
        throw new Error('Nenhum conteúdo de áudio foi retornado');
      }

      // Converter base64 para blob URL
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      // Cache o áudio
      cacheAudio(text, audioUrl, voice);
      setCurrentAudio(audioUrl);

      toast({
        title: "Áudio gerado",
        description: `Áudio criado com sucesso! (${tokensNeeded} tokens usados)`,
      });

      return audioUrl;
    } catch (error) {
      console.error('Error generating speech:', error);
      toast({
        title: "Erro ao gerar áudio",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user, toast]);

  const clearCache = useCallback(() => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('audio_cache_')) {
          localStorage.removeItem(key);
        }
      });
      toast({
        title: "Cache limpo",
        description: "Cache de áudio foi limpo com sucesso",
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, [toast]);

  const getCacheSize = useCallback((): number => {
    try {
      const keys = Object.keys(localStorage);
      return keys.filter(key => key.startsWith('audio_cache_')).length;
    } catch (error) {
      return 0;
    }
  }, []);

  return {
    generateSpeech,
    isGenerating,
    currentAudio,
    setCurrentAudio,
    clearCache,
    getCacheSize,
    calculateTokens
  };
};