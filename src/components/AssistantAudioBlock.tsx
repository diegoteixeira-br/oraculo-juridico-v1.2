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

  // Sistema automático de sincronização que se adapta à velocidade real do áudio
  React.useEffect(() => {
    if (audioDuration > 0) {
      const words = text.split(/\s+/).length;
      
      if (playing) {
        // Calcula a velocidade real do áudio (palavras por segundo)
        const realWordsPerSecond = words / audioDuration;
        
        // Velocidade base esperada para TTS (mais conservadora)
        const expectedWordsPerSecond = 2.8; // ~168 palavras por minuto
        
        // Calcula offset dinâmico baseado na velocidade real
        // Áudio mais rápido = mais offset, áudio mais lento = menos offset
        const speedRatio = realWordsPerSecond / expectedWordsPerSecond;
        const dynamicOffsetWords = Math.max(8, Math.min(25, 15 * speedRatio));
        const offsetProgress = dynamicOffsetWords / words;
        
        // Progresso linear baseado no tempo
        const linearProgress = currentTime / audioDuration;
        
        // Limite dinâmico baseado na velocidade do áudio
        const maxProgress = speedRatio > 1.2 ? 0.97 : 0.99; // Mais restritivo para áudios rápidos
        const totalProgress = Math.min(maxProgress, linearProgress + offsetProgress);
        
        // Suaviza mudanças bruscas
        const smoothProgress = Math.max(progress, totalProgress);
        
        setProgress(smoothProgress);
        setPausedProgress(smoothProgress);
      } else if (currentTime === 0) {
        setProgress(0);
        setPausedProgress(0);
      } else {
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
