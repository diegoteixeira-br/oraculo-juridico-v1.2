import React, { useEffect, useMemo, useRef, useState } from "react";

interface RulerLeftProps {
  heightPx: number;
  zoom: number;
  topMarginMm: number;
  bottomMarginMm: number;
  zeroOffsetMm?: number; // desloca o ponto zero em mm, positivo move para baixo
  onZeroChange?: (mm: number) => void;
}

const MM_TO_PX = 3.7795;

export default function RulerLeft({ heightPx, zoom, topMarginMm, bottomMarginMm, zeroOffsetMm = 0, onZeroChange }: RulerLeftProps) {
  const heightMm = Math.round(heightPx / MM_TO_PX);
  const contentHeightMm = Math.max(0, heightMm - Math.round(topMarginMm) - Math.round(bottomMarginMm));
  const scaledHeight = Math.round(heightPx * zoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pxPerMm = useMemo(() => MM_TO_PX * zoom, [zoom]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawMm = (e.clientY - rect.top) / pxPerMm - topMarginMm;
      const clamped = Math.min(Math.max(Math.round(rawMm), 0), contentHeightMm);
      onZeroChange?.(clamped);
    };
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, contentHeightMm, onZeroChange, pxPerMm, topMarginMm]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const ticks: JSX.Element[] = [];
  for (let mm = 0; mm <= contentHeightMm; mm += 1) {
    if (mm % 5 !== 0) continue;
    const y = Math.round((mm + topMarginMm) * pxPerMm);
    const labelVal = mm - Math.round(zeroOffsetMm);
    const isMajor = mm % 10 === 0; // divisões principais a cada 10mm
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
          {labelVal}
        </div>
      );
    }
  }

  const zeroY = Math.round((topMarginMm + (zeroOffsetMm || 0)) * pxPerMm);

  return (
    <div className="bg-muted/70 rounded-sm relative" style={{ width: 24, height: scaledHeight }} ref={containerRef} onPointerDown={startDrag}>
      <div className="relative w-full h-full">{ticks}</div>
      {/* Handle do zero */}
      <div
        role="slider"
        aria-label="Ajuste do zero da régua vertical"
        className="absolute -right-[1px] w-3 h-[2px] bg-border pointer-events-none"
        style={{ top: zeroY }}
      />
      <div
        className="absolute text-[10px] text-muted-foreground select-none pointer-events-none"
        style={{ left: 0, top: zeroY - 6 }}
      >
        0
      </div>
    </div>
  );
}
