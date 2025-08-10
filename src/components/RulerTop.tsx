import React, { useEffect, useMemo, useRef, useState } from "react";

interface RulerTopProps {
  widthPx: number;
  zoom: number;
  leftMarginMm: number;
  rightMarginMm: number;
  onChange: (leftMm: number, rightMm: number) => void;
}

const MM_TO_PX = 3.7795;

export default function RulerTop({ widthPx, zoom, leftMarginMm, rightMarginMm, onChange }: RulerTopProps) {
  const widthMm = Math.round(widthPx / MM_TO_PX);
  const scaledWidth = Math.round(widthPx * zoom);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<null | 'left' | 'right'>(null);

  const pxPerMm = useMemo(() => MM_TO_PX * zoom, [zoom]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mm = (e.clientX - rect.left) / pxPerMm;

      if (dragging === 'left') {
        const newLeft = Math.max(0, Math.min(Math.round(mm), widthMm - rightMarginMm));
        onChange(newLeft, rightMarginMm);
      } else if (dragging === 'right') {
        const newRight = Math.max(0, Math.min(Math.round(widthMm - mm), widthMm - leftMarginMm));
        onChange(leftMarginMm, newRight);
      }
    };
    const onUp = () => setDragging(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, leftMarginMm, rightMarginMm, onChange, pxPerMm, widthMm]);

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mm = (e.clientX - rect.left) / pxPerMm;
    const xLeft = leftMarginMm * pxPerMm;
    const xRight = (widthMm - rightMarginMm) * pxPerMm;
    const target = Math.abs(e.clientX - (rect.left + xLeft)) <= Math.abs(e.clientX - (rect.left + xRight)) ? 'left' : 'right';
    setDragging(target);
  };

  const ticks: JSX.Element[] = [];
  for (let mm = 0; mm <= widthMm; mm += 1) {
    if (mm % 5 !== 0) continue;
    const x = Math.round(mm * pxPerMm);
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

  const leftX = Math.round(leftMarginMm * pxPerMm);
  const rightX = Math.round((widthMm - rightMarginMm) * pxPerMm);

  return (
    <div
      ref={containerRef}
      className="bg-muted/70 rounded-sm relative"
      style={{ width: scaledWidth, height: 24 }}
      onPointerDown={startDrag}
      role="slider"
      aria-label="Régua horizontal com marcadores de margem"
    >
      {/* Destaques 0–80mm e 170–210mm (visuais) */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 bottom-0 bg-accent/15 border-t border-dashed border-accent"
          style={{ left: 0, width: Math.round(80 * pxPerMm) }}
        />
        <div
          className="absolute top-0 bottom-0 bg-accent/15 border-t border-dashed border-accent"
          style={{ left: Math.round(170 * pxPerMm), width: Math.max(0, Math.round((widthMm - 170) * pxPerMm)) }}
        />
      </div>
      <div className="relative w-full h-full">{ticks}</div>

      {/* Marcadores/handles das margens */}
      <div
        aria-label="Margem esquerda"
        className="absolute -bottom-[1px] h-3 w-[2px] bg-border"
        style={{ left: leftX }}
      />
      <div
        aria-label="Margem direita"
        className="absolute -bottom-[1px] h-3 w-[2px] bg-border"
        style={{ left: rightX }}
      />
    </div>
  );
}
