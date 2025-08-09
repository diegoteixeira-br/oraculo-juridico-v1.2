import { useEffect, useMemo, useRef, useState } from "react";

// Conversão aproximada 1mm -> px (~96dpi)
const MM_TO_PX = 3.7795;

export type MarginsMm = { top: number; right: number; bottom: number; left: number };

interface EditorRulersProps {
  widthPx: number;
  heightPx: number;
  zoom: number;
  marginsMm: MarginsMm;
  onChange: (m: MarginsMm) => void;
}

export default function EditorRulers({ widthPx, heightPx, zoom, marginsMm, onChange }: EditorRulersProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<null | "top" | "right" | "bottom" | "left" >(null);

  const widthMm = useMemo(() => Math.round(widthPx / MM_TO_PX), [widthPx]);
  const heightMm = useMemo(() => Math.round(heightPx / MM_TO_PX), [heightPx]);

  const scaledWidth = Math.round(widthPx * zoom);
  const scaledHeight = Math.round(heightPx * zoom);

  const topPx = Math.round(marginsMm.top * MM_TO_PX * zoom);
  const rightPx = Math.round(marginsMm.right * MM_TO_PX * zoom);
  const bottomPx = Math.round(marginsMm.bottom * MM_TO_PX * zoom);
  const leftPx = Math.round(marginsMm.left * MM_TO_PX * zoom);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pxPerMm = MM_TO_PX * zoom;

      const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

      if (dragging === "top") {
        const newPx = clamp(e.clientY - rect.top, 0, scaledHeight - 10);
        const newMm = Math.round(newPx / pxPerMm);
        onChange({ ...marginsMm, top: newMm });
      } else if (dragging === "bottom") {
        const newPx = clamp(rect.bottom - e.clientY, 0, scaledHeight - 10);
        const newMm = Math.round(newPx / pxPerMm);
        onChange({ ...marginsMm, bottom: newMm });
      } else if (dragging === "left") {
        const newPx = clamp(e.clientX - rect.left, 0, scaledWidth - 10);
        const newMm = Math.round(newPx / pxPerMm);
        onChange({ ...marginsMm, left: newMm });
      } else if (dragging === "right") {
        const newPx = clamp(rect.right - e.clientX, 0, scaledWidth - 10);
        const newMm = Math.round(newPx / pxPerMm);
        onChange({ ...marginsMm, right: newMm });
      }
    };
    const onUp = () => setDragging(null);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, marginsMm, onChange, scaledHeight, scaledWidth, zoom]);

  const renderTopRuler = () => {
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
      <div className="absolute left-0 top-0 bg-muted/70" style={{ width: scaledWidth, height: 24 }}>
        <div className="relative w-full h-full">{ticks}</div>
      </div>
    );
  };

  const renderLeftRuler = () => {
    const ticks: JSX.Element[] = [];
    for (let mm = 0; mm <= heightMm; mm += 1) {
      if (mm % 5 !== 0) continue;
      const y = Math.round(mm * MM_TO_PX * zoom);
      const isMajor = mm % 10 === 0;
      const w = isMajor ? 12 : 8;
      ticks.push(
        <div key={`l-${mm}`} className="absolute right-0 border-b border-border" style={{ top: y, width: w }} />
      );
      if (isMajor) {
        ticks.push(
          <div
            key={`ll-${mm}`}
            className="absolute text-[10px] text-muted-foreground select-none"
            style={{ top: y - 5, right: w + 2 }}
          >
            {mm}
          </div>
        );
      }
    }
    return (
      <div className="absolute left-0 top-0 bg-muted/70" style={{ width: 24, height: scaledHeight }}>
        <div className="relative w-full h-full">{ticks}</div>
      </div>
    );
  };

  const handleStyle = "bg-accent rounded-sm shadow-sm border border-border";
  const lineStyle = "border-dashed border border-border";

  return (
    <div ref={containerRef} className="pointer-events-none" style={{ position: "absolute", left: 0, top: 0, width: scaledWidth, height: scaledHeight }}>
      {/* Rulers */}
      {renderTopRuler()}
      {renderLeftRuler()}

      {/* Margin guides (lines) */}
      {/* Top */}
      <div className={`absolute left-0 ${lineStyle}`} style={{ top: topPx, width: scaledWidth, height: 0 }} />
      {/* Bottom */}
      <div className={`absolute left-0 ${lineStyle}`} style={{ top: scaledHeight - bottomPx, width: scaledWidth, height: 0 }} />
      {/* Left */}
      <div className={`absolute top-0 ${lineStyle}`} style={{ left: leftPx, height: scaledHeight, width: 0 }} />
      {/* Right */}
      <div className={`absolute top-0 ${lineStyle}`} style={{ left: scaledWidth - rightPx, height: scaledHeight, width: 0 }} />

      {/* Draggable handles (enable pointer events only on them) */}
      {/* Top handle */}
      <div
        role="slider"
        aria-label="Margem superior"
        className={`absolute ${handleStyle} pointer-events-auto`}
        style={{ left: 30, top: Math.max(0, topPx - 4), width: scaledWidth - 60, height: 6, cursor: "ns-resize" }}
        onPointerDown={() => setDragging("top")}
      />
      {/* Bottom handle */}
      <div
        role="slider"
        aria-label="Margem inferior"
        className={`absolute ${handleStyle} pointer-events-auto`}
        style={{ left: 30, top: Math.max(0, scaledHeight - bottomPx - 2), width: scaledWidth - 60, height: 6, cursor: "ns-resize" }}
        onPointerDown={() => setDragging("bottom")}
      />
      {/* Left handle */}
      <div
        role="slider"
        aria-label="Margem esquerda"
        className={`absolute ${handleStyle} pointer-events-auto`}
        style={{ top: 30, left: Math.max(0, leftPx - 4), height: scaledHeight - 60, width: 6, cursor: "ew-resize" }}
        onPointerDown={() => setDragging("left")}
      />
      {/* Right handle */}
      <div
        role="slider"
        aria-label="Margem direita"
        className={`absolute ${handleStyle} pointer-events-auto`}
        style={{ top: 30, left: Math.max(0, scaledWidth - rightPx - 2), height: scaledHeight - 60, width: 6, cursor: "ew-resize" }}
        onPointerDown={() => setDragging("right")}
      />
    </div>
  );
}
