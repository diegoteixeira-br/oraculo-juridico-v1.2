import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface DocumentUploaderProps {
  onUploaded?: () => void;
}

export default function DocumentUploader({ onUploaded }: DocumentUploaderProps) {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!user || !files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;

        const { error: insErr } = await supabase.from("documents_library").insert({
          title: file.name,
          doc_type: "file",
          bucket_id: "documents",
          object_path: path,
          file_url: null,
          folder: folder || null,
          tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
          uploaded_by: user.id,
        });
        if (insErr) throw insErr;
      }
      toast.success("Upload concluído");
      setTags("");
      onUploaded?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Falha no upload");
    } finally {
      setUploading(false);
    }
  }, [user, folder, tags, onUploaded]);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Pasta</Label>
          <Input placeholder="ex: Contratos" value={folder} onChange={e => setFolder(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Tags (separadas por vírgula)</Label>
          <Input placeholder="ex: cliente,imobiliario,modelo" value={tags} onChange={e => setTags(e.target.value)} />
        </div>
      </div>
      <Separator />
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted"}`}
      >
        <p className="text-sm text-muted-foreground">Arraste e solte arquivos aqui</p>
        <p className="text-xs text-muted-foreground mt-1">ou</p>
        <div className="mt-4">
          <input 
            type="file" 
            multiple 
            className="hidden" 
            id="file-upload"
            onChange={e => handleFiles(e.target.files)} 
          />
          <Button 
            asChild 
            disabled={uploading}
          >
            <label htmlFor="file-upload" className="cursor-pointer">
              {uploading ? "Enviando..." : "Selecionar arquivos"}
            </label>
          </Button>
        </div>
      </div>
    </div>
  );
}
