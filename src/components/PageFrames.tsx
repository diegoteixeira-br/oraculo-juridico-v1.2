import React from "react";

interface PageFramesProps {
  widthPx: number;
  heightPx: number;
  pages: number;
  zoom: number;
  pageGapPx?: number;
}

// Renders stacked "paper" pages behind the editor content to simulate real pages
export default function PageFrames({ widthPx, heightPx, pages, zoom, pageGapPx = 0 }: PageFramesProps) {
  const scaledWidth = Math.round(widthPx * zoom);
  const scaledHeight = Math.round(heightPx * zoom);
  const totalHeightPx = heightPx * pages + pageGapPx * Math.max(0, pages - 1);
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ width: widthPx, height: totalHeightPx, transformOrigin: "top left", zoom: zoom as any }}
    >
      {Array.from({ length: pages }).map((_, i) => (
        <div
          key={i}
          className="rounded-md shadow-[var(--shadow-card)] bg-[hsl(var(--paper))] border border-border"
          style={{ position: "absolute", top: i * (heightPx + pageGapPx), left: 0, width: widthPx, height: heightPx }}
        />
      ))}
    </div>
  );
}
