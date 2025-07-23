import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
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
  min_credits_required?: number; // Manter para compatibilidade
}

export default function DocumentViewer({ documentId, isOpen, onClose }: DocumentViewerProps) {
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [processedContent, setProcessedContent] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (documentId && isOpen) {
      loadDocument();
    }
  }, [documentId, isOpen]);

  useEffect(() => {
    if (document) {
      processTemplate();
    }
  }, [document, formData]);

  const loadDocument = async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;
      
      setDocument(data);
      
      // Registrar visualização
      if (user?.id) {
        await supabase
          .from('user_document_access')
          .insert({
            user_id: user.id,
            document_id: documentId,
            access_type: 'view'
          });
      }
      
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o documento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processTemplate = () => {
    if (!document) return;
    
    // Converter quebras de linha para HTML preservando a formatação
    const content = document.content
      .replace(/\n\n/g, '</p><p>')  // Dupla quebra = novo parágrafo
      .replace(/\n/g, '<br>')       // Quebra simples = quebra de linha
      .replace(/^/, '<p>')          // Adicionar abertura do primeiro parágrafo
      .replace(/$/, '</p>');        // Adicionar fechamento do último parágrafo
    
    setProcessedContent(content);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const copyToClipboard = async () => {
    if (!document || !user?.id) return;
    
    try {
      // Verificar e consumir tokens antes de copiar
      const tokensRequired = document.min_tokens_required || document.min_credits_required * 1000 || 3000;
      
      const { data: useTokensResult, error: tokensError } = await supabase.rpc(
        'use_tokens',
        {
          p_user_id: user.id,
          p_tokens: tokensRequired,
          p_description: `Cópia do documento: ${document.title}`
        }
      );

      if (tokensError || !useTokensResult) {
        toast({
          title: "Tokens insuficientes",
          description: `Você precisa de ${tokensRequired.toLocaleString()} tokens para copiar este documento`,
          variant: "destructive"
        });
        return;
      }

      // Converter HTML para texto simples básico
      const textContent = processedContent
        .replace(/<\/p>/g, '\n\n')
        .replace(/<\/h[1-6]>/g, '\n\n')
        .replace(/<\/li>/g, '\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
      
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast({
        title: "Copiado!",
        description: `Documento copiado! ${tokensRequired.toLocaleString()} tokens utilizados.`
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o documento",
        variant: "destructive"
      });
    }
  };

  const downloadDocument = async () => {
    try {
      // Criar um documento HTML completo para download
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${document?.title}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; margin: 40px; }
            .document-header h1 { text-align: center; margin-bottom: 30px; }
            h1, h2, h3 { color: #333; }
            p { margin-bottom: 12px; }
            .signature-section { margin-top: 40px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .signature { text-align: center; }
            ul, ol { margin-left: 20px; }
          </style>
        </head>
        <body>
          ${processedContent}
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = `${document?.title.replace(/\s+/g, '_')}.html`;
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Registrar download
      if (user?.id && documentId) {
        await supabase
          .from('user_document_access')
          .insert({
            user_id: user.id,
            document_id: documentId,
            access_type: 'download'
          });
      }
      
      toast({
        title: "Download iniciado",
        description: "O documento foi baixado com sucesso"
      });
      
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível baixar o documento",
        variant: "destructive"
      });
    }
  };

  // Extrair variáveis do template
  const templateVariables = document?.content.match(/{{(\w+)}}/g)?.map(match => 
    match.replace(/[{}]/g, '')
  ).filter((value, index, self) => self.indexOf(value) === index) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{document?.title}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Botão de copiar separado do cabeçalho */}
        <div className="flex justify-center mb-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              const tokensRequired = document?.min_tokens_required || document?.min_credits_required * 1000 || 3000;
              // Confirmação antes de copiar para evitar cliques acidentais
              if (window.confirm(`Tem certeza que deseja copiar este documento? Serão consumidos ${tokensRequired.toLocaleString()} tokens.`)) {
                copyToClipboard();
              }
            }}
            disabled={!processedContent}
            className="bg-primary/10 hover:bg-primary/20 border-primary/30 text-primary font-semibold px-8 py-3"
          >
            {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
            {copied ? "Copiado!" : `Copiar Documento (${(document?.min_tokens_required || document?.min_credits_required * 1000 || 3000).toLocaleString()} tokens)`}
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
            {/* Visualização do documento */}
            <div className="w-full">
              <h3 className="font-semibold mb-4">Documento</h3>
              <div 
                className="border border-slate-300 rounded-lg p-6 bg-white text-black min-h-[60vh] overflow-y-auto select-none"
                style={{ 
                  fontFamily: 'Times New Roman, Times, serif',
                  lineHeight: '1.6',
                  fontSize: '14px',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none'
                }}
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}