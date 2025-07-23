import { useState, useEffect } from "react";
import { Upload, Edit, Trash2, Plus, Save, X, FileText, Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Document {
  id: string;
  title: string;
  content: string;
  category: string;
  description: string;
  min_tokens_required?: number; // Opcional para compatibilidade
  min_credits_required?: number; // Manter para compatibilidade durante migração
  template_variables: any;
  is_active: boolean;
  file_url?: string;
}

export default function AdminDocuments() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    description: '',
    min_tokens_required: 3000,
    template_variables: null
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('title');

      if (error) throw error;
      
      // Garantir compatibilidade com documentos antigos
      const processedData = (data || []).map(doc => ({
        ...doc,
        min_tokens_required: doc.min_tokens_required || (doc as any).min_credits_required * 1000 || 3000
      }));
      
      setDocuments(processedData);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc);
    // Ensure template_variables is always an array
    const templateVars = Array.isArray(doc.template_variables) 
      ? doc.template_variables 
      : doc.template_variables 
        ? [doc.template_variables] 
        : null;
    
    setFormData({
      title: doc.title,
      content: doc.content,
      category: doc.category,
      description: doc.description || '',
      min_tokens_required: doc.min_tokens_required || 3000,
      template_variables: templateVars
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingDocument(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      description: '',
      min_tokens_required: 3000,
      template_variables: null
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    try {
      if (editingDocument) {
        // Atualizar documento existente
        const { error } = await supabase
          .from('legal_documents')
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            description: formData.description,
            min_tokens_required: formData.min_tokens_required,
            template_variables: formData.template_variables
          })
          .eq('id', editingDocument.id);

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Documento atualizado com sucesso"
        });
      } else {
        // Criar novo documento
        const { error } = await supabase
          .from('legal_documents')
          .insert({
            title: formData.title,
            content: formData.content,
            category: formData.category,
            description: formData.description,
            min_tokens_required: formData.min_tokens_required,
            template_variables: formData.template_variables,
            is_active: true
          });

        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Documento criado com sucesso"
        });
      }

      setEditingDocument(null);
      setIsCreating(false);
      loadDocuments();
    } catch (error) {
      console.error('Erro ao salvar documento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar documento",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      const { error } = await supabase
        .from('legal_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Documento excluído com sucesso"
      });
      
      loadDocuments();
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir documento",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF são aceitos",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Extrair texto do PDF seria necessário uma biblioteca adicional
      // Por ora, vamos apenas salvar a URL
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace('.pdf', ''),
        content: prev.content || `Documento PDF: ${file.name}\n\nPara editar o conteúdo, copie e cole o texto do PDF aqui.`,
      }));

      toast({
        title: "Sucesso",
        description: "PDF carregado com sucesso. Edite o conteúdo conforme necessário."
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do arquivo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const extractTemplateVariables = (content: string) => {
    const regex = /\[([A-Z_\s]+)\]/g;
    const variables = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const variable = match[1];
      if (!variables.includes(variable)) {
        variables.push(variable);
      }
    }
    
    return variables.length > 0 ? variables : null;
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      template_variables: extractTemplateVariables(content)
    }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_login_time");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado da área administrativa"
    });
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Administração de Documentos</h1>
            <p className="text-muted-foreground">Gerencie seus documentos jurídicos</p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="border-red-500/20 hover:bg-red-500/10 text-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-4">
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Novo Documento
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Voltar ao Dashboard
          </Button>
        </div>

        {/* Editor de documento */}
        {(editingDocument || isCreating) && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>
                {editingDocument ? 'Editar Documento' : 'Criar Novo Documento'}
              </CardTitle>
              <CardDescription>
                Preencha os campos abaixo para {editingDocument ? 'atualizar' : 'criar'} o documento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Contrato de Prestação de Serviços"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contrato">Contrato</SelectItem>
                      <SelectItem value="peticao">Petição</SelectItem>
                      <SelectItem value="procuracao">Procuração</SelectItem>
                      <SelectItem value="documento">Documento</SelectItem>
                      <SelectItem value="declaracao">Declaração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição do documento"
                />
              </div>

              <div>
                <Label htmlFor="tokens">Tokens Necessários</Label>
                <Input
                  id="tokens"
                  type="number"
                  min="100"
                  step="100"
                  value={formData.min_tokens_required}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_tokens_required: parseInt(e.target.value) || 3000 }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo de tokens necessários para acessar este documento
                </p>
              </div>

              <div>
                <Label htmlFor="upload">Upload de PDF (opcional)</Label>
                <Input
                  id="upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && <p className="text-sm text-muted-foreground">Fazendo upload...</p>}
              </div>

              <div>
                <Label htmlFor="content">Conteúdo do Documento</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Cole aqui o conteúdo do seu documento. Use [NOME_VARIAVEL] para campos editáveis."
                  className="min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  💡 Use colchetes para criar campos editáveis: [NOME_CONTRATANTE], [VALOR], [DATA], etc.
                </p>
              </div>

              {formData.template_variables && Array.isArray(formData.template_variables) && (
                <div>
                  <Label>Variáveis Detectadas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.template_variables.map((variable: string, index: number) => (
                      <span key={index} className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                        {variable}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button 
                  onClick={() => {
                    setEditingDocument(null);
                    setIsCreating(false);
                  }} 
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de documentos */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle>Documentos Existentes</CardTitle>
            <CardDescription>
              Clique em editar para modificar ou excluir documentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded border border-slate-600">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">{doc.description}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs text-primary">Categoria: {doc.category}</span>
                      <span className="text-xs text-primary">Tokens: {(doc.min_tokens_required || 3000).toLocaleString()}</span>
                      <span className="text-xs text-primary">Status: {doc.is_active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(doc)} size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleDelete(doc.id)} size="sm" variant="destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}