import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface DocRow {
  id: string;
  title: string;
  doc_type: string;
  created_at: string;
  uploaded_by: string;
  folder: string | null;
  tags: string[] | null;
}

export default function DocumentManager() {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [folder, setFolder] = useState("");
  const [tags, setTags] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("documents_library")
      .select("id,title,doc_type,created_at,uploaded_by,folder,tags")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar documentos");
      setLoading(false);
      return;
    }
    setDocs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const createTextDoc = async () => {
    if (!title.trim()) return toast.error("Informe um título");
    const { error } = await supabase.from("documents_library").insert({
      title,
      doc_type: "text",
      content,
      folder: folder || null,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
      uploaded_by: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) return toast.error("Erro ao salvar documento");
    toast.success("Documento criado");
    setOpen(false);
    setTitle("");
    setContent("");
    setFolder("");
    setTags("");
    load();
  };

  const [shareOpen, setShareOpen] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!shareOpen) return;
    (async () => {
      try {
        const { data } = await supabase.functions.invoke('admin-list-users');
        // @ts-ignore
        setUsers((data?.users as any) || []);
      } catch (e) {
        // fallback apenas com profiles
        const { data } = await supabase.from("profiles").select("user_id, full_name");
        setUsers((data || []).map((p: any) => ({ id: p.user_id, name: p.full_name || p.user_id })));
      }
    })();
  }, [shareOpen]);

  const filtered = useMemo(() => users.filter(u =>
    u.name?.toLowerCase().includes(query.toLowerCase()) || u.email?.toLowerCase().includes(query.toLowerCase())
  ), [users, query]);

  const doShare = async () => {
    if (!shareOpen || selected.length === 0) return;
    try {
      const rows = selected.map(uid => ({ document_id: shareOpen, target_user_id: uid, shared_by: (supabase.auth.getUser() as any) }));
      for (const uid of selected) {
        const { error } = await supabase.from("document_shares").insert({ document_id: shareOpen, target_user_id: uid, shared_by: (await supabase.auth.getUser()).data.user?.id });
        if (error) throw error;
      }
      const { error } = await supabase.functions.invoke('notify-document-share', {
        body: { documentId: shareOpen, userIds: selected }
      });
      if (error) throw error;
      toast.success("Compartilhado com sucesso");
      setShareOpen(null);
      setSelected([]);
    } catch (e: any) {
      console.error(e);
      toast.error("Falha ao compartilhar");
    }
  };

  const deleteDocument = async (docId: string, docTitle: string) => {
    try {
      // Buscar o documento para verificar se é um arquivo no storage
      const { data: doc, error: fetchError } = await supabase
        .from("documents_library")
        .select("doc_type, object_path, bucket_id")
        .eq("id", docId)
        .single();

      if (fetchError) throw fetchError;

      // Se for um arquivo, deletar do storage primeiro
      if (doc.doc_type === "file" && doc.object_path) {
        const { error: storageError } = await supabase.storage
          .from(doc.bucket_id || "documents")
          .remove([doc.object_path]);
        
        if (storageError) {
          console.warn("Erro ao deletar arquivo do storage:", storageError);
          // Continua mesmo com erro no storage
        }
      }

      // Deletar compartilhamentos
      await supabase
        .from("document_shares")
        .delete()
        .eq("document_id", docId);

      // Deletar o documento
      const { error } = await supabase
        .from("documents_library")
        .delete()
        .eq("id", docId);

      if (error) throw error;

      toast.success(`Documento "${docTitle}" deletado com sucesso`);
      load(); // Recarregar a lista
    } catch (e: any) {
      console.error("Erro ao deletar documento:", e);
      toast.error("Erro ao deletar documento");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documentos</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Novo documento de texto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Novo documento de texto</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Pasta</Label>
                  <Input value={folder} onChange={e => setFolder(e.target.value)} />
                </div>
                <div>
                  <Label>Tags</Label>
                  <Input placeholder="tag1,tag2" value={tags} onChange={e => setTags(e.target.value)} />
                </div>
              </div>
              <ReactQuill theme="snow" value={content} onChange={setContent} />
              <div className="flex justify-end">
                <Button onClick={createTextDoc}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Pasta</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Enviado por</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7}>Carregando...</TableCell></TableRow>
          ) : docs.length === 0 ? (
            <TableRow><TableCell colSpan={7}>Nenhum documento</TableCell></TableRow>
          ) : (
            docs.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.title}</TableCell>
                <TableCell>{d.doc_type}</TableCell>
                <TableCell>{d.folder || '-'}</TableCell>
                <TableCell>{d.tags?.join(', ')}</TableCell>
                <TableCell>{d.uploaded_by}</TableCell>
                <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Dialog open={shareOpen === d.id} onOpenChange={(o) => setShareOpen(o ? d.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm">Compartilhar</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Compartilhar: {d.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                          <Input placeholder="Buscar por nome ou email" value={query} onChange={e => setQuery(e.target.value)} />
                          <div className="max-h-64 overflow-auto border rounded-md divide-y">
                            {filtered.map(u => (
                              <label key={u.id} className="flex items-center gap-2 p-2 cursor-pointer">
                                <input type="checkbox" checked={selected.includes(u.id)} onChange={(e) => {
                                  setSelected(prev => e.target.checked ? [...prev, u.id] : prev.filter(i => i !== u.id));
                                }} />
                                <span className="text-sm">{u.name} {u.email ? (<span className="text-muted-foreground">• {u.email}</span>) : null}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShareOpen(null)}>Cancelar</Button>
                            <Button onClick={doShare}>Compartilhar</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja deletar o documento "{d.title}"? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteDocument(d.id, d.title)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
