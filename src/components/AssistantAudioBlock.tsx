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

  // Calcula progresso baseado na velocidade real do áudio
  React.useEffect(() => {
    if (audioDuration > 0) {
      const words = text.split(/\s+/).length;
      
      if (playing) {
        // Calcula a velocidade real do áudio (palavras por segundo)
        const realWordsPerSecond = words / audioDuration;
        
        // Velocidade base esperada (palavras por segundo)
        const expectedWordsPerSecond = 200 / 60; // ~3.33 palavras/segundo
        
        // Calcula offset dinâmico baseado na diferença de velocidade
        // Se o áudio é mais rápido que o esperado, precisa de mais offset
        // Se é mais lento, precisa de menos offset
        const speedRatio = realWordsPerSecond / expectedWordsPerSecond;
        const dynamicOffsetWords = Math.max(5, Math.min(30, 15 * speedRatio));
        const offsetTime = (dynamicOffsetWords / realWordsPerSecond);
        
        const adjustedTime = currentTime + offsetTime;
        const readingProgress = Math.min(1.05, adjustedTime / audioDuration);
        const newProgress = Math.max(0, readingProgress);
        
        setProgress(newProgress);
        setPausedProgress(newProgress);
      } else if (currentTime === 0) {
        // Se voltou pro início, reseta o progresso
        setProgress(0);
        setPausedProgress(0);
      } else {
        // Se pausou, mantém o progresso onde estava
        setProgress(pausedProgress);
      }
    }
  }, [currentTime, audioDuration, playing, text, pausedProgress]);

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
