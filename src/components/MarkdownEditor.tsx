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
}: EditorProps) {
  const quillRef = useRef<ReactQuill | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0); // página visível
  const [paperId, setPaperId] = useState<PaperId>("A4");
  const paper = PAPER_SIZES[paperId];
  const widthPx = Math.round(paper.widthMm * MM_TO_PX);
  const heightPx = Math.round(paper.heightMm * MM_TO_PX);
  const scaledWidth = Math.round(widthPx * zoom);
  const scaledHeight = Math.round(heightPx * zoom);
  // Réguas e margens ajustáveis via marcadores (mm)
  const [margins, setMargins] = useState({ top: 25, right: 25, bottom: 25, left: 25 });
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
    // Ajuste automático no mobile para caber na largura
    if (!isMobile) return;
    const computeFit = () => {
      const w = scrollerRef.current?.clientWidth || 0;
      if (!w) return;
      const available = Math.max(0, w - 16);
      const fit = available / widthPx;
      setZoom(+Math.max(0.6, Math.min(1.5, fit)).toFixed(2));
    };
    computeFit();
    window.addEventListener("resize", computeFit);
    return () => window.removeEventListener("resize", computeFit);
  }, [isMobile, widthPx]);
  const recalcPages = () => {
    const root = pageRef.current?.querySelector(".main-editor .ql-editor") as HTMLElement | null;
    if (!root) { setPages(1); return; }
    // Altura do conteúdo + paddings (já inclusos no scrollHeight)
    const contentHeight = root.scrollHeight;
    const pageContentHeight = Math.max(1, heightPx - marginPx.top - marginPx.bottom);
    const effectiveContent = Math.max(0, contentHeight - marginPx.top - marginPx.bottom);
    const pagesCount = Math.max(1, Math.ceil(effectiveContent / pageContentHeight));
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
        const idx = Math.max(0, Math.min(pages - 1, Math.floor(scroller.scrollTop / Math.max(1, pageStep))));
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

  const insertPageBreak = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const index = quill.getSelection()?.index ?? quill.getLength();
    // Inserir marcador de quebra (visível e com quebra real ao imprimir)
    quill.clipboard.dangerouslyPasteHTML(
      index,
      '<p class="page-break">— Quebra de página —</p>'
    );
  };

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
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} className="h-8 w-8"><ZoomOut className="w-4 h-4"/></Button>
            <Button variant="outline" size="icon" onClick={zoomIn} className="h-8 w-8"><ZoomIn className="w-4 h-4"/></Button>
            <span className="min-w-[70px] text-center">{Math.round(zoom*100)}%</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary"/>
            <span>{pages} página(s) {PAPER_SIZES[paperId].id}</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 min-w-[220px]">
            <span>Tamanho</span>
            <Select value={paperId} onValueChange={(v) => setPaperId(v as PaperId)}>
              <SelectTrigger className="w-[170px] h-8"><SelectValue placeholder="Selecione o papel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">{PAPER_SIZES.A4.label}</SelectItem>
                <SelectItem value="OFICIO">{PAPER_SIZES.OFICIO.label}</SelectItem>
                <SelectItem value="LEGAL">{PAPER_SIZES.LEGAL.label}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={insertPageBreak}>
            <FilePlus2 className="w-4 h-4 mr-2"/> Inserir quebra de página
          </Button>
        </div>
      </div>

      {/* Editor centralizado estilo “folha” */}
      <Card>
        <CardContent className="p-4">
          {/* Toolbar fixa acima da régua */}
          <div id="doc-toolbar" className="ql-toolbar ql-snow sticky top-0 z-20 mb-3 rounded-md border bg-card">
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

          <div ref={scrollerRef} className="rounded-lg p-4 border bg-muted h-[70vh] overflow-auto">
            <div
              className="relative mx-auto"
              style={{ width: scaledWidth + (showRulers ? RULER_SIZE : 0) }}
            >
              {/* Overlay de réguas sincronizadas com a página visível */}
              {showRulers && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{ height: pages * scaledHeight + Math.max(0, pages - 1) * scaledGap }}
                >
                  {/* Régua horizontal alinhada ao topo da página atual */}
                  <div
                    className="absolute pointer-events-auto"
                    style={{ left: RULER_SIZE, top: currentPage * (scaledHeight + scaledGap) - RULER_SIZE }}
                  >
                    <RulerTop
                      widthPx={widthPx}
                      zoom={zoom}
                      leftMarginMm={margins.left}
                      rightMarginMm={margins.right}
                      onChange={(l, r) => setMargins((m) => ({ ...m, left: l, right: r }))}
                    />
                  </div>
                  {/* Régua vertical alinhada à página atual */}
                  <div className="absolute pointer-events-auto" style={{ left: 0, top: currentPage * (scaledHeight + scaledGap) }}>
                    <RulerLeft
                      heightPx={heightPx}
                      zoom={zoom}
                      topMarginMm={margins.top}
                      bottomMarginMm={margins.bottom}
                      onChange={(t, b) => setMargins((m) => ({ ...m, top: t, bottom: b }))}
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
                    zoom: zoom as any,
                    transformOrigin: "top left",
                    marginLeft: 0,
                    marginTop: 0,
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
                    className="main-editor [&_.ql-container]:bg-transparent [&_.ql-container]:rounded-md [&_.ql-container]:shadow-none [&_.ql-editor]:text-[hsl(var(--paper-foreground))]"
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
        .ql-container.ql-snow { border-color: hsl(var(--border)); background: transparent; }
        .ql-container, .ql-editor { min-height: var(--page-height-px, 1123px); }
        .ql-editor { 
          padding: var(--m-top, 28px) var(--m-right, 32px) var(--m-bottom, 28px) var(--m-left, 32px);
          line-height: 1.6;
          color: hsl(var(--paper-foreground));
        }
        .ql-editor.ql-blank::before { color: hsl(var(--muted-foreground)); opacity: 0.9; }
        .page-break { 
          border-top: 1px dashed hsl(var(--muted-foreground)); 
          margin: 24px 0; 
          color: hsl(var(--muted-foreground)); 
          text-align: center; 
        }
        @media print { .page-break { break-after: page; } }
      `}</style>
    </div>
  );
}
