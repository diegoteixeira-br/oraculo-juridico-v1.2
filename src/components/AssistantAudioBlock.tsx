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

  // Calcula progresso baseado no tempo real de leitura com offset inicial
  React.useEffect(() => {
    if (playing && audioDuration > 0) {
      const wordsPerMinute = 280;
      const words = text.split(/\s+/).length;
      const estimatedReadingTime = (words / wordsPerMinute) * 60; // em segundos
      
      // Adiciona offset de 35 palavras para compensar o atraso
      const offsetTime = (35 / wordsPerMinute) * 60; // tempo para 35 palavras
      const adjustedTime = currentTime + offsetTime;
      
      // Permite até 105% para garantir que complete toda a leitura
      const readingProgress = Math.min(1.05, adjustedTime / estimatedReadingTime);
      setProgress(Math.max(0, readingProgress));
    }
  }, [currentTime, audioDuration, playing, text]);

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
