import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface MarkdownEditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  content: string;
  onContentChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function MarkdownEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  onSave,
  onCancel,
}: MarkdownEditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  const exportPdf = () => {
    const html = previewRef.current?.innerHTML || "";
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset=\"utf-8\" />
      <title>${title || "Documento"}</title>
      <style>
        body{font-family: ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial;line-height:1.6;padding:32px;color:#0f172a}
        h1,h2,h3{color:#0f172a;margin:16px 0 8px}
        p{margin:8px 0}
        ul{margin:8px 0 8px 18px}
        code{background:#e2e8f0;padding:2px 4px;border-radius:4px}
      </style>
    </head><body>${html}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

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
            <Textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder="Escreva em Markdown..."
              className="min-h-[360px] bg-slate-700 border-slate-600 text-white"
            />
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3">
            <div ref={previewRef} className="prose prose-invert max-w-none">
              <ReactMarkdown>{content || "Pré-visualização do documento"}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
