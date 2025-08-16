import { useState } from 'react';
import { Volume2, VolumeX, Pause, Play, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { AudioPlayer } from '@/components/AudioPlayer';
import AssistantAudioBlock from '@/components/AssistantAudioBlock';
import { useToast } from '@/hooks/use-toast';

interface ArticleTextReaderProps {
  title: string;
  content: string;
  className?: string;
}

export const ArticleTextReader = ({ title, content, className = '' }: ArticleTextReaderProps) => {
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { generateSpeech, isGenerating } = useTextToSpeech();
  const { toast } = useToast();

  // Limpar o texto markdown para TTS
  const cleanTextForTTS = (markdownText: string) => {
    return markdownText
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
      .replace(/\n\s*\n/g, ' ') // Replace multiple line breaks with space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const handlePlayArticle = async () => {
    if (currentAudio && isPlaying) {
      setIsPlaying(false);
      return;
    }

    if (currentAudio) {
      setIsPlaying(true);
      return;
    }

    const fullText = `${title}. ${cleanTextForTTS(content)}`;
    
    if (fullText.length > 3000) {
      toast({
        title: "Texto muito longo",
        description: "Este artigo é muito extenso para conversão em áudio. Tente um artigo menor.",
        variant: "destructive",
      });
      return;
    }

    try {
      const audioUrl = await generateSpeech(fullText, 'Aria', 1.0);
      if (audioUrl) {
        setCurrentAudio(audioUrl);
        setIsPlaying(true);
      } else {
        throw new Error('Não foi possível gerar o áudio');
      }
    } catch (error) {
      console.error('Erro ao gerar áudio:', error);
      toast({
        title: "Erro no leitor de texto",
        description: error instanceof Error ? error.message : "Erro desconhecido ao gerar áudio",
        variant: "destructive",
      });
    }
  };

  const handleClearAudio = () => {
    setCurrentAudio(null);
    setIsPlaying(false);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Button
          onClick={handlePlayArticle}
          disabled={isGenerating}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : currentAudio && isPlaying ? (
            <Pause className="w-4 h-4 mr-2" />
          ) : (
            <Volume2 className="w-4 h-4 mr-2" />
          )}
          {isGenerating 
            ? 'Gerando áudio...' 
            : currentAudio && isPlaying 
            ? 'Pausar leitura' 
            : 'Ouvir artigo'
          }
        </Button>

        {currentAudio && (
          <Button
            onClick={handleClearAudio}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200"
          >
            <VolumeX className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {currentAudio && (
        <AssistantAudioBlock
          audioSrc={currentAudio}
          text={`${title}. ${cleanTextForTTS(content)}`}
        />
      )}
    </div>
  );
};