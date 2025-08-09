import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import UserMenu from "@/components/UserMenu";
import MarkdownEditor from "@/components/MarkdownEditor";
import { FileText, Plus, Search, Trash2, Pencil, ArrowLeft } from "lucide-react";

interface UserDoc { id: string; user_id: string; title: string; content_md: string; created_at: string; updated_at: string; folder?: string | null; tags?: string[] | null; }

export default function MeusDocumentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  usePageTitle();

  const [docs, setDocs] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<UserDoc | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<string>("");
  const [folder, setFolder] = useState<string>("");
  const [tagsText, setTagsText] = useState<string>("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return docs;
    return docs.filter(d => d.title.toLowerCase().includes(term));
  }, [q, docs]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("user_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: "Erro", description: "Não foi possível carregar documentos", variant: "destructive" });
    } else {
      setDocs((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const startNew = () => {
    setEditDoc(null);
    setTitle("");
    setContent("");
    setFolder("");
    setTagsText("");
    setOpen(true);
  };

  const startEdit = (d: UserDoc) => {
    setEditDoc(d);
    setTitle(d.title);
    setContent(d.content_md);
    setFolder(d.folder || "");
    setTagsText((d.tags || []).join(", "));
    setOpen(true);
  };

  const save = async () => {
    if (!user?.id) return;
    if (!title.trim()) {
      toast({ title: "Informe um título", variant: "destructive" });
      return;
    }
    try {
      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (editDoc) {
        const { error } = await supabase
          .from("user_documents")
          .update({ 
            title: title.trim(), 
            content_md: content, 
            folder: folder || null,
            tags: tags.length ? tags : []
          })
          .eq("id", editDoc.id)
          .eq("user_id", user.id);
        if (error) throw error;
        toast({ title: "Documento atualizado" });
      } else {
        const { error } = await supabase
          .from("user_documents")
          .insert({ user_id: user.id, title: title.trim(), content_md: content, folder: folder || null, tags });
        if (error) throw error;
        toast({ title: "Documento criado" });
      }
      setOpen(false);
      await load();
    } catch (e:any) {
      console.error(e);
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este documento?")) return;
    const { error } = await supabase
      .from("user_documents")
      .delete()
      .eq("id", id)
      .eq("user_id", user?.id || "");
    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Documento excluído" });
      setDocs(prev => prev.filter(d => d.id !== id));
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white hover:bg-slate-700">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" alt="Oráculo Jurídico" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-white">Meus Documentos</h1>
                <p className="text-xs text-slate-300 hidden md:block">Crie, edite e exporte seus documentos em Markdown</p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-primary" />
                Seus Documentos
              </CardTitle>
              <CardDescription>Armazenados com segurança. Só você tem acesso.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
                <div className="relative w-full md:max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título" className="pl-9 bg-slate-700 border-slate-600 text-white" />
                </div>
                <Button onClick={startNew} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Documento
                </Button>
              </div>

              {loading ? (
                <p className="text-sm text-slate-400">Carregando...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((d) => (
                    <div key={d.id} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                      <h3 className="text-white font-medium truncate">{d.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">Atualizado {new Date(d.updated_at).toLocaleString("pt-BR")}</p>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => startEdit(d)} className="bg-primary hover:bg-primary/90 text-xs">
                          <Pencil className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => remove(d.id)} className="text-red-400 border-slate-600 hover:bg-slate-700 text-xs">
                          <Trash2 className="w-4 h-4 mr-1" /> Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-sm text-slate-400">Nenhum documento encontrado</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>{editDoc ? "Editar Documento" : "Novo Documento"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <Input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              placeholder="Pasta (ex.: Clientes/Contratos)"
              className="bg-slate-800 border-slate-700 text-white"
            />
            <Input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="Tags (separe por vírgula: aluguel, residencial, 2025)"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <MarkdownEditor
            title={title}
            onTitleChange={setTitle}
            content={content}
            onContentChange={setContent}
            onSave={save}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
