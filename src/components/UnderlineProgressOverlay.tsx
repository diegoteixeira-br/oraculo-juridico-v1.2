import React from "react";

interface UnderlineProgressOverlayProps {
  progress: number; // 0..1
  lineHeightEm?: number; // approximate line height in em
  className?: string;
}

// Renders a multi-line underline overlay that expands with progress
// It overlays the ORIGINAL text container (position: relative) to avoid duplicating content
const UnderlineProgressOverlay: React.FC<UnderlineProgressOverlayProps> = ({
  progress,
  lineHeightEm = 1.6,
  className
}) => {
  const width = `${Math.max(0, Math.min(1, progress)) * 100}%`;
  const lh = `${lineHeightEm}em`;

  const style: React.CSSProperties = {
    width,
    height: "100%",
    left: 0,
    top: 0,
    position: "absolute",
    pointerEvents: "none",
    // Draw a 2px underline per line using repeating-linear-gradient
    backgroundImage: `repeating-linear-gradient(to bottom, transparent calc(${lh} - 2px), hsl(var(--foreground)) calc(${lh} - 2px), hsl(var(--foreground)) ${lh})`,
    mixBlendMode: "normal",
    opacity: 0.9,
  };

  return <div className={className} style={style} aria-hidden="true" />;
};

export default UnderlineProgressOverlay;
