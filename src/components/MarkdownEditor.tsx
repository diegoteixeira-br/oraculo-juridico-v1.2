import { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ZoomIn, ZoomOut, FilePlus2, FileText } from "lucide-react";

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

  useEffect(() => { recalcPages(); }, [content, zoom]);

  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)));

  const insertPageBreak = () => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const index = quill.getSelection()?.index ?? quill.getLength();
    // Inserir marcador de quebra (visível e com quebra real ao imprimir)
    quill.clipboard.dangerouslyPasteHTML(
      index,
      '<p class="page-break" style="border-top:1px dashed #94a3b8;margin:24px 0;color:#94a3b8;text-align:center">— Quebra de página —</p>'
    );
  };

  const exportPdf = () => {
    const root = pageRef.current?.querySelector(".ql-editor") as HTMLElement | null;
    const html = root?.innerHTML || content || "";
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset=\"utf-8\" />
      <title>${title || "Documento"}</title>
      <style>
        @page { size: A4; margin: 25mm; }
        .ql-editor { line-height: 1.6; }
        .page-break { break-after: page; }
        body { font-family: 'Times New Roman', Times, serif; }
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
            className="bg-slate-700 border-slate-600 text-white"
          />
          <Button onClick={onSave} className="bg-primary hover:bg-primary/90">Salvar</Button>
          <Button variant="outline" onClick={onCancel} className="border-slate-600 hover:bg-slate-700">Cancelar</Button>
          <Button variant="secondary" onClick={exportPdf}>Exportar PDF</Button>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} className="h-8 w-8 border-slate-600"><ZoomOut className="w-4 h-4"/></Button>
            <Button variant="outline" size="icon" onClick={zoomIn} className="h-8 w-8 border-slate-600"><ZoomIn className="w-4 h-4"/></Button>
            <span className="min-w-[70px] text-center">{Math.round(zoom*100)}%</span>
          </div>
          <Separator className="bg-slate-600 h-6" orientation="vertical" />
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary"/>
            <span>{pages} página(s) A4</span>
          </div>
          <Separator className="bg-slate-600 h-6" orientation="vertical" />
          <Button variant="outline" size="sm" onClick={insertPageBreak} className="border-slate-600 hover:bg-slate-700">
            <FilePlus2 className="w-4 h-4 mr-2"/> Inserir quebra de página
          </Button>
        </div>
      </div>

      {/* Editor centralizado estilo “folha” */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="bg-slate-900 rounded-lg p-4">
            <div
              ref={pageRef}
              className="mx-auto"
              style={{ width: A4_WIDTH_PX, transform: `scale(${zoom})`, transformOrigin: "top center" }}
            >
              <ReactQuill
                ref={quillRef as any}
                theme="snow"
                value={content}
                onChange={onContentChange}
                modules={modules}
                formats={formats}
                className="[&_.ql-container]:min-h-[1123px] [&_.ql-container]:bg-white [&_.ql-container]:rounded-md [&_.ql-container]:shadow [&_.ql-editor]:min-h-[1123px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estilos específicos do editor */}
      <style>{`
        .ql-snow { background: transparent; }
        .ql-toolbar.ql-snow { border-color: #334155; background: #0f172a; }
        .ql-toolbar .ql-stroke { stroke: #e2e8f0; }
        .ql-toolbar .ql-picker { color: #e2e8f0; }
        .ql-container.ql-snow { border-color: #334155; }
        .ql-editor { padding: 28px 32px; }
        .page-break { color: #94a3b8; }
        @media print { .page-break { break-after: page; } }
      `}</style>
    </div>
  );
}
