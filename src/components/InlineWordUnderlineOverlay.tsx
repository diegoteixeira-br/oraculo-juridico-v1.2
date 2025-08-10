import React from "react";

interface InlineWordUnderlineOverlayProps {
  containerRef: React.RefObject<HTMLElement>;
  text: string;
  progress: number; // 0..1
  thicknessPx?: number;
  className?: string;
}

// Underlines only the CURRENT word inside the original rendered content
// Finds the nth non-whitespace token in the DOM and draws an underline overlay positioned under it
const InlineWordUnderlineOverlay: React.FC<InlineWordUnderlineOverlayProps> = ({
  containerRef,
  text,
  progress,
  thicknessPx = 2,
  className,
}) => {
  const [style, setStyle] = React.useState<{ left: number; top: number; width: number; visible: boolean }>({
    left: 0,
    top: 0,
    width: 0,
    visible: false,
  });

  // We derive word counts directly from the DOM so we only count what is actually visible/speakable
  // (avoids desync when audio skips markdown/code etc.)

  const computePosition = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      setStyle((s) => ({ ...s, visible: false }));
      return;
    }

    try {
      // Count only speakable words: skip nodes inside code/pre/kbd/samp or aria-hidden content
      const isSkippable = (n: Node) => {
        const el = (n.parentElement || (n as any).parentNode) as HTMLElement | null;
        if (!el) return false;
        if (el.closest('code, pre, kbd, samp, [aria-hidden="true"], .sr-only, .visually-hidden')) return true;
        return false;
      };

      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      const wordRegex = /\S+/g; // non-whitespace sequences

      // First pass: count speakable words
      let total = 0;
      while (node) {
        if (!isSkippable(node)) {
          const value = (node as Text).nodeValue || "";
          wordRegex.lastIndex = 0;
          while (wordRegex.exec(value) !== null) total++;
        }
        node = walker.nextNode();
      }

      if (total === 0) {
        setStyle((s) => ({ ...s, visible: false }));
        return;
      }

      const clamped = Math.max(0, Math.min(1, progress));
      let targetIndex = Math.floor(clamped * total);
      if (targetIndex >= total) targetIndex = total - 1;

      // Second pass: locate target word rect
      const walker2 = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node2: Node | null = walker2.nextNode();
      let wordCounter = 0;
      while (node2) {
        if (!isSkippable(node2)) {
          const textNode = node2 as Text;
          const value = textNode.nodeValue || "";
          let match: RegExpExecArray | null;
          wordRegex.lastIndex = 0;
          while ((match = wordRegex.exec(value)) !== null) {
            if (wordCounter === targetIndex) {
              const range = document.createRange();
              range.setStart(textNode, match.index);
              range.setEnd(textNode, match.index + match[0].length);
              const rects = range.getClientRects();
              const rect = rects[0] || range.getBoundingClientRect();
              range.detach?.();

              if (rect && rect.width > 0 && rect.height > 0) {
                const containerRect = container.getBoundingClientRect();
                const left = rect.left - containerRect.left;
                const top = rect.bottom - containerRect.top - thicknessPx;
                const width = rect.width;
                setStyle({ left, top, width, visible: true });
                return;
              }
            }
            wordCounter++;
          }
        }
        node2 = walker2.nextNode();
      }

      setStyle((s) => ({ ...s, visible: false }));
    } catch (e) {
      setStyle((s) => ({ ...s, visible: false }));
    }
  }, [containerRef, progress, thicknessPx]);

  React.useEffect(() => {
    computePosition();
  }, [computePosition]);

  React.useEffect(() => {
    const handler = () => computePosition();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [computePosition]);

  if (!style.visible) return null;

  const inlineStyle: React.CSSProperties = {
    position: "absolute",
    left: style.left,
    top: style.top,
    width: style.width,
    height: thicknessPx,
    backgroundColor: "hsl(var(--foreground))", // use semantic token color
    pointerEvents: "none",
    borderRadius: 1,
    opacity: 0.95,
  };

  return <div className={className} style={inlineStyle} aria-hidden="true" />;
};

export default InlineWordUnderlineOverlay;
