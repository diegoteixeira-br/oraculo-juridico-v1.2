import { useEffect, useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface EditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  content: string; // HTML
  onContentChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function MarkdownEditor({ // mantém o nome para não mudar outras páginas
  title,
  onTitleChange,
  content,
  onContentChange,
  onSave,
  onCancel,
}: EditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);

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

  const exportPdf = () => {
    const html = previewRef.current?.innerHTML || content || "";
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset=\"utf-8\" />
      <title>${title || "Documento"}</title>
      <style>
        body{font-family:'Times New Roman',Times,serif;line-height:1.6;margin:40px}
        .page{width:794px;min-height:1123px;margin:0 auto}
      </style>
    </head><body><div class="page">${html}</div></body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  useEffect(() => {
    // Ajusta CSS do Quill ao tema
    const snow = document.querySelector('.ql-snow');
    if (snow) (snow as HTMLElement).style.background = 'transparent';
  }, []);

  return (
    <div className="space-y-3">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={onContentChange}
              modules={modules}
              formats={formats}
              className="min-h-[420px] [&_.ql-container]:min-h-[360px] [&_.ql-toolbar]:rounded-t [&_.ql-container]:rounded-b"
            />
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3">
            <div ref={previewRef} className="bg-white text-black rounded shadow min-h-[420px] p-6 overflow-auto">
              <div className="mx-auto" style={{ width: 794 }}>
                <div dangerouslySetInnerHTML={{ __html: content || "<p>Pré-visualização do documento</p>" }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
