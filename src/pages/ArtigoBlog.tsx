import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Eye, Tag, User, ArrowLeft, Share2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image_url: string;
  author_name: string;
  reading_time_minutes: number;
  views_count: number;
  tags: string[];
  category: string;
  meta_title: string;
  meta_description: string;
  published_at: string;
}

const ArtigoBlog = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: post?.meta_title || post?.title || 'Artigo | Oráculo Jurídico',
    description: post?.meta_description || post?.summary || 'Leia mais sobre direito e tecnologia no blog do Oráculo Jurídico',
  });

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      // Buscar o post principal
      const { data: postData, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (error || !postData) {
        navigate('/blog');
        return;
      }

      setPost(postData);

      // Incrementar visualizações
      await supabase
        .from('blog_posts')
        .update({ views_count: postData.views_count + 1 })
        .eq('id', postData.id);

      // Buscar posts relacionados (mesma categoria, excluindo o atual)
      const { data: related } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_published', true)
        .eq('category', postData.category)
        .neq('id', postData.id)
        .order('published_at', { ascending: false })
        .limit(3);

      if (related) setRelatedPosts(related);
    } catch (error) {
      console.error('Erro ao buscar post:', error);
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const shareArticle = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: post.summary,
        url: window.location.href,
      });
    } else {
      // Fallback para navegadores que não suportam Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
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

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artigo não encontrado</h1>
            <Link to="/blog">
              <Button>Voltar ao Blog</Button>
            </Link>
          </div>
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
              <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                Blog
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

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Back Button */}
            <div className="mb-6">
              <Link to="/blog">
                <Button variant="ghost" className="mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Blog
                </Button>
              </Link>
            </div>

            {/* Article Header */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-6">
                {post.summary}
              </p>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {post.author_name}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(post.published_at)}
                  </span>
                  <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {post.reading_time_minutes} min de leitura
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    {post.views_count + 1} visualizações
                  </span>
                </div>
                
                <Button variant="outline" size="sm" onClick={shareArticle}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>

              {/* Featured Image */}
              {post.cover_image_url && (
                <div className="mb-8">
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 text-muted-foreground leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            <Separator className="my-8" />

            {/* Author Bio */}
            <div className="bg-muted/30 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-2">Sobre o Autor</h3>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{post.author_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Especialista em direito digital e tecnologia jurídica. Produz conteúdo de qualidade para profissionais do direito.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6">Artigos Relacionados</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Card key={relatedPost.id} className="group hover:shadow-lg transition-all duration-300">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={relatedPost.cover_image_url || '/placeholder.svg'}
                          alt={relatedPost.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedPost.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {relatedPost.summary}
                        </p>
                        <Link to={`/blog/${relatedPost.slug}`}>
                          <Button variant="ghost" size="sm" className="w-full">
                            Leia mais
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </article>

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

            {/* Navegação do Blog */}
            <Card>
              <CardHeader>
                <CardTitle>Navegação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/blog" className="block p-2 rounded hover:bg-muted transition-colors">
                  Todos os Artigos
                </Link>
                <Link to="/blog?categoria=direito-digital" className="block p-2 rounded hover:bg-muted transition-colors">
                  Direito Digital
                </Link>
                <Link to="/blog?categoria=lgpd" className="block p-2 rounded hover:bg-muted transition-colors">
                  LGPD
                </Link>
                <Link to="/blog?categoria=tecnologia" className="block p-2 rounded hover:bg-muted transition-colors">
                  Tecnologia Jurídica
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

            {/* CTA */}
            <Card>
              <CardHeader>
                <CardTitle>Experimente o Oráculo Jurídico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Acesse nossa IA especializada em direito e otimize seu trabalho jurídico.
                </p>
                <Link to="/cadastro">
                  <Button className="w-full">Teste Grátis</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.summary,
            "image": post.cover_image_url,
            "datePublished": post.published_at,
            "dateModified": post.published_at,
            "author": {
              "@type": "Person",
              "name": post.author_name
            },
            "publisher": {
              "@type": "Organization",
              "name": "Oráculo Jurídico",
              "logo": {
                "@type": "ImageObject",
                "url": "/src/assets/cakto-logo.png"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": window.location.href
            }
          })
        }}
      />
    </div>
  );
};

export default ArtigoBlog;