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

  const totalWords = React.useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [text]);

  const currentIndex = React.useMemo(() => {
    if (totalWords <= 0) return -1;
    const idx = Math.floor(Math.max(0, Math.min(1, progress)) * totalWords);
    return Math.min(totalWords - 1, idx);
  }, [progress, totalWords]);

  const computePosition = React.useCallback(() => {
    const container = containerRef.current;
    if (!container || totalWords <= 0 || currentIndex < 0) {
      setStyle((s) => ({ ...s, visible: false }));
      return;
    }

    try {
      // Walk text nodes inside the container to locate the Nth word
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      let node: Node | null = walker.nextNode();
      let wordCounter = 0;
      const wordRegex = /\S+/g; // non-whitespace sequences

      while (node) {
        const textNode = node as Text;
        const value = textNode.nodeValue || "";
        let match: RegExpExecArray | null;
        wordRegex.lastIndex = 0;
        while ((match = wordRegex.exec(value)) !== null) {
          if (wordCounter === currentIndex) {
            const range = document.createRange();
            range.setStart(textNode, match.index);
            range.setEnd(textNode, match.index + match[0].length);
            const rects = range.getClientRects();
            const rect = rects[0] || range.getBoundingClientRect();
            range.detach?.();

            if (rect && rect.width > 0 && rect.height > 0) {
              const containerRect = container.getBoundingClientRect();
              const left = rect.left - containerRect.left;
              const top = rect.bottom - containerRect.top - thicknessPx; // place just under text
              const width = rect.width;
              setStyle({ left, top, width, visible: true });
              return;
            }
          }
          wordCounter++;
        }
        node = walker.nextNode();
      }

      // If not found
      setStyle((s) => ({ ...s, visible: false }));
    } catch (e) {
      setStyle((s) => ({ ...s, visible: false }));
    }
  }, [containerRef, currentIndex, thicknessPx, totalWords]);

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
