import React from "react";

interface RulerLeftProps {
  heightPx: number;
  zoom: number;
  topMarginMm: number;
  bottomMarginMm: number;
}

const MM_TO_PX = 3.7795;

export default function RulerLeft({ heightPx, zoom, topMarginMm, bottomMarginMm }: RulerLeftProps) {
  const heightMm = Math.round(heightPx / MM_TO_PX);
  const contentHeightMm = Math.max(0, heightMm - Math.round(topMarginMm) - Math.round(bottomMarginMm));
  const scaledHeight = Math.round(heightPx * zoom);

  const ticks: JSX.Element[] = [];
  for (let mm = 0; mm <= contentHeightMm; mm += 1) {
    if (mm % 5 !== 0) continue;
    const y = Math.round((mm + topMarginMm) * MM_TO_PX * zoom);
    const isMajor = mm % 10 === 0;
    const w = isMajor ? 12 : 8;
    ticks.push(
      <div key={`vt-${mm}`} className="absolute left-0 border-t border-border" style={{ top: y, width: w }} />
    );
    if (isMajor) {
      ticks.push(
        <div
          key={`vl-${mm}`}
          className="absolute text-[10px] text-muted-foreground select-none"
          style={{ left: 0, top: y - 6 }}
        >
          {mm}
        </div>
      );
    }
  }

  return (
    <div className="bg-muted/70 rounded-sm" style={{ width: 24, height: scaledHeight }}>
      <div className="relative w-full h-full">{ticks}</div>
    </div>
  );
}
