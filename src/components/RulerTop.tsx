import React, { useEffect, useMemo, useRef, useState } from "react";

interface RulerTopProps {
  widthPx: number;
  zoom: number;
  leftMarginMm: number;
  rightMarginMm: number;
  zeroOffsetMm?: number; // deslocamento manual do zero a partir da margem esquerda
  onZeroChange?: (mm: number) => void;
}

const MM_TO_PX = 3.7795;

export default function RulerTop({ widthPx, zoom, leftMarginMm, rightMarginMm, zeroOffsetMm = 0, onZeroChange }: RulerTopProps) {
  const widthMm = Math.round(widthPx / MM_TO_PX);
  const contentWidthMm = Math.max(0, widthMm - Math.round(leftMarginMm) - Math.round(rightMarginMm));
  const scaledWidth = Math.round(widthPx * zoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const pxPerMm = useMemo(() => MM_TO_PX * zoom, [zoom]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawMm = (e.clientX - rect.left) / pxPerMm - leftMarginMm;
      const clamped = Math.min(Math.max(Math.round(rawMm), 0), contentWidthMm);
      onZeroChange?.(clamped);
    };
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, contentWidthMm, leftMarginMm, onZeroChange, pxPerMm]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const ticks: JSX.Element[] = [];
  for (let mm = 0; mm <= contentWidthMm; mm += 1) {
    if (mm % 5 !== 0) continue;
    const x = Math.round((mm + leftMarginMm) * pxPerMm);
    const isMajor = mm % 10 === 0;
    const h = isMajor ? 12 : 8;
    const labelVal = mm - Math.round(zeroOffsetMm);
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
          {labelVal}
        </div>
      );
    }
  }

  // Posição do handle do zero em px
  const zeroX = Math.round((leftMarginMm + (zeroOffsetMm || 0)) * pxPerMm);

  return (
    <div ref={containerRef} className="bg-muted/70 rounded-sm relative" style={{ width: scaledWidth, height: 24 }} onPointerDown={startDrag}>
      <div className="relative w-full h-full">{ticks}</div>
      {/* Handle do zero */}
      <div
        role="slider"
        aria-label="Ajuste do zero da régua horizontal"
        className="absolute -bottom-[1px] h-3 w-[2px] bg-border pointer-events-none"
        style={{ left: zeroX }}
      />
      <div
        className="absolute text-[10px] text-muted-foreground select-none pointer-events-none"
        style={{ left: zeroX, bottom: 12, transform: "translateX(-50%)" }}
      >
        0
      </div>
    </div>
  );
}
