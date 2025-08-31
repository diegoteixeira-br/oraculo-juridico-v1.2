import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ExternalNews {
  id: string;
  title: string;
  snippet: string;
  source_name: string;
  author_name?: string;
  original_url: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export const ExternalNewsManager = () => {
  const [news, setNews] = useState<ExternalNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<ExternalNews | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    snippet: '',
    source_name: '',
    author_name: '',
    original_url: '',
    image_url: '',
    is_active: true,
    display_order: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('external_news')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar notícias externas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      snippet: '',
      source_name: '',
      author_name: '',
      original_url: '',
      image_url: '',
      is_active: true,
      display_order: 0,
    });
    setEditingNews(null);
  };

  const openDialog = (newsItem?: ExternalNews) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setFormData({
        title: newsItem.title,
        snippet: newsItem.snippet,
        source_name: newsItem.source_name,
        author_name: newsItem.author_name || '',
        original_url: newsItem.original_url,
        image_url: newsItem.image_url || '',
        is_active: newsItem.is_active,
        display_order: newsItem.display_order,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.snippet || !formData.source_name || !formData.original_url) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (formData.snippet.length > 280) {
      toast({
        title: "Erro",
        description: "O resumo deve ter no máximo 280 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingNews) {
        const { error } = await supabase
          .from('external_news')
          .update({
            title: formData.title,
            snippet: formData.snippet,
            source_name: formData.source_name,
            author_name: formData.author_name || null,
            original_url: formData.original_url,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            display_order: formData.display_order,
          })
          .eq('id', editingNews.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Notícia atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('external_news')
          .insert({
            title: formData.title,
            snippet: formData.snippet,
            source_name: formData.source_name,
            author_name: formData.author_name || null,
            original_url: formData.original_url,
            image_url: formData.image_url || null,
            is_active: formData.is_active,
            display_order: formData.display_order,
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Notícia adicionada com sucesso!",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchNews();
    } catch (error) {
      console.error('Erro ao salvar notícia:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar notícia",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (newsId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('external_news')
        .update({ is_active: !currentStatus })
        .eq('id', newsId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Notícia ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`,
      });

      fetchNews();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status da notícia",
        variant: "destructive",
      });
    }
  };

  const deleteNews = async (newsId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta notícia?')) return;

    try {
      const { error } = await supabase
        .from('external_news')
        .delete()
        .eq('id', newsId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Notícia excluída com sucesso!",
      });

      fetchNews();
    } catch (error) {
      console.error('Erro ao excluir notícia:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir notícia",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Notícias Externas</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Notícia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNews ? 'Editar Notícia' : 'Adicionar Nova Notícia'}
              </DialogTitle>
              <DialogDescription>
                Adicione notícias de sites jurídicos de forma ética, com créditos e links para o original.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Notícia *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título original da notícia"
                  required
                />
              </div>

              <div>
                <Label htmlFor="snippet">Resumo/Snippet * (máx. 280 caracteres)</Label>
                <Textarea
                  id="snippet"
                  value={formData.snippet}
                  onChange={(e) => setFormData({ ...formData, snippet: e.target.value })}
                  placeholder="Pequeno resumo ou primeiras linhas do artigo..."
                  maxLength={280}
                  rows={3}
                  required
                />
                <div className="text-sm text-muted-foreground text-right">
                  {formData.snippet.length}/280 caracteres
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source_name">Fonte/Site *</Label>
                  <Input
                    id="source_name"
                    value={formData.source_name}
                    onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                    placeholder="Ex: Consultor Jurídico, Migalhas"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="author_name">Autor (opcional)</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    placeholder="Nome do autor"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="original_url">URL Original *</Label>
                <Input
                  id="original_url"
                  type="url"
                  value={formData.original_url}
                  onChange={(e) => setFormData({ ...formData, original_url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="image_url">URL da Imagem (opcional)</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativa</Label>
                </div>

                <div>
                  <Label htmlFor="display_order">Ordem de Exibição</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingNews ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {news.map((item) => (
          <Card key={item.id} className={`${!item.is_active ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Badge variant={item.is_active ? "default" : "secondary"}>
                      {item.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <span>•</span>
                    <span>Ordem: {item.display_order}</span>
                    <span>•</span>
                    <span>Fonte: {item.source_name}</span>
                    {item.author_name && (
                      <>
                        <span>•</span>
                        <span>Autor: {item.author_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActive(item.id, item.is_active)}
                  >
                    {item.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openDialog(item)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteNews(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(item.original_url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{item.snippet}</p>
              <div className="text-xs text-muted-foreground">
                Adicionado em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}

        {news.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">Nenhuma notícia externa cadastrada.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Adicionar Notícia" para começar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};