import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, Tag, ArrowRight, Search, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_image_url: string;
  author_name: string;
  reading_time_minutes: number;
  views_count: number;
  tags: string[];
  category: string;
  published_at: string;
}

const BlogJuridico = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useSEO({
    title: 'Blog Jurídico - Notícias e Dicas para Advogados | Oráculo Jurídico',
    description: 'Mantenha-se atualizado com as últimas notícias jurídicas, dicas práticas para advogados e análises de legislação. Conteúdo especializado em direito digital, LGPD e tecnologia jurídica.',
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Buscar posts em destaque
      const { data: featured } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(3);

      // Buscar todos os posts publicados
      const { data: allPosts } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(12);

      if (featured) setFeaturedPosts(featured);
      if (allPosts) setPosts(allPosts);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/src/assets/cakto-logo.png" 
                alt="Oráculo Jurídico"
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold">Oráculo Jurídico</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                Início
              </Link>
              <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/cadastro">
                <Button>Cadastre-se Grátis</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Blog Jurídico
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Notícias, análises e dicas práticas para advogados que querem se manter atualizados no mundo jurídico digital
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Artigos em Destaque</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredPosts.map((post) => (
                    <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={post.cover_image_url || '/placeholder.svg'}
                          alt={post.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4">
                          <Badge variant="secondary" className="bg-primary text-primary-foreground">
                            Destaque
                          </Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                          {post.summary}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(post.published_at)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {post.reading_time_minutes} min
                            </span>
                          </div>
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {post.views_count}
                          </span>
                        </div>
                        <Link to={`/blog/${post.slug}`}>
                          <Button variant="ghost" className="w-full group">
                            Leia mais
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* All Posts */}
            <section>
              <h2 className="text-2xl font-bold mb-6">
                {searchTerm ? `Resultados para "${searchTerm}"` : 'Todos os Artigos'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map((post) => (
                  <Card key={post.id} className="group hover:shadow-lg transition-all duration-300">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={post.cover_image_url || '/placeholder.svg'}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {post.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                        {post.summary}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <User className="w-3 h-3 mr-1" />
                            {post.author_name}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(post.published_at)}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {post.reading_time_minutes} min
                          </span>
                        </div>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {post.views_count}
                        </span>
                      </div>
                      <Link to={`/blog/${post.slug}`}>
                        <Button variant="ghost" className="w-full group">
                          Leia mais
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Nenhum artigo encontrado para sua busca.' 
                      : 'Nenhum artigo disponível no momento.'
                    }
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Google AdSense - Topo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-center text-muted-foreground">
                  Publicidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Espaço para Google AdSense
                  <br />
                  (300x250)
                </div>
              </CardContent>
            </Card>

            {/* Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/blog?categoria=direito-digital" className="block p-2 rounded hover:bg-muted transition-colors">
                  Direito Digital
                </Link>
                <Link to="/blog?categoria=lgpd" className="block p-2 rounded hover:bg-muted transition-colors">
                  LGPD
                </Link>
                <Link to="/blog?categoria=tecnologia" className="block p-2 rounded hover:bg-muted transition-colors">
                  Tecnologia Jurídica
                </Link>
                <Link to="/blog?categoria=compliance" className="block p-2 rounded hover:bg-muted transition-colors">
                  Compliance
                </Link>
              </CardContent>
            </Card>

            {/* Google AdSense - Meio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-center text-muted-foreground">
                  Publicidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg h-64 flex items-center justify-center text-muted-foreground text-sm">
                  Espaço para Google AdSense
                  <br />
                  (300x250)
                </div>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Jurídica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Receba as principais notícias jurídicas diretamente no seu e-mail.
                </p>
                <div className="space-y-3">
                  <Input placeholder="Seu e-mail" type="email" />
                  <Button className="w-full">Inscrever-se</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">Oráculo Jurídico</h3>
              <p className="text-sm text-muted-foreground">
                Inteligência artificial especializada para advogados e profissionais do direito.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links Úteis</h4>
              <div className="space-y-2 text-sm">
                <Link to="/" className="block text-muted-foreground hover:text-primary">
                  Página Inicial
                </Link>
                <Link to="/blog" className="block text-muted-foreground hover:text-primary">
                  Blog
                </Link>
                <Link to="/contato" className="block text-muted-foreground hover:text-primary">
                  Contato
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/termos" className="block text-muted-foreground hover:text-primary">
                  Termos de Uso
                </Link>
                <Link to="/privacidade" className="block text-muted-foreground hover:text-primary">
                  Política de Privacidade
                </Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Redes Sociais</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-primary">
                  LinkedIn
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary">
                  Twitter
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary">
                  Instagram
                </a>
              </div>
            </div>
          </div>
          <div className="border-t pt-8 mt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 Oráculo Jurídico. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogJuridico;