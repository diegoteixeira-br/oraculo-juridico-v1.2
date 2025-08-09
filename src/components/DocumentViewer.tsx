import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, Save, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentViewerProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface LegalDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  template_variables: any;
  min_tokens_required?: number;
  min_credits_required?: number; // compat
}

export default function DocumentViewer({ documentId, isOpen, onClose }: DocumentViewerProps) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [processedContent, setProcessedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (documentId && isOpen) loadDocument();
  }, [documentId, isOpen]);

  useEffect(() => {
    if (document) processTemplate();
  }, [document]);

  const loadDocument = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', documentId)
        .maybeSingle();
      if (error) throw error;
      setDocument(data as any);

      if (user?.id) {
        await supabase.from('user_document_access').insert({ user_id: user.id, document_id: documentId, access_type: 'view' });
      }
    } catch (e) {
      console.error('Erro ao carregar documento:', e);
      toast({ title: 'Erro', description: 'Não foi possível carregar o documento', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const processTemplate = () => {
    if (!document) return;
    const content = document.content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
    setProcessedContent(content);
  };

  const copyToClipboard = async () => {
    if (!document || !user?.id) return;
    try {
      const isSubscriber = (profile?.plan_type && profile.plan_type !== 'gratuito');
      if (!isSubscriber) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const { count, error: countError } = await supabase
          .from('user_document_access')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('access_type', 'copy')
          .gte('created_at', startOfToday.toISOString());
        if (countError) throw countError;
        if ((count ?? 0) >= 1) {
          toast({ title: 'Limite diário atingido', description: 'No plano gratuito, 1 cópia/dia. Assine para ilimitado.', variant: 'destructive' });
          return;
        }
      }
      const textContent = processedContent
        .replace(/<\/p>/g, '\n\n')
        .replace(/<\/h[1-6]>/g, '\n\n')
        .replace(/<\/li>/g, '\n')
        .replace(/<br\s*\/?>(?=.)/g, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      if (user?.id && documentId) {
        await supabase.from('user_document_access').insert({ user_id: user.id, document_id: documentId, access_type: 'copy' });
      }
      toast({ title: 'Copiado!', description: 'Documento copiado para a área de transferência.' });
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Erro ao copiar:', e);
      toast({ title: 'Erro', description: 'Não foi possível copiar o documento', variant: 'destructive' });
    }
  };

  const downloadDocument = async () => {
    try {
      const htmlContent = `<!doctype html><html><head><meta charset="utf-8" /><title>${document?.title}</title><style>body{font-family:'Times New Roman',Times,serif;line-height:1.6;margin:40px}</style></head><body>${processedContent}</body></html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url; a.download = `${(document?.title || 'documento').replace(/\s+/g,'_')}.html`;
      globalThis.document.body.appendChild(a); a.click(); globalThis.document.body.removeChild(a); URL.revokeObjectURL(url);
      if (user?.id && documentId) await supabase.from('user_document_access').insert({ user_id: user.id, document_id: documentId, access_type: 'download' });
      toast({ title: 'Download iniciado' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erro', description: 'Não foi possível baixar', variant: 'destructive' });
    }
  };

  const saveAsMyDocument = async () => {
    if (!user?.id || !document) return;
    try {
      const html = processedContent || document.content;
      const { error } = await supabase.from('user_documents').insert({ user_id: user.id, title: document.title, content_md: html });
      if (error) throw error;
      toast({ title: 'Salvo em Meus Documentos' });
    } catch (e:any) {
      console.error(e);
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{document?.title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!processedContent} className="bg-primary/10 border-primary/30 text-primary">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />} {copied ? 'Copiado!' : 'Copiar'}
          </Button>
          <Button variant="secondary" size="sm" onClick={downloadDocument}>
            <Download className="w-4 h-4 mr-2" /> Baixar HTML
          </Button>
          <Button size="sm" onClick={saveAsMyDocument}>
            <Save className="w-4 h-4 mr-2" /> Salvar como Meu Documento
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Carregando documento...</p>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="w-full">
              <h3 className="font-semibold mb-4">Documento</h3>
              <div className="border border-slate-300 rounded-lg p-6 bg-white text-black min-h-[60vh] overflow-y-auto select-none" style={{ fontFamily: 'Times New Roman, Times, serif', lineHeight: '1.6', fontSize: '14px', userSelect: 'none' }} dangerouslySetInnerHTML={{ __html: processedContent }} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
