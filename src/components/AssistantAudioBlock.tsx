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
      
      // Adiciona offset de 8 palavras (cerca de 1.7 segundos a 280 WPM)
      const offsetTime = (8 / wordsPerMinute) * 60; // tempo para 8 palavras
      const adjustedTime = currentTime + offsetTime;
      
      const readingProgress = Math.min(1, adjustedTime / estimatedReadingTime);
      setProgress(readingProgress);
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
