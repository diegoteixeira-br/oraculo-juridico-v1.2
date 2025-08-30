import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/ui/image-upload';
import { Plus, Edit, Trash2, Eye, Calendar, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image_url: string;
  author_name: string;
  is_published: boolean;
  featured: boolean;
  views_count: number;
  reading_time_minutes: number;
  meta_title: string;
  meta_description: string;
  tags: string[];
  category: string;
  created_at: string;
  updated_at: string;
  published_at: string;
}

const BlogManager = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    cover_image_url: '',
    author_name: 'Oráculo Jurídico',
    is_published: false,
    featured: false,
    reading_time_minutes: 5,
    meta_title: '',
    meta_description: '',
    tags: [] as string[],
    category: 'geral'
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
      toast.error('Erro ao carregar posts');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      cover_image_url: '',
      author_name: 'Oráculo Jurídico',
      is_published: false,
      featured: false,
      reading_time_minutes: 5,
      meta_title: '',
      meta_description: '',
      tags: [],
      category: 'geral'
    });
    setEditingPost(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const postData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
        reading_time_minutes: calculateReadingTime(formData.content),
        meta_title: formData.meta_title || formData.title,
        meta_description: formData.meta_description || formData.summary,
        published_at: formData.is_published ? new Date().toISOString() : null
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('Post atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;
        toast.success('Post criado com sucesso!');
      }

      await fetchPosts();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Erro ao salvar post:', error);
      toast.error(`Erro ao salvar post: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title: post.title,
      slug: post.slug,
      summary: post.summary,
      content: post.content,
      cover_image_url: post.cover_image_url || '',
      author_name: post.author_name,
      is_published: post.is_published,
      featured: post.featured,
      reading_time_minutes: post.reading_time_minutes,
      meta_title: post.meta_title || '',
      meta_description: post.meta_description || '',
      tags: post.tags || [],
      category: post.category
    });
    setEditingPost(post);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Post excluído com sucesso!');
      await fetchPosts();
    } catch (error) {
      console.error('Erro ao excluir post:', error);
      toast.error('Erro ao excluir post');
    }
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData({ ...formData, tags });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Blog</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? 'Editar Post' : 'Criar Novo Post'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                  <TabsTrigger value="settings">Configurações</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => {
                          const title = e.target.value;
                          setFormData({
                            ...formData,
                            title,
                            slug: generateSlug(title)
                          });
                        }}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="gerado-automaticamente"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="summary">Resumo *</Label>
                    <Textarea
                      id="summary"
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      placeholder="Breve descrição do artigo..."
                      rows={3}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Conteúdo (Markdown) *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Escreva o conteúdo do artigo em Markdown..."
                      rows={15}
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <ImageUpload
                      label="Imagem de Capa"
                      value={formData.cover_image_url}
                      onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                      bucket="blog-images"
                      folder="covers"
                    />
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                      <strong>📏 Tamanhos ideais para evitar cortes:</strong>
                      <br />• <strong>Artigos em Destaque (principal):</strong> 800×320px (proporção 2.5:1)
                      <br />• <strong>Artigos em Destaque (secundários):</strong> 400×224px (proporção 16:9)  
                      <br />• <strong>Todos os Artigos:</strong> 400×192px (proporção 25:12)
                      <br />• <strong>Universal (recomendado):</strong> 1200×480px - funciona bem em todas as seções
                      <br /><strong>Formato:</strong> JPG ou PNG • <strong>Máximo:</strong> 2MB
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="author_name">Autor</Label>
                      <Input
                        id="author_name"
                        value={formData.author_name}
                        onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="geral">Geral</SelectItem>
                          <SelectItem value="direito-digital">Direito Digital</SelectItem>
                          <SelectItem value="lgpd">LGPD</SelectItem>
                          <SelectItem value="tecnologia">Tecnologia Jurídica</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="jurisprudencia">Jurisprudência</SelectItem>
                          <SelectItem value="direito-civil">Direito Civil</SelectItem>
                          <SelectItem value="direito-penal">Direito Penal</SelectItem>
                          <SelectItem value="direito-trabalhista">Direito Trabalhista</SelectItem>
                          <SelectItem value="direito-tributario">Direito Tributário</SelectItem>
                          <SelectItem value="direito-empresarial">Direito Empresarial</SelectItem>
                          <SelectItem value="direito-constitucional">Direito Constitucional</SelectItem>
                          <SelectItem value="direito-administrativo">Direito Administrativo</SelectItem>
                          <SelectItem value="direito-previdenciario">Direito Previdenciário</SelectItem>
                          <SelectItem value="direito-consumidor">Direito do Consumidor</SelectItem>
                          <SelectItem value="direito-familia">Direito de Família</SelectItem>
                          <SelectItem value="direito-imobiliario">Direito Imobiliário</SelectItem>
                          <SelectItem value="direito-processual">Direito Processual</SelectItem>
                          <SelectItem value="advocacia">Advocacia</SelectItem>
                          <SelectItem value="legislacao">Legislação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={formData.tags.join(', ')}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      placeholder="direito digital, lgpd, tecnologia"
                    />
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_published"
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                      />
                      <Label htmlFor="is_published">Publicado</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
                      />
                      <Label htmlFor="featured">Destaque</Label>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div>
                    <Label htmlFor="meta_title">Título SEO</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      placeholder="Deixe em branco para usar o título do post"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 60 caracteres
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="meta_description">Descrição SEO</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      placeholder="Deixe em branco para usar o resumo do post"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Máximo 160 caracteres
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Salvando...' : editingPost ? 'Atualizar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts do Blog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Visualizações</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-md">
                        {post.summary}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.is_published ? 'default' : 'secondary'}>
                        {post.is_published ? 'Publicado' : 'Rascunho'}
                      </Badge>
                      {post.featured && (
                        <Badge variant="outline">Destaque</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      {post.views_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.created_at)}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {post.reading_time_minutes} min
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(post.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {post.is_published && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlogManager;