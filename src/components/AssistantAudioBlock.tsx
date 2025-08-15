import React from "react";
import { AudioPlayer } from "./AudioPlayer";
import ReadingProgress from "./ReadingProgress";

interface AssistantAudioBlockProps {
  audioSrc: string;
  text: string;
}

const AssistantAudioBlock: React.FC<AssistantAudioBlockProps> = ({ audioSrc, text }) => {
  const [progress, setProgress] = React.useState(0); // 0..1
  const [loading, setLoading] = React.useState(true);
  const [playing, setPlaying] = React.useState(false);
  const [audioDuration, setAudioDuration] = React.useState(0);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [pausedProgress, setPausedProgress] = React.useState(0); // Guarda progresso quando pausa

  // Calcula progresso baseado na velocidade real do áudio com suavização
  React.useEffect(() => {
    if (audioDuration > 0) {
      const words = text.split(/\s+/).length;
      
      if (playing) {
        // Calcula progresso linear simples baseado no tempo
        const linearProgress = currentTime / audioDuration;
        
        // Adiciona um offset ajustado (equivalente a 15 palavras)
        const offsetProgress = (15 / words);
        
        // Progresso total com limite de 99% para não passar à frente
        const totalProgress = Math.min(0.99, linearProgress + offsetProgress);
        
        // Suaviza mudanças bruscas - só permite aumentos graduais
        const smoothProgress = Math.max(progress, totalProgress);
        
        setProgress(smoothProgress);
        setPausedProgress(smoothProgress);
      } else if (currentTime === 0) {
        // Se voltou pro início, reseta o progresso
        setProgress(0);
        setPausedProgress(0);
      } else {
        // Se pausou, mantém o progresso onde estava
        setProgress(pausedProgress);
      }
    }
  }, [currentTime, audioDuration, playing, text, pausedProgress, progress]);

  return (
    <div>
      <AudioPlayer
        audioSrc={audioSrc}
        onProgress={(currentTime, duration, percent, isPlaying, playbackRate) => {
          setCurrentTime(currentTime);
          setAudioDuration(duration);
        }}
        onLoadingChange={setLoading}
        onPlayChange={setPlaying}
      />
      {loading ? (
        <div className="mt-2 text-xs text-muted-foreground">Carregando áudio…</div>
      ) : playing || progress > 0 ? (
        <ReadingProgress text={text} progress={progress} />
      ) : null}
    </div>
  );
};

export default AssistantAudioBlock;
