import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ZoomIn, ZoomOut, FilePlus2, FileText } from "lucide-react";
import PageFrames from "@/components/PageFrames";
import RulerTop from "@/components/RulerTop";
import RulerLeft from "@/components/RulerLeft";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
interface EditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  content: string; // HTML
  onContentChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  headerContent?: string; // HTML
  footerContent?: string; // HTML
  onHeaderChange?: (v: string) => void;
  onFooterChange?: (v: string) => void;
  headerHeightMm?: number;
  footerHeightMm?: number;
  // Novos: preferências do documento
  initialMargins?: { top: number; right: number; bottom: number; left: number };
  initialPaperId?: "A4" | "OFICIO" | "LEGAL";
  onMarginsChange?: (m: { top: number; right: number; bottom: number; left: number }) => void;
  onPaperChange?: (p: "A4" | "OFICIO" | "LEGAL") => void;
}

// Conversões e tamanhos de papel
const MM_TO_PX = 3.7795; // 1mm em pixels (~96dpi)
const PAPER_SIZES = {
  A4: { id: "A4", label: "A4 (210 × 297 mm)", widthMm: 210, heightMm: 297 },
  OFICIO: { id: "OFICIO", label: "Ofício (216 × 330 mm)", widthMm: 216, heightMm: 330 },
  LEGAL: { id: "LEGAL", label: "Legal (216 × 356 mm)", widthMm: 216, heightMm: 356 },
} as const;
type PaperId = keyof typeof PAPER_SIZES;
export default function MarkdownEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  onSave,
  onCancel,
  headerContent,
  footerContent,
  onHeaderChange,
  onFooterChange,
  headerHeightMm = 15,
  footerHeightMm = 15,
  initialMargins,
  initialPaperId,
  onMarginsChange,
  onPaperChange,
}: EditorProps) {
  const quillRef = useRef<ReactQuill | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0); // página visível
  const [paperId, setPaperId] = useState<PaperId>((initialPaperId as PaperId) ?? "A4");
  const paper = PAPER_SIZES[paperId];
  const widthPx = Math.round(paper.widthMm * MM_TO_PX);
  const heightPx = Math.round(paper.heightMm * MM_TO_PX);
  const scaledWidth = Math.round(widthPx * zoom);
  const scaledHeight = Math.round(heightPx * zoom);
  // Réguas e margens ajustáveis via marcadores (mm)
  const [margins, setMargins] = useState(initialMargins ?? { top: 25, right: 25, bottom: 25, left: 25 });
  const marginPx = useMemo(() => ({
    top: Math.round(margins.top * MM_TO_PX),
    right: Math.round(margins.right * MM_TO_PX),
    bottom: Math.round(margins.bottom * MM_TO_PX),
    left: Math.round(margins.left * MM_TO_PX),
  }), [margins]);
  const scaledTopMarginPx = Math.round(margins.top * MM_TO_PX * zoom);
  // Espaçamento visual entre páginas (mm)
  const PAGE_GAP_MM = 24;
  const pageGapPx = Math.round(PAGE_GAP_MM * MM_TO_PX);
  const scaledGap = Math.round(pageGapPx * zoom);

  const showRulers = !isMobile;
  const RULER_SIZE = 24;
  const modules = useMemo(
    () => ({
      toolbar: { container: "#doc-toolbar" },
      clipboard: { matchVisual: true },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
    "indent",
    "clean",
    "table",
  ];

  useEffect(() => {
    // Mobile: iniciar sempre em 100% (1.0), igual ao desktop
    if (isMobile) setZoom(1);
  }, [isMobile]);

  // Sincroniza valores iniciais vindos de fora (ex.: ao abrir outro documento)
  useEffect(() => {
    if (initialMargins) setMargins(initialMargins);
  }, [initialMargins?.top, initialMargins?.right, initialMargins?.bottom, initialMargins?.left]);
  useEffect(() => {
    if (initialPaperId) setPaperId(initialPaperId as PaperId);
  }, [initialPaperId]);

  // Evita "corte" no topo ao abrir: rola para o início
  useEffect(() => {
    const s = scrollerRef.current;
    if (!s) return;
    setTimeout(() => {
      try { (s as any).scrollTo({ top: 0, behavior: 'instant' }); } catch { s.scrollTop = 0; }
    }, 0);
  }, []);
  const recalcPages = () => {
    const root = pageRef.current?.querySelector(".main-editor .ql-editor") as HTMLElement | null;
    if (!root) { setPages(1); return; }

    const pageContentHeight = Math.max(1, heightPx - marginPx.top - marginPx.bottom);

    // Calcula a última posição de conteúdo útil, ignorando parágrafos vazios e marcadores de quebra
    let lastBottom = marginPx.top; // início da área útil
    const children = Array.from(root.children) as HTMLElement[];
    const isEmpty = (el: HTMLElement) => {
      if (el.classList.contains("page-break")) return true;
      if (el.tagName === "P") {
        const html = el.innerHTML.replace(/\s|&nbsp;/g, "");
        if (!html || html === "<br>" || html === "<br/>" || html === "<br />") return true;
      }
      if (el.textContent?.trim() === "" && el.querySelectorAll("img, table, iframe, video, audio, svg").length === 0) {
        return true;
      }
      return false;
    };
    for (const el of children) {
      if (isEmpty(el)) continue;
      lastBottom = Math.max(lastBottom, el.offsetTop + el.offsetHeight);
    }
    const contentInnerHeight = Math.max(0, lastBottom - marginPx.top);
    const epsilon = 4; // evita página extra por arredondamento/bordas
    const pagesCount = Math.max(1, Math.ceil(Math.max(0, contentInnerHeight - epsilon) / pageContentHeight));
    setPages(pagesCount);
  };
  useEffect(() => {
    const observer = new ResizeObserver(() => recalcPages());
    const root = pageRef.current?.querySelector(".ql-editor") as HTMLElement | null;
    if (root) observer.observe(root);
    recalcPages();
    return () => observer.disconnect();
  }, []);
  useEffect(() => { recalcPages(); }, [content, zoom, heightPx, margins.top, margins.right, margins.bottom, margins.left]);

  // Atualiza página atual conforme rolagem
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
      const onScroll = () => {
        const pageStep = scaledHeight + scaledGap;
        const centerY = scroller.scrollTop + scroller.clientHeight / 2;
        const idx = Math.max(0, Math.min(pages - 1, Math.floor(centerY / Math.max(1, pageStep))));
        setCurrentPage(idx);
      };
    scroller.addEventListener("scroll", onScroll, { passive: true } as any);
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [pages, scaledHeight, scaledGap]);

  // Remoção automática de linhas vazias no fim (reduz páginas em branco)
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Backspace" || e.key === "Delete") {
        setTimeout(() => {
          const q = quillRef.current?.getEditor();
          if (!q) return;
          const text = q.getText();
          const trimmed = text.replace(/[ \t\r\n]+$/g, "\n");
          if (trimmed.length < text.length) {
            q.deleteText(trimmed.length, text.length - trimmed.length);
          }
          recalcPages();
        }, 0);
      }
    };
    quill.root.addEventListener("keydown", handler as any);
    return () => quill.root.removeEventListener("keydown", handler as any);
  }, [content]);
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)));

  const insertPageBreakBeforeSelection = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection(true);
    const index = range?.index ?? quill.getLength();
    // Insere marcador de quebra no início da seleção (ou no cursor)
    quill.clipboard.dangerouslyPasteHTML(index, '<p class="page-break"></p>');

    // Ajusta altura do marcador para "pular" visualmente para a próxima página
    setTimeout(() => {
      const root = pageRef.current?.querySelector(".ql-editor") as HTMLElement | null;
      const breaks = root?.querySelectorAll("p.page-break");
      const el = (breaks && breaks[breaks.length - 1]) as HTMLElement | undefined;
      if (!root || !el) return;

      const pageInnerHeight = Math.max(1, heightPx - marginPx.top - marginPx.bottom);
      const offsetY = el.offsetTop - marginPx.top; // desconta o padding superior (margem superior)
      const remainder = ((offsetY % pageInnerHeight) + pageInnerHeight) % pageInnerHeight;
      const interGap = marginPx.bottom + pageGapPx + marginPx.top; // espaço entre páginas (margem inferior + gap + margem superior)
      const spacer = (remainder === 0 ? 0 : pageInnerHeight - remainder) + interGap;
      el.style.height = `${spacer}px`;

      recalcPages();
      try { el.scrollIntoView({ block: "start", behavior: "smooth" }); } catch {}
    }, 0);
  };

  // Garante que nenhum texto fique nas margens inferior/topo da próxima página inserindo espaçadores automáticos
  const enforceFlowWithinMargins = () => {
    const root = pageRef.current?.querySelector(".ql-editor") as HTMLElement | null;
    if (!root) return;

    // Remove quebras automáticas antigas
    root.querySelectorAll("p.page-break[data-auto='1']").forEach((el) => el.remove());

    const pageInnerHeight = Math.max(1, heightPx - marginPx.top - marginPx.bottom);
    const interGap = marginPx.bottom + pageGapPx + marginPx.top; // zona proibida entre páginas

    // Limite inferior da 1ª página (fim da área útil)
    let boundary = marginPx.top + pageInnerHeight;

    const findFirstChildAtOrAfter = (y: number): HTMLElement | null => {
      let el = root.firstElementChild as HTMLElement | null;
      while (el) {
        if (!el.classList.contains("page-break") && el.offsetTop >= y) return el;
        el = el.nextElementSibling as HTMLElement | null;
      }
      return null;
    };

    let guard = 0;
    while (guard++ < 1000) {
      const el = findFirstChildAtOrAfter(boundary);
      if (!el) break;

      // Se já está após a faixa de margem+gap, avança para a próxima página
      if (el.offsetTop >= boundary + interGap - 1) {
        boundary += interGap + pageInnerHeight;
        continue;
      }

      // Precisa empurrar este elemento para depois da zona proibida
      const gapNeeded = boundary + interGap - el.offsetTop;
      const br = document.createElement("p");
      br.className = "page-break";
      br.setAttribute("data-auto", "1");
      br.style.height = `${gapNeeded}px`;
      el.parentElement?.insertBefore(br, el);

      boundary += interGap + pageInnerHeight;
    }

    recalcPages();
  };

  // Remove quebras manuais e parágrafos vazios no final do documento
  const cleanupTrailingBreaks = () => {
    const root = pageRef.current?.querySelector('.ql-editor') as HTMLElement | null;
    if (!root) return;

    const quill = quillRef.current?.getEditor();
    const sel = quill?.getSelection();
    const length = quill?.getLength() ?? 0;
    const selectionAtEnd = !!sel && sel.index >= Math.max(0, length - 1);

    let changed = false;
    let removedEmptyCount = 0;

    while (root.lastElementChild) {
      const el = root.lastElementChild as HTMLElement;
      const html = (el.innerHTML || '').replace(/\s|&nbsp;/g, '');
      const isEmptyPara = el.tagName === 'P' && (html === '' || html === '<br>' || html === '<br/>' || html === '<br />');

      // Sempre remover page-break no final
      if (el.classList.contains('page-break')) {
        el.remove();
        changed = true;
        continue;
      }

      // Se o cursor está no fim, preserva um único parágrafo vazio para permitir nova linha ao digitar
      if (selectionAtEnd && isEmptyPara && removedEmptyCount === 0) {
        break; // mantém 1 <p> vazio no final
      }

      if (isEmptyPara) {
        el.remove();
        removedEmptyCount++;
        changed = true;
        continue;
      }
      break;
    }

    if (changed) recalcPages();
  };

  useEffect(() => {
    const t = setTimeout(() => enforceFlowWithinMargins(), 0);
    return () => clearTimeout(t);
  }, [content, marginPx.top, marginPx.bottom, marginPx.left, marginPx.right, pageGapPx, heightPx]);

  // Recalcula em qualquer mudança de texto (inclusive colar/apagar) e elimina página vazia imediatamente
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const onChange = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        cleanupTrailingBreaks();
        recalcPages();
        enforceFlowWithinMargins();
      });
    };
    quill.on('text-change', onChange);
    return () => {
      quill.off('text-change', onChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [heightPx, marginPx.top, marginPx.bottom, pageGapPx]);

  const exportPdf = () => {
    const root = pageRef.current?.querySelector(".ql-editor") as HTMLElement | null;
    const html = root?.innerHTML || content || "";
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    const marginCss = `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`;
    const sizeCss = `${paper.widthMm}mm ${paper.heightMm}mm`;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>${title || "Documento"}</title>
      <style>
        @page { size: ${sizeCss}; margin: ${marginCss}; }
        .ql-editor { line-height: 1.6; }
        .page-break { break-after: page; }
        body { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
      </style>
    </head><body>
      <div class="ql-editor">${html}</div>
    </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };
  return (
    <div className="space-y-3">
      {/* Barra de título e ações */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Título do documento"
          />
          <Button onClick={onSave}>Salvar</Button>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button variant="secondary" onClick={exportPdf}>Exportar PDF</Button>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap flex-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="icon" onClick={zoomOut} className="h-8 w-8"><ZoomOut className="w-4 h-4"/></Button>
            <Button variant="outline" size="icon" onClick={zoomIn} className="h-8 w-8"><ZoomIn className="w-4 h-4"/></Button>
            <span className="min-w-[70px] text-center">{Math.round(zoom*100)}%</span>
          </div>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex items-center gap-2 shrink-0">
            <FileText className="w-4 h-4 text-primary"/>
            <span className="hidden sm:inline">{pages} página(s) {PAPER_SIZES[paperId].id}</span>
            <span className="sm:hidden inline">{pages}p {PAPER_SIZES[paperId].id}</span>
          </div>
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <div className="flex items-center gap-2 min-w-[180px] sm:min-w-[220px] shrink-0">
            <span>Tamanho</span>
            <Select value={paperId} onValueChange={(v) => { setPaperId(v as PaperId); onPaperChange?.(v as any); }}>
              <SelectTrigger className="w-[140px] sm:w-[170px] h-8"><SelectValue placeholder="Selecione o papel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">{PAPER_SIZES.A4.label}</SelectItem>
                <SelectItem value="OFICIO">{PAPER_SIZES.OFICIO.label}</SelectItem>
                <SelectItem value="LEGAL">{PAPER_SIZES.LEGAL.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={insertPageBreakBeforeSelection} className="shrink-0">
            <FilePlus2 className="w-4 h-4 mr-2"/> <span className="hidden sm:inline">Nova página</span>
          </Button>
        </div>
      </div>

      {/* Editor centralizado estilo “folha” */}
      <Card>
        <CardContent className="p-4">
          {/* Toolbar fixa acima da régua */}
          <div id="doc-toolbar" className="ql-toolbar ql-snow sticky top-0 z-30 mb-3 rounded-md border bg-card overflow-x-auto whitespace-nowrap">
            <span className="ql-formats">
              <select className="ql-header">
                <option value="">Normal</option>
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
              </select>
            </span>
            <span className="ql-formats">
              <button className="ql-bold" />
              <button className="ql-italic" />
              <button className="ql-underline" />
              <button className="ql-strike" />
            </span>
            <span className="ql-formats">
              <button className="ql-list" value="ordered" />
              <button className="ql-list" value="bullet" />
            </span>
            <span className="ql-formats">
              <button className="ql-align" value="" />
              <button className="ql-align" value="center" />
              <button className="ql-align" value="right" />
              <button className="ql-align" value="justify" />
            </span>
            <span className="ql-formats">
              <button className="ql-link" />
              <button className="ql-clean" />
            </span>
          </div>

          <div ref={scrollerRef} className="rounded-lg p-2 sm:p-4 border bg-muted h-[75dvh] sm:h-[70vh] overflow-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
            <div
              className="relative mx-auto"
              style={{ width: scaledWidth + (showRulers ? RULER_SIZE : 0) }}
            >
              {/* Overlay de réguas sincronizadas com a página visível */}
              {showRulers && (
                <div
                  className="pointer-events-none absolute inset-0 z-10"
                  style={{ top: 0, height: pages * scaledHeight + Math.max(0, pages - 1) * scaledGap + RULER_SIZE }}
                >
                  {/* Régua horizontal alinhada ao topo da página atual */}
                  <div
                    className="absolute pointer-events-auto"
                    style={{ left: RULER_SIZE, top: currentPage * (scaledHeight + scaledGap) }}
                  >
                    <RulerTop
                      widthPx={widthPx}
                      zoom={zoom}
                      leftMarginMm={margins.left}
                      rightMarginMm={margins.right}
                      onChange={(l, r) => setMargins((m) => { const next = { ...m, left: l, right: r }; onMarginsChange?.(next); return next; })}
                    />
                  </div>
                  {/* Régua vertical alinhada à página atual */}
                  <div className="absolute pointer-events-auto" style={{ left: 0, top: currentPage * (scaledHeight + scaledGap) + RULER_SIZE }}>
                    <RulerLeft
                      heightPx={heightPx}
                      zoom={zoom}
                      topMarginMm={margins.top}
                      bottomMarginMm={margins.bottom}
                      onChange={(t, b) => setMargins((m) => { const next = { ...m, top: t, bottom: b }; onMarginsChange?.(next); return next; })}
                    />
                  </div>
                </div>
              )}

              {/* Linha de conteúdo */}
              <div className="flex">
                {showRulers && <div style={{ width: RULER_SIZE }} />}
                <div
                  ref={pageRef}
                  style={{
                    position: "relative",
                    width: widthPx,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    marginLeft: 0,
                    marginTop: showRulers ? RULER_SIZE : 0,
                    ["--m-top" as any]: `${marginPx.top}px`,
                    ["--m-right" as any]: `${marginPx.right}px`,
                    ["--m-bottom" as any]: `${marginPx.bottom}px`,
                    ["--m-left" as any]: `${marginPx.left}px`,
                    ["--page-height-px" as any]: `${heightPx}px`,
                  }}
                >
                  {/* Page frames behind the editor content */}
                  <PageFrames widthPx={widthPx} heightPx={heightPx} pages={pages} zoom={zoom} pageGapPx={pageGapPx} marginPx={marginPx} />

                  {/* Main content editor */}
                  <ReactQuill
                    ref={quillRef as any}
                    theme="snow"
                    value={content}
                    onChange={onContentChange}
                    modules={modules}
                    formats={formats}
                    className="main-editor [&_.ql-container]:bg-transparent [&_.ql-container]:rounded-none [&_.ql-container]:border-0 [&_.ql-container]:shadow-none [&_.ql-editor]:text-[hsl(var(--paper-foreground))]"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Estilos específicos do editor */}
      <style>{`
        .ql-snow { background: transparent; }
        .ql-toolbar.ql-snow { border-color: hsl(var(--border)); background: hsl(var(--card)); }
        .ql-toolbar .ql-stroke { stroke: hsl(var(--card-foreground)); }
        .ql-toolbar .ql-picker { color: hsl(var(--card-foreground)); }
        .ql-container, .ql-editor { min-height: calc(var(--page-height-px, 1123px) - var(--m-top, 28px) - var(--m-bottom, 28px)); }
        .ql-editor { 
          padding: var(--m-top, 28px) var(--m-right, 32px) var(--m-bottom, 28px) var(--m-left, 32px);
          line-height: 1.6;
          color: hsl(var(--paper-foreground));
        }
        .ql-editor.ql-blank::before { color: hsl(var(--muted-foreground)); opacity: 0.9; }
        .page-break {
          display: block;
          height: 0; /* ajustado dinamicamente via inline style */
          margin: 0;
          border: 0;
        }
        /* Ajustes de densidade para telas pequenas */
        @media (max-width: 640px) {
          #doc-toolbar { padding: 6px 8px; }
          #doc-toolbar .ql-formats { margin-right: 6px; }
          #doc-toolbar .ql-formats button { width: 28px; height: 28px; padding: 0; }
          #doc-toolbar .ql-picker-label { padding: 0 6px; }
        }
        @media print { .page-break { break-after: page; height: 0 !important; border: 0 !important; margin: 0 !important; } }
      `}</style>
    </div>
  );
}
