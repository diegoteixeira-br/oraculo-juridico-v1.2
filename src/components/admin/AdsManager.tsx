import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, BarChart3, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CustomAd {
  id: string;
  title: string;
  description?: string;
  ad_type: 'image' | 'html' | 'script';
  content: string;
  link_url?: string;
  position: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  click_count: number;
  view_count: number;
  created_at: string;
}

export default function AdsManager() {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAd, setEditingAd] = useState<CustomAd | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    ad_type: 'image' | 'html' | 'script';
    content: string;
    link_url: string;
    position: string;
    is_active: boolean;
    start_date: string;
    end_date: string;
  }>({
    title: "",
    description: "",
    ad_type: "image" as const,
    content: "",
    link_url: "",
    position: "sidebar_top",
    is_active: true,
    start_date: "",
    end_date: "",
  });

  const positions = [
    { value: "header", label: "Cabeçalho" },
    { value: "sidebar_top", label: "Sidebar - Topo" },
    { value: "sidebar_middle", label: "Sidebar - Meio" },
    { value: "sidebar_bottom", label: "Sidebar - Rodapé" },
    { value: "content_top", label: "Conteúdo - Topo" },
    { value: "content_middle", label: "Conteúdo - Meio" },
    { value: "content_bottom", label: "Conteúdo - Rodapé" },
    { value: "footer", label: "Rodapé" },
  ];

  const adTypes = [
    { value: "image", label: "Imagem" },
    { value: "html", label: "HTML" },
    { value: "script", label: "Script/Código" },
  ];

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_ads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds((data || []).map(ad => ({
        ...ad,
        ad_type: ad.ad_type as 'image' | 'html' | 'script'
      })));
    } catch (error) {
      toast({
        title: "Erro ao carregar anúncios",
        description: "Não foi possível carregar a lista de anúncios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const adData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        link_url: formData.link_url || null,
      };

      if (editingAd) {
        const { error } = await supabase
          .from('custom_ads')
          .update(adData)
          .eq('id', editingAd.id);

        if (error) throw error;
        
        toast({
          title: "Anúncio atualizado",
          description: "O anúncio foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('custom_ads')
          .insert([adData]);

        if (error) throw error;
        
        toast({
          title: "Anúncio criado",
          description: "O anúncio foi criado com sucesso.",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchAds();
    } catch (error) {
      toast({
        title: "Erro ao salvar anúncio",
        description: "Não foi possível salvar o anúncio.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ad: CustomAd) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      description: ad.description || "",
      ad_type: ad.ad_type,
      content: ad.content,
      link_url: ad.link_url || "",
      position: ad.position,
      is_active: ad.is_active,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : "",
      end_date: ad.end_date ? ad.end_date.split('T')[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;
    
    try {
      const { error } = await supabase
        .from('custom_ads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Anúncio excluído",
        description: "O anúncio foi excluído com sucesso.",
      });
      
      fetchAds();
    } catch (error) {
      toast({
        title: "Erro ao excluir anúncio",
        description: "Não foi possível excluir o anúncio.",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('custom_ads')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: isActive ? "Anúncio desativado" : "Anúncio ativado",
        description: `O anúncio foi ${isActive ? 'desativado' : 'ativado'} com sucesso.`,
      });
      
      fetchAds();
    } catch (error) {
      toast({
        title: "Erro ao alterar status",
        description: "Não foi possível alterar o status do anúncio.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      ad_type: "image",
      content: "",
      link_url: "",
      position: "sidebar_top",
      is_active: true,
      start_date: "",
      end_date: "",
    });
    setEditingAd(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Anúncios</h2>
          <p className="text-muted-foreground">
            Adicione seus próprios anúncios ou de terceiros no blog
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Anúncio
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAd ? 'Editar Anúncio' : 'Novo Anúncio'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nome do anúncio"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ad_type">Tipo</Label>
                  <Select value={formData.ad_type} onValueChange={(value: 'image' | 'html' | 'script') => setFormData(prev => ({ ...prev, ad_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {adTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional do anúncio"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  {formData.ad_type === 'image' ? 'URL da Imagem' : 
                   formData.ad_type === 'html' ? 'Código HTML' : 'Código JavaScript/Script'}
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={
                    formData.ad_type === 'image' ? 'https://exemplo.com/banner.jpg' :
                    formData.ad_type === 'html' ? '<div>Seu código HTML aqui</div>' :
                    '<script>// Seu código aqui</script>'
                  }
                  rows={4}
                  required
                />
              </div>

              {formData.ad_type === 'image' && (
                <div className="space-y-2">
                  <Label htmlFor="link_url">URL de Destino</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                    placeholder="https://exemplo.com"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="position">Posição no Blog</Label>
                <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data de Fim</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Anúncio ativo</Label>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAd ? 'Atualizar' : 'Criar'} Anúncio
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Lista de Anúncios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : ads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum anúncio encontrado. Clique em "Novo Anúncio" para começar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Visualizações</TableHead>
                  <TableHead className="text-center">Cliques</TableHead>
                  <TableHead>Criado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ad.title}</div>
                        {ad.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {ad.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {adTypes.find(t => t.value === ad.ad_type)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {positions.find(p => p.value === ad.position)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ad.is_active ? "default" : "secondary"}>
                        {ad.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-4 h-4" />
                        {ad.view_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <ExternalLink className="w-4 h-4" />
                        {ad.click_count}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(ad.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(ad.id, ad.is_active)}
                        >
                          {ad.is_active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(ad)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}