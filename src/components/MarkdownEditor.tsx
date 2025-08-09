import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ZoomIn, ZoomOut, FilePlus2, FileText } from "lucide-react";
import EditorRulers from "@/components/EditorRulers";

interface EditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  content: string; // HTML
  onContentChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

// Medidas aproximadas de A4 a ~96dpi
const A4_WIDTH_PX = 794;  // 210mm
const A4_HEIGHT_PX = 1123; // 297mm
const MM_TO_PX = 3.7795; // 1mm em pixels (~96dpi)

export default function MarkdownEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  onSave,
  onCancel,
}: EditorProps) {
  const quillRef = useRef<ReactQuill | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pages, setPages] = useState(1);
  // Margens em milímetros
  const [margins, setMargins] = useState({ top: 25, right: 25, bottom: 25, left: 25 });
  const marginPx = useMemo(() => ({
    top: Math.round(margins.top * MM_TO_PX),
    right: Math.round(margins.right * MM_TO_PX),
    bottom: Math.round(margins.bottom * MM_TO_PX),
    left: Math.round(margins.left * MM_TO_PX),
  }), [margins]);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link"],
        [{ indent: "-1" }, { indent: "+1" }],
        ["clean"],
      ],
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
  ];

  const recalcPages = () => {
    const root = pageRef.current?.querySelector(".ql-editor") as HTMLElement | null;
    if (!root) { setPages(1); return; }
    // Altura do conteúdo + paddings (já inclusos no scrollHeight)
    const contentHeight = root.scrollHeight;
    const pagesCount = Math.max(1, Math.ceil(contentHeight / A4_HEIGHT_PX));
    setPages(pagesCount);
  };

  useEffect(() => {
    const observer = new ResizeObserver(() => recalcPages());
    const root = pageRef.current?.querySelector(".ql-editor") as HTMLElement | null;
    if (root) observer.observe(root);
    recalcPages();
    return () => observer.disconnect();
  }, []);

  useEffect(() => { recalcPages(); }, [content, zoom, margins.top, margins.right, margins.bottom, margins.left]);

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
    w.document.write(`<!doctype html><html><head><meta charset="utf-8" />
      <title>${title || "Documento"}</title>
      <style>
        @page { size: A4; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
        .ql-editor { line-height: 1.6; }
        .page-break { break-after: page; }
        body { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
      </style>
    </head><body><div class="ql-editor">${html}</div></body></html>`);
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
            <span>{pages} página(s) A4</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <span>Margem (todas)</span>
            <Input
              type="number"
              className="w-20 h-8"
              min={0}
              max={50}
              step={1}
              value={margins.top}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setMargins({ top: v, right: v, bottom: v, left: v });
              }}
            />
            <span>mm</span>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <Button variant="outline" size="sm" onClick={insertPageBreak}>
            <FilePlus2 className="w-4 h-4 mr-2"/> Inserir quebra de página
          </Button>
        </div>
      </div>

      {/* Editor centralizado estilo “folha” */}
      <Card>
        <CardContent className="p-4">
          <div className="rounded-lg p-4 border bg-card h-[70vh] overflow-auto">
            <div className="relative mx-auto" style={{ width: Math.round(A4_WIDTH_PX * zoom) }}>
              <EditorRulers
                widthPx={A4_WIDTH_PX}
                heightPx={A4_HEIGHT_PX}
                zoom={zoom}
                marginsMm={margins}
                onChange={setMargins}
              />
              <div
                ref={pageRef}
                style={{
                  width: A4_WIDTH_PX,
                  zoom: zoom as any,
                  transformOrigin: "top left",
                  ["--m-top" as any]: `${marginPx.top}px`,
                  ["--m-right" as any]: `${marginPx.right}px`,
                  ["--m-bottom" as any]: `${marginPx.bottom}px`,
                  ["--m-left" as any]: `${marginPx.left}px`,
                }}
              >
                <ReactQuill
                  ref={quillRef as any}
                  theme="snow"
                  value={content}
                  onChange={onContentChange}
                  modules={modules}
                  formats={formats}
                  className="[&_.ql-container]:min-h-[1123px] [&_.ql-container]:bg-[hsl(var(--paper))] [&_.ql-container]:rounded-md [&_.ql-container]:shadow [&_.ql-editor]:min-h-[1123px] [&_.ql-editor]:text-[hsl(var(--paper-foreground))]"
                />
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
        .ql-container.ql-snow { border-color: hsl(var(--border)); background: hsl(var(--paper)); }
        .ql-editor { 
          padding: var(--m-top, 28px) var(--m-right, 32px) var(--m-bottom, 28px) var(--m-left, 32px);
          line-height: 1.6;
          color: hsl(var(--paper-foreground));
          background-image: linear-gradient(
            to bottom,
            transparent calc(${A4_HEIGHT_PX}px - 1px),
            hsl(var(--border)) calc(${A4_HEIGHT_PX}px - 1px)
          );
          background-size: 100% ${A4_HEIGHT_PX}px;
          background-repeat: repeat-y;
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
