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
import AdDisplay from '@/components/AdDisplay';
import { ArticleTextReader } from '@/components/ArticleTextReader';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/UserMenu';

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
  const { user } = useAuth();

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
            <Link to="/">
              <Button>Voltar ao Blog</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900/20 text-foreground">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <img 
                src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" 
                alt="Oráculo Jurídico" 
                className="h-10 w-auto group-hover:scale-105 transition-transform duration-200"
              />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                  Oráculo Jurídico
                </h1>
                <p className="text-sm text-slate-400">Blog Jurídico</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {user ? (
                <UserMenu />
              ) : (
                <>
                  <Link 
                    to="/" 
                    className="text-slate-300 hover:text-blue-400 transition-colors font-medium"
                  >
                    Blog
                  </Link>
                  <Link 
                    to="/login" 
                    state={{ from: 'blog' }}
                    className="text-slate-300 hover:text-blue-400 transition-colors font-medium"
                  >
                    Login
                  </Link>
                  <Link to="/saiba-mais">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6">
                      Conheça nossa ferramenta
                    </Button>
                  </Link>
                </>
              )}
            </nav>

            <div className="md:hidden">
              {user ? (
                <UserMenu />
              ) : (
                <Link to="/">
                  <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                    Blog
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Back Button */}
            <div className="mb-6">
              <Link to="/">
                <Button variant="outline" className="mb-4 border-slate-600 text-slate-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Blog
                </Button>
              </Link>
            </div>

            {/* Article Header */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-slate-600 text-slate-300">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight text-slate-200">
                {post.title}
              </h1>
              
              <p className="text-xl text-slate-300 mb-6">
                {post.summary}
              </p>

              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div className="flex items-center space-x-6 text-sm text-slate-400">
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
                
                <Button variant="outline" size="sm" onClick={shareArticle} className="border-slate-600 text-slate-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white">
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

            {/* Anúncios Personalizados - Topo do Conteúdo */}
            <AdDisplay position="content_top" className="mb-8" />

            {/* Text Reader */}
            <ArticleTextReader 
              title={post.title}
              content={post.content}
              className="mb-8"
            />

            {/* Article Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4 text-slate-200">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 text-slate-200">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-slate-200">{children}</h3>,
                  p: ({ children }) => <p className="mb-4 text-slate-300 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
                  li: ({ children }) => <li className="text-slate-300">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-300 bg-slate-800/30 p-4 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ children }) => <strong className="font-semibold text-slate-200">{children}</strong>,
                  em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
                  code: ({ children }) => <code className="bg-slate-800 text-blue-300 px-2 py-1 rounded text-sm">{children}</code>,
                  pre: ({ children }) => <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto my-4">{children}</pre>,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>

            {/* Anúncios Personalizados - Meio do Conteúdo */}
            <AdDisplay position="content_middle" className="mb-8" />

            <Separator className="my-8 border-slate-700" />

            {/* Author Bio */}
            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6 mb-8">
              <h3 className="font-semibold mb-2 text-slate-200">Sobre o Autor</h3>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">{post.author_name}</p>
                  <p className="text-sm text-slate-400">
                    Especialista em direito digital e tecnologia jurídica. Produz conteúdo de qualidade para profissionais do direito.
                  </p>
                </div>
              </div>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-6 text-slate-200">Artigos Relacionados</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <Card key={relatedPost.id} className="group hover:shadow-lg transition-all duration-300 bg-slate-800/50 border-slate-700 hover:border-blue-500/50">
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={relatedPost.cover_image_url || '/placeholder.svg'}
                          alt={relatedPost.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm line-clamp-2 group-hover:text-blue-400 transition-colors text-slate-200">
                          {relatedPost.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {relatedPost.summary}
                        </p>
                        <Link to={`/blog/${relatedPost.slug}`}>
                          <Button variant="outline" size="sm" className="w-full border-slate-600 text-slate-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white">
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
            {/* Anúncios Personalizados - Sidebar Topo */}
            <AdDisplay position="sidebar_top" />

            {/* Google AdSense - Topo */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-center text-slate-400">
                  Publicidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-700/30 rounded-lg h-64 flex items-center justify-center text-slate-400 text-sm">
                  Espaço para Google AdSense
                  <br />
                  (300x250)
                </div>
              </CardContent>
            </Card>

            {/* Navegação do Blog */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-200">Navegação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/" className="block p-2 rounded hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-blue-400">
                  Todos os Artigos
                </Link>
                <Link to="/blog?categoria=direito-digital" className="block p-2 rounded hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-blue-400">
                  Direito Digital
                </Link>
                <Link to="/blog?categoria=lgpd" className="block p-2 rounded hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-blue-400">
                  LGPD
                </Link>
                <Link to="/blog?categoria=tecnologia" className="block p-2 rounded hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-blue-400">
                  Tecnologia Jurídica
                </Link>
              </CardContent>
            </Card>

            {/* Anúncios Personalizados - Sidebar Meio */}
            <AdDisplay position="sidebar_middle" />

            {/* Google AdSense - Meio */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-sm text-center text-slate-400">
                  Publicidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-700/30 rounded-lg h-64 flex items-center justify-center text-slate-400 text-sm">
                  Espaço para Google AdSense
                  <br />
                  (300x250)
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-slate-200">Experimente o Oráculo Jurídico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 mb-4">
                  Acesse nossa IA especializada em direito e otimize seu trabalho jurídico.
                </p>
                <Link to="/cadastro">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    Teste Grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Anúncios Personalizados - Sidebar Rodapé */}
            <AdDisplay position="sidebar_bottom" />
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
                "url": "/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png"
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