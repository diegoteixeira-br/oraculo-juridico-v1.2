import React from "react";

interface RulerTopProps {
  widthPx: number;
  zoom: number;
}

const MM_TO_PX = 3.7795;

export default function RulerTop({ widthPx, zoom }: RulerTopProps) {
  const widthMm = Math.round(widthPx / MM_TO_PX);
  const scaledWidth = Math.round(widthPx * zoom);

  const ticks: JSX.Element[] = [];
  for (let mm = 0; mm <= widthMm; mm += 1) {
    if (mm % 5 !== 0) continue;
    const x = Math.round(mm * MM_TO_PX * zoom);
    const isMajor = mm % 10 === 0;
    const h = isMajor ? 12 : 8;
    ticks.push(
      <div key={`t-${mm}`} className="absolute bottom-0 border-r border-border" style={{ left: x, height: h }} />
    );
    if (isMajor) {
      ticks.push(
        <div
          key={`tl-${mm}`}
          className="absolute text-[10px] text-muted-foreground select-none"
          style={{ left: x, bottom: 12, transform: "translateX(-50%)" }}
        >
          {mm}
        </div>
      );
    }
  }

  return (
    <div className="bg-muted/70 rounded-sm" style={{ width: scaledWidth, height: 24 }}>
      <div className="relative w-full h-full">{ticks}</div>
    </div>
  );
}
