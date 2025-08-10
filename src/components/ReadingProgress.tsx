import React from "react";

interface ReadingProgressProps {
  text: string;
  progress: number; // 0..1
  className?: string;
}

// Simple per-word underline that moves as audio progresses
const ReadingProgress: React.FC<ReadingProgressProps> = ({ text, progress, className }) => {
  // Split on spaces but keep punctuation with the word
  const words = React.useMemo(() => text.trim().split(/\s+/), [text]);
  const total = words.length || 1;
  const currentIndex = Math.min(total - 1, Math.floor(progress * total));

  return (
    <div className={`mt-2 text-sm leading-relaxed text-foreground/90 ${className ?? ""}`} aria-live="polite">
      {words.map((w, i) => (
        <span
          key={`${i}-${w}`}
          className={`relative inline-block mr-1 transition-colors duration-150 ${
            i === currentIndex ? "border-b-2 border-foreground/90" : "border-b-2 border-transparent"
          }`}
        >
          {w}
        </span>
      ))}
    </div>
  );
};

export default ReadingProgress;
