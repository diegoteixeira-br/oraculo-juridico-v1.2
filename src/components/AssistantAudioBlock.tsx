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

  // Calcula progresso baseado no tempo real de leitura com offset inicial
  React.useEffect(() => {
    if (audioDuration > 0) {
      const wordsPerMinute = 200; // Velocidade mais realista para TTS
      const words = text.split(/\s+/).length;
      const estimatedReadingTime = (words / wordsPerMinute) * 60; // em segundos
      
      if (playing) {
        // Offset menor para melhor sincronização
        const offsetTime = (10 / wordsPerMinute) * 60; // 10 palavras de offset
        const adjustedTime = currentTime + offsetTime;
        const readingProgress = Math.min(1.05, adjustedTime / estimatedReadingTime);
        const newProgress = Math.max(0, readingProgress);
        setProgress(newProgress);
        setPausedProgress(newProgress); // Atualiza posição pausada
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
