import React, { useEffect, useMemo, useRef, useState } from "react";

interface RulerLeftProps {
  heightPx: number;
  zoom: number;
  topMarginMm: number;
  bottomMarginMm: number;
  onChange: (topMm: number, bottomMm: number) => void;
}

const MM_TO_PX = 3.7795;

export default function RulerLeft({ heightPx, zoom, topMarginMm, bottomMarginMm, onChange }: RulerLeftProps) {
  const heightMm = Math.round(heightPx / MM_TO_PX);
  const scaledHeight = Math.round(heightPx * zoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<null | 'top' | 'bottom'>(null);
  const pxPerMm = useMemo(() => MM_TO_PX * zoom, [zoom]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mm = (e.clientY - rect.top) / pxPerMm;

      if (dragging === 'top') {
        const newTop = Math.max(0, Math.min(Math.round(mm), heightMm - bottomMarginMm));
        onChange(newTop, bottomMarginMm);
      } else if (dragging === 'bottom') {
        const newBottom = Math.max(0, Math.min(Math.round(heightMm - mm), heightMm - topMarginMm));
        onChange(topMarginMm, newBottom);
      }
    };
    const onUp = () => setDragging(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, topMarginMm, bottomMarginMm, onChange, pxPerMm, heightMm]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mm = (e.clientY - rect.top) / pxPerMm;
    const yTop = topMarginMm * pxPerMm;
    const yBottom = (heightMm - bottomMarginMm) * pxPerMm;
    const target = Math.abs(e.clientY - (rect.top + yTop)) <= Math.abs(e.clientY - (rect.top + yBottom)) ? 'top' : 'bottom';
    setDragging(target);
  };

  const ticks: JSX.Element[] = [];
  for (let mm = 0; mm <= heightMm; mm += 1) {
    if (mm % 5 !== 0) continue;
    const y = Math.round(mm * pxPerMm);
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

  const topY = Math.round(topMarginMm * pxPerMm);
  const bottomY = Math.round((heightMm - bottomMarginMm) * pxPerMm);

  return (
    <div
      className="bg-muted/70 rounded-sm relative"
      style={{ width: 24, height: scaledHeight }}
      ref={containerRef}
      onPointerDown={startDrag}
      role="slider"
      aria-label="Régua vertical com marcadores de margem"
    >
      <div className="relative w-full h-full">{ticks}</div>
      {/* Marcadores/handles das margens */}
      <div
        aria-label="Margem superior"
        className="absolute -right-[1px] w-3 h-[2px] bg-border"
        style={{ top: topY }}
      />
      <div
        aria-label="Margem inferior"
        className="absolute -right-[1px] w-3 h-[2px] bg-border"
        style={{ top: bottomY }}
      />
    </div>
  );
}
