import React from "react";

interface PageFramesProps {
  widthPx: number;
  heightPx: number;
  pages: number;
  zoom: number;
}

// Renders stacked "paper" pages behind the editor content to simulate real pages
export default function PageFrames({ widthPx, heightPx, pages, zoom }: PageFramesProps) {
  const scaledWidth = Math.round(widthPx * zoom);
  const scaledHeight = Math.round(heightPx * zoom);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ width: widthPx, height: heightPx * pages, transformOrigin: "top left", zoom: zoom as any }}
    >
      {Array.from({ length: pages }).map((_, i) => (
        <div
          key={i}
          className="rounded-md shadow-[var(--shadow-card)] bg-[hsl(var(--paper))] border border-border"
          style={{ position: "absolute", top: i * scaledHeight / zoom, left: 0, width: widthPx, height: heightPx }}
        />
      ))}
    </div>
  );
}
