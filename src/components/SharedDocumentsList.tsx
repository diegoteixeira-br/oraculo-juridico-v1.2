import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Copy, Loader2, Eye, Image as ImageIcon } from "lucide-react";
import DocumentPreview from "./DocumentPreview";

interface SharedDocRow {
  id: string;
  title: string;
  doc_type: string;
  created_at: string;
  uploaded_by: string;
  folder: string | null;
  tags: string[] | null;
  file_url?: string;
}

export default function SharedDocumentsList() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [docs, setDocs] = useState<SharedDocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ id: string; title: string; docType: string } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents_library")
        .select("id,title,doc_type,created_at,uploaded_by,folder,tags,file_url")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDocs((data as any) || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro", description: "Falha ao carregar compartilhados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return docs;
    return docs.filter((d) => d.title.toLowerCase().includes(term) || (d.folder || '').toLowerCase().includes(term) || (d.tags || []).some(t => t.toLowerCase().includes(term)));
  }, [docs, q]);

  const createCopy = async (doc: SharedDocRow) => {
    if (!user?.id) return;
    if (doc.doc_type !== 'text') {
      toast({ title: 'Somente documentos de texto', description: 'Arquivos enviados não podem ser editados aqui.', variant: 'destructive' });
      return;
    }
    try {
      const { data, error } = await supabase
        .from('documents_library')
        .select('content, title, folder, tags')
        .eq('id', doc.id)
        .maybeSingle();
      if (error) throw error;
      const payload = {
        user_id: user.id,
        title: (data as any)?.title || 'Documento',
        content_md: (data as any)?.content || '',
        folder: (data as any)?.folder ?? null,
        tags: (data as any)?.tags ?? [],
      };
      const { error: insErr } = await supabase.from('user_documents').insert(payload as any);
      if (insErr) throw insErr;
      toast({ title: 'Cópia criada', description: 'Documento salvo em Meus Documentos' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro ao copiar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5 text-primary" />
          Compartilhados comigo
        </CardTitle>
        <CardDescription>Modelos e arquivos que o administrador compartilhou com você</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
          <div className="relative w-full md:max-w-sm">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, pasta ou tag" className="bg-slate-700 border-slate-600 text-white" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-300 text-sm"><Loader2 className="w-4 h-4 animate-spin"/> Carregando...</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum documento compartilhado</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="bg-slate-700/30 rounded-lg border border-slate-600/50 overflow-hidden hover:border-slate-500/50 transition-colors">
                {/* Thumbnail Preview */}
                <div className="aspect-[4/3] bg-slate-800/50 border-b border-slate-600/50 relative group cursor-pointer overflow-hidden"
                     onClick={() => setPreviewDoc({ id: d.id, title: d.title, docType: d.doc_type })}>
                  {d.file_url ? (
                    d.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img 
                        src={d.file_url} 
                        alt={d.title}
                        className="w-full h-full object-cover"
                      />
                    ) : d.file_url.toLowerCase().includes('.pdf') ? (
                      <div className="w-full h-full relative bg-white">
                        <iframe
                          src={`${d.file_url}#toolbar=0&navpanes=0&scrollbar=0&page=1&zoom=50`}
                          className="w-full h-full border-0 pointer-events-none scale-150 origin-top-left"
                          style={{ transform: 'scale(0.67)', transformOrigin: 'top left' }}
                          title={`Preview of ${d.title}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-gradient-to-br from-slate-700 to-slate-800">
                        <FileText className="w-16 h-16 mb-2 text-slate-300" />
                        <span className="text-sm font-medium">Arquivo</span>
                        <span className="text-xs opacity-70">{d.file_url.split('.').pop()?.toUpperCase()}</span>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-gradient-to-br from-primary/10 to-primary/5">
                      <div className="bg-primary/20 rounded-full p-4 mb-2">
                        <FileText className="w-12 h-12 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-slate-300">Documento de Texto</span>
                      <span className="text-xs opacity-70">Markdown</span>
                    </div>
                  )}
                  
                  {/* Overlay com botão de visualizar */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 shadow-lg transform group-hover:scale-105 transition-transform">
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                  
                  {/* Badge de tipo no canto superior direito */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    {d.doc_type === 'text' ? 'MD' : d.file_url?.split('.').pop()?.toUpperCase() || 'DOC'}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h3 className="text-white font-medium truncate">{d.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(d.created_at).toLocaleString("pt-BR")} • {d.doc_type === 'text' ? 'Texto' : 'Arquivo'}
                  </p>
                  
                  {(d.folder || (d.tags && d.tags.length)) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {d.folder && (
                        <Badge variant="outline" className="border-slate-600 text-[11px]">{d.folder}</Badge>
                      )}
                      {(d.tags || []).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      onClick={() => setPreviewDoc({ id: d.id, title: d.title, docType: d.doc_type })} 
                      className="bg-primary hover:bg-primary/90 text-xs flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" /> Visualizar
                    </Button>
                    {d.doc_type === 'text' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => createCopy(d)} 
                        className="border-slate-600 text-slate-200 hover:bg-slate-600 text-xs"
                      >
                        <Copy className="w-4 h-4 mr-1" /> Copiar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          documentId={previewDoc.id}
          title={previewDoc.title}
          docType={previewDoc.docType}
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </Card>
  );
}
