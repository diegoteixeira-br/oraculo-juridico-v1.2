import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DocumentPreviewProps {
  documentId: string;
  title: string;
  docType: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DocumentData {
  id: string;
  title: string;
  content?: string;
  file_url?: string;
  doc_type: string;
}

export default function DocumentPreview({ documentId, title, docType, isOpen, onClose }: DocumentPreviewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocument();
    }
  }, [isOpen, documentId]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents_library")
        .select("*")
        .eq("id", documentId)
        .single();
      
      if (error) throw error;
      setDocument(data);
    } catch (error: any) {
      console.error("Error loading document:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o documento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!document?.content) {
      toast({
        title: "Erro",
        description: "Documento não possui conteúdo para copiar",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(document.content);
      toast({
        title: "Sucesso",
        description: "Conteúdo copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o conteúdo",
        variant: "destructive",
      });
    }
  };

  const downloadFile = () => {
    if (document?.file_url) {
      // Faz download direto do URL
      const link = globalThis.document.createElement('a');
      link.href = document.file_url;
      link.download = document.title;
      link.target = '_blank';
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
    } else if (document?.content) {
      const blob = new Blob([document.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.href = url;
      a.download = `${document.title}.txt`;
      globalThis.document.body.appendChild(a);
      a.click();
      globalThis.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const createCopy = async () => {
    if (!user?.id || !document) return;
    
    if (document.doc_type !== 'text') {
      toast({ 
        title: 'Somente documentos de texto', 
        description: 'Arquivos enviados não podem ser editados aqui.', 
        variant: 'destructive' 
      });
      return;
    }

    try {
      const payload = {
        user_id: user.id,
        title: document.title || 'Documento',
        content_md: document.content || '',
      };
      
      const { error } = await supabase.from('user_documents').insert(payload);
      if (error) throw error;
      
      toast({ 
        title: 'Cópia criada', 
        description: 'Documento salvo em Meus Documentos' 
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: 'Erro ao copiar', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {docType === 'text' ? (
              <FileText className="w-5 h-5" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-slate-300">Carregando...</span>
            </div>
          ) : document ? (
            <div className="space-y-4">
              {document.doc_type === 'text' && document.content ? (
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                  <pre className="whitespace-pre-wrap text-slate-200 text-sm leading-relaxed">
                    {document.content}
                  </pre>
                </div>
              ) : document.file_url ? (
                <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
                  {document.file_url.toLowerCase().includes('.pdf') ? (
                    <div className="w-full">
                      <iframe
                        src={`${document.file_url}#view=FitH`}
                        className="w-full h-[80vh] border-0 rounded"
                        title={document.title}
                        style={{ minHeight: '600px' }}
                      />
                    </div>
                  ) : document.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="text-center">
                      <img
                        src={document.file_url}
                        alt={document.title}
                        className="max-w-full h-auto rounded mx-auto"
                        style={{ maxHeight: '80vh' }}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-300">Arquivo disponível para download</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  Nenhum conteúdo disponível
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Documento não encontrado
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-700">
          {document?.content && (
            <Button onClick={copyToClipboard} className="bg-primary hover:bg-primary/90">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Texto
            </Button>
          )}
          <Button onClick={downloadFile} variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-600">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          {document?.doc_type === 'text' && (
            <Button onClick={createCopy} variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-600">
              <Copy className="w-4 h-4 mr-2" />
              Criar cópia para editar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}