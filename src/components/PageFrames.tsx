import React from "react";

interface PageFramesProps {
  widthPx: number;
  heightPx: number;
  pages: number;
  zoom: number;
  pageGapPx?: number;
  marginPx?: { top: number; right: number; bottom: number; left: number };
}

// Renders stacked "paper" pages behind the editor content to simulate real pages
export default function PageFrames({ widthPx, heightPx, pages, zoom, pageGapPx = 0, marginPx }: PageFramesProps) {
  const scaledWidth = Math.round(widthPx * zoom);
  const scaledHeight = Math.round(heightPx * zoom);
  const totalHeightPx = heightPx * pages + pageGapPx * Math.max(0, pages - 1);
  const hasMargins = !!marginPx;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ width: widthPx, height: totalHeightPx, transformOrigin: "top left", transform: `scale(${zoom})` }}
    >
      {Array.from({ length: pages }).map((_, i) => (
        <div
          key={i}
          className="rounded-md shadow-[var(--shadow-card)] bg-[hsl(var(--paper))] border border-border"
          style={{ position: "absolute", top: i * (heightPx + pageGapPx), left: 0, width: widthPx, height: heightPx }}
        >
          {hasMargins && (
            <div className="absolute inset-0">
              {/* Linhas-guia das margens */}
              {/* Superior */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-accent"
                style={{ top: marginPx!.top }}
              />
              {/* Inferior */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-accent"
                style={{ top: heightPx - marginPx!.bottom }}
              />
              {/* Esquerda */}
              <div
                className="absolute top-0 bottom-0 border-l border-dashed border-accent"
                style={{ left: marginPx!.left }}
              />
              {/* Direita */}
              <div
                className="absolute top-0 bottom-0 border-l border-dashed border-accent"
                style={{ left: widthPx - marginPx!.right }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
