import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { FileText, Upload, Camera, File, Image, X, Loader2, Info } from "lucide-react";

// Função para calcular tokens necessários
function calculateTokensNeeded(text: string): number {
  const baseTokens = 500; // Mínimo de 500 tokens
  const textLength = text.length;
  
  // Aproximadamente 4 caracteres por token
  const estimatedTokens = Math.ceil(textLength / 4);
  
  // Calcular tokens necessários (base + custo do processamento)
  const processingTokens = Math.max(baseTokens, estimatedTokens * 0.5);
  
  // Arredondar para cima em incrementos de 100
  return Math.ceil(processingTokens / 100) * 100;
}

interface DocumentExtractorProps {
  onExtractComplete: () => void;
  isExtracting: boolean;
  onExtractingChange: (extracting: boolean) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'pdf' | 'image' | 'text';
}

export default function DocumentExtractor({ 
  onExtractComplete, 
  isExtracting, 
  onExtractingChange 
}: DocumentExtractorProps) {
  const { user } = useAuth();
  const [extractText, setExtractText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [estimatedTokens, setEstimatedTokens] = useState(500);

  // Processar arquivo para extração de texto
  const processFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      // Para PDF, vamos enviar para uma função que extraia texto
      const formData = new FormData();
      formData.append('file', file);
      
      const { data, error } = await supabase.functions.invoke('extract-text-from-pdf', {
        body: formData,
      });
      
      if (error) throw new Error('Erro ao extrair texto do PDF');
      return data.text || '';
    } else if (file.type.startsWith('image/')) {
      // Para imagens, usar OCR
      const formData = new FormData();
      formData.append('image', file);
      
      const { data, error } = await supabase.functions.invoke('extract-text-from-image', {
        body: formData,
      });
      
      if (error) throw new Error('Erro ao extrair texto da imagem');
      return data.text || '';
    } else {
      // Para arquivos de texto
      return await file.text();
    }
  };

  // Lidar com arquivos selecionados
  const handleFiles = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
        newFiles.push({ file, type: 'pdf' });
      } else if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        newFiles.push({ file, type: 'image', preview });
      } else if (file.type.startsWith('text/')) {
        newFiles.push({ file, type: 'text' });
      } else {
        toast({
          title: "Arquivo não suportado",
          description: `${file.name} não é um tipo de arquivo suportado.`,
          variant: "destructive",
        });
        continue;
      }
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Drag and drop handlers
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Remover arquivo
  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Extrair prazos
  const handleExtractDeadlines = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    onExtractingChange(true);
    let textToAnalyze = extractText.trim();

    try {
      // Se não há texto manual mas há arquivos, extrair texto dos arquivos primeiro
      if (!textToAnalyze && uploadedFiles.length > 0) {
        const extractedTexts = await Promise.all(
          uploadedFiles.map(({ file }) => processFile(file))
        );
        textToAnalyze = extractedTexts.join('\n\n');
      }

      if (!textToAnalyze) {
        toast({
          title: "Erro",
          description: "Digite o texto ou envie um arquivo para análise.",
          variant: "destructive",
        });
        onExtractingChange(false);
        return;
      }

      // Calcular tokens necessários com base no texto real
      const tokensNeeded = calculateTokensNeeded(textToAnalyze);
      
      // Verificar se o usuário tem tokens suficientes
      const { data: profile } = await supabase
        .from('profiles')
        .select('tokens, plan_tokens, token_balance')
        .eq('user_id', user.id)
        .single();

      const totalTokens = (profile?.token_balance || 0) + (profile?.plan_tokens || 0);

      if (totalTokens < tokensNeeded) {
        toast({
          title: "Tokens insuficientes",
          description: `Esta operação consome ${tokensNeeded} tokens. Você possui ${totalTokens} tokens. Compre mais tokens para continuar.`,
          variant: "destructive",
        });
        onExtractingChange(false);
        return;
      }

      // Fazer a extração de prazos
      const { data, error } = await supabase.functions.invoke('extract-legal-deadlines', {
        body: {
          text: textToAnalyze,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `${data.deadlinesSaved} prazos detectados e salvos automaticamente!`,
        });
        
        // Limpar formulário
        setExtractText("");
        setUploadedFiles([]);
        setEstimatedTokens(500);
        onExtractComplete();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível extrair os prazos.",
        variant: "destructive",
      });
    } finally {
      onExtractingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Área de entrada de texto */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-200">
          Texto da decisão/intimação
        </label>
        <Textarea
          placeholder="Cole aqui o texto da decisão, despacho ou intimação..."
          value={extractText}
          onChange={(e) => {
            setExtractText(e.target.value);
            setEstimatedTokens(calculateTokensNeeded(e.target.value));
          }}
          className="min-h-[120px] bg-slate-700 border-slate-600 text-white"
        />
        
        {/* Indicador de tokens estimados */}
        {extractText.trim() && (
          <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 p-2 rounded border border-slate-600">
            <Info className="h-4 w-4" />
            <span>Tokens estimados para esta operação: <strong className="text-white">{estimatedTokens}</strong></span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">OU</span>
        <Separator className="flex-1" />
      </div>

      {/* Área de upload de arquivos */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-slate-200">
          Enviar documento (PDF, imagem ou foto)
        </label>
        
        {/* Zona de drop */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
            ${isDragging 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-slate-600 hover:border-slate-500"
            }
          `}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className="h-12 w-12 text-slate-400" />
            </div>
            <div>
              <p className="text-slate-300 mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-xs text-slate-400">
                Suporte para PDF, JPG, PNG e arquivos de texto
              </p>
            </div>
            
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-slate-600 hover:bg-slate-700"
              >
                <File className="h-4 w-4 mr-2" />
                Selecionar arquivo
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                className="border-slate-600 hover:bg-slate-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Tirar foto
              </Button>
            </div>
          </div>
        </div>

        {/* Inputs ocultos */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.txt"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        {/* Arquivos enviados */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-200">
              Arquivos selecionados ({uploadedFiles.length})
            </label>
            <div className="grid gap-3">
              {uploadedFiles.map((item, index) => (
                <Card key={index} className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {item.type === 'image' && item.preview ? (
                        <img 
                          src={item.preview} 
                          alt={item.file.name}
                          className="w-12 h-12 object-cover rounded border border-slate-600"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-600 rounded flex items-center justify-center">
                          {item.type === 'pdf' ? (
                            <FileText className="h-6 w-6 text-red-400" />
                          ) : (
                            <File className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {(item.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
        <Button 
          onClick={handleExtractDeadlines} 
          disabled={isExtracting || (!extractText.trim() && uploadedFiles.length === 0)}
          className="bg-primary hover:bg-primary/90"
        >
          {isExtracting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Extrair Prazos {extractText.trim() && `(${estimatedTokens} tokens)`}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}