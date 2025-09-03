import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Eye, Tag, ArrowRight, Search, User, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
import CustomAdCarousel from '@/components/CustomAdCarousel';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from '@/components/UserMenu';
import { BlogPostVotes } from '@/components/BlogPostVotes';
import { ExternalNewsFeed } from '@/components/ExternalNewsFeed';
import AdSenseAd from '@/components/AdSenseAd';
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  cover_image_url: string;
  author_name: string;
  reading_time_minutes: number;
  views_count: number;
  likes_count: number;
  dislikes_count: number;
  tags: string[];
  category: string;
  published_at: string;
}
const BlogJuridico = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const {
    user
  } = useAuth();
  useSEO({
    title: 'Blog Jurídico - Notícias e Dicas para Advogados | Oráculo Jurídico',
    description: 'Mantenha-se atualizado com as últimas notícias jurídicas, dicas práticas para advogados e análises de legislação. Conteúdo especializado em direito digital, LGPD e tecnologia jurídica.'
  });
  useEffect(() => {
    fetchPosts();
  }, []);
  const fetchPosts = async () => {
    try {
      // Buscar posts em destaque
      const {
        data: featured
      } = await supabase.from('blog_posts').select('id, title, slug, summary, cover_image_url, author_name, reading_time_minutes, views_count, likes_count, dislikes_count, tags, category, published_at').eq('is_published', true).eq('featured', true).order('published_at', {
        ascending: false
      }).limit(3);

      // Buscar todos os posts publicados
      const {
        data: allPosts
      } = await supabase.from('blog_posts').select('id, title, slug, summary, cover_image_url, author_name, reading_time_minutes, views_count, likes_count, dislikes_count, tags, category, published_at').eq('is_published', true).order('published_at', {
        ascending: false
      }).limit(12);
      if (featured) setFeaturedPosts(featured);
      if (allPosts) setPosts(allPosts);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    } finally {
      setLoading(false);
    }
  };
  const filteredPosts = posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.summary.toLowerCase().includes(searchTerm.toLowerCase()) || post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-slate-300">Carregando...</div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900/20 text-foreground">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 sm:space-x-3 group">
              <img src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" alt="Oráculo Jurídico" className="h-8 sm:h-10 w-auto group-hover:scale-105 transition-transform duration-200" />
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                  Oráculo Jurídico
                </h1>
                <p className="text-sm text-slate-400">Blog Jurídico</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              {user ? <UserMenu /> : <>
                  
                  <Link to="/">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6">
                      Conheça nossa ferramenta
                    </Button>
                  </Link>
                </>}
            </nav>

            <div className="md:hidden">
              {user ? <UserMenu /> : <Link to="/">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs px-3 py-2 h-8">
                    Ferramenta
                  </Button>
                </Link>}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 px-3 sm:px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 border border-blue-500/30">
              <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
              Conteúdo Jurídico Especializado
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                Blog Jurídico
              </span>
              <br />
              <span className="text-slate-200 text-2xl sm:text-3xl md:text-5xl">Atualizado Diariamente</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              Mantenha-se atualizado com as últimas notícias jurídicas, análises de legislação e dicas práticas para advogados
            </p>
            
            {/* AdSense - Hero */}
            <AdSenseAd 
              format="banner" 
              slot="2222222222"
              className="mb-6 sm:mb-8"
            />
            
            {/* Search Bar */}
            <div className="max-w-sm sm:max-w-md mx-auto relative mb-6 sm:mb-8 px-4">
              <Search className="absolute left-6 sm:left-7 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input 
                type="text" 
                placeholder="Buscar artigos..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-10 sm:pl-12 py-3 bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 text-sm sm:text-base" 
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8 sm:space-y-12">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && <section>
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-slate-200 px-4">
                  Artigos em <span className="text-blue-400">Destaque</span>
                </h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
                  {featuredPosts.map((post, index) => <Link key={post.id} to={`/blog/${post.slug}`} className="block">
                      <Card className={`group hover-scale bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 animate-fade-in cursor-pointer ${index === 0 && featuredPosts.length > 1 ? 'sm:col-span-2 lg:col-span-2' : ''}`} style={{
                  animationDelay: `${index * 0.1}s`
                }}>
                        <div className="relative overflow-hidden rounded-t-lg">
                          {post.cover_image_url && <img src={post.cover_image_url} alt={post.title} className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${index === 0 && featuredPosts.length > 1 ? 'h-48 sm:h-56 md:h-64' : 'h-40 sm:h-44'}`} />}
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                            <Badge className="bg-blue-600/90 text-white border-0 text-xs sm:text-sm">
                              <Star className="w-3 h-3 mr-1" />
                              Destaque
                            </Badge>
                          </div>
                        </div>
                        
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400 mb-3 flex-wrap">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="truncate max-w-20 sm:max-w-none">{post.author_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline">{formatDate(post.published_at)}</span>
                              <span className="sm:hidden">{new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                              {post.reading_time_minutes} min
                            </div>
                          </div>
                          
                          <h3 className="text-lg sm:text-xl font-bold mb-3 text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          
                          <p className="text-slate-300 mb-4 line-clamp-2 sm:line-clamp-3 text-sm sm:text-base">
                            {post.summary}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                            {post.tags.slice(0, 2).map((tag, tagIndex) => <Badge key={tagIndex} variant="outline" className="text-xs border-slate-600 text-slate-300">
                                {tag}
                              </Badge>)}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-300 group-hover:text-blue-400 transition-colors">
                              <span className="text-sm font-medium">Ler mais</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                            
                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{post.views_count}</span>
                                <span className="sm:hidden">{post.views_count > 999 ? `${Math.floor(post.views_count/1000)}k` : post.views_count}</span>
                              </div>
                              <BlogPostVotes postId={post.id} initialLikes={post.likes_count || 0} initialDislikes={post.dislikes_count || 0} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>)}
                </div>
                
                {/* Carrossel de Anúncios Customizados - Entre Artigos */}
                <CustomAdCarousel 
                  position="blog_between_articles" 
                  className="mb-8"
                  intervalMs={5000}
                />
              </section>}

            {/* External News Feed */}
            <ExternalNewsFeed className="mb-12" />

            {/* All Posts */}
            <section>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-slate-200 flex items-center gap-2 px-3 sm:px-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                Todos os Artigos
              </h2>
              
              <div className="grid gap-4 sm:gap-6">
                {filteredPosts.map((post, index) => <Link key={post.id} to={`/blog/${post.slug}`} className="block">
                    <Card className="group hover-scale bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all duration-300 animate-fade-in overflow-hidden cursor-pointer" style={{
                  animationDelay: `${index * 0.05}s`
                }}>
                      <div className="flex flex-col sm:flex-row h-full">
                        <div className="sm:w-1/3 relative overflow-hidden">
                          <img src={post.cover_image_url || '/placeholder.svg'} alt={post.title} className="w-full h-40 sm:h-32 md:h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
                            <Badge className="bg-blue-600/90 text-white border-0 text-xs">
                              {post.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="sm:w-2/3 p-4 sm:p-6">
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                            {post.tags.slice(0, 2).map(tag => <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-300">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>)}
                          </div>
                          
                          <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          
                          <p className="text-slate-300 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 text-sm sm:text-base">
                            {post.summary}
                          </p>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 gap-2 sm:gap-0">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <span className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                <span className="truncate max-w-24 sm:max-w-none">{post.author_name}</span>
                              </span>
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">{formatDate(post.published_at)}</span>
                                <span className="sm:hidden">{new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                              </span>
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {post.reading_time_minutes} min
                              </span>
                            </div>
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                <span className="hidden sm:inline">{post.views_count}</span>
                                <span className="sm:hidden">{post.views_count > 999 ? `${Math.floor(post.views_count/1000)}k` : post.views_count}</span>
                              </span>
                              <BlogPostVotes postId={post.id} initialLikes={post.likes_count || 0} initialDislikes={post.dislikes_count || 0} />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-slate-300 group-hover:text-blue-400 transition-colors">
                            <span className="text-sm font-medium">Ler artigo completo</span>
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>)}
              </div>
              
              {/* AdSense - Após último artigo */}
              <AdSenseAd 
                format="banner" 
                slot="3333333333"
                className="mt-8"
              />
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* AdSense - Sidebar Topo */}
            <AdSenseAd 
              format="rectangle" 
              slot="6666666666"
              className="mb-4 sm:mb-6"
            />

            {/* Categories */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-slate-200 text-lg sm:text-xl">Categorias Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 sm:space-y-2">
                  {['Direito Digital', 'LGPD', 'Trabalhista', 'Civil', 'Tributário'].map(category => <Button key={category} variant="ghost" size="sm" className="justify-start w-full text-slate-300 hover:text-blue-400 hover:bg-slate-700/50 h-8 sm:h-9 text-sm">
                      {category}
                    </Button>)}
                </div>
              </CardContent>
            </Card>

            {/* AdSense - Sidebar Meio */}
            <AdSenseAd 
              format="mobile" 
              slot="7777777777"
              className="mb-4 sm:mb-6"
            />

            {/* Newsletter */}
            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-slate-200 text-lg sm:text-xl">Newsletter Jurídica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm mb-3 sm:mb-4">
                  Receba as principais notícias jurídicas direto no seu e-mail
                </p>
                <Input 
                  placeholder="Seu e-mail" 
                  className="mb-3 bg-slate-800/50 border-slate-600 text-slate-200 text-sm h-10" 
                />
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-10 text-sm">
                  Assinar
                </Button>
              </CardContent>
            </Card>

            {/* Carrossel de Anúncios Customizados - Sidebar */}
            <CustomAdCarousel 
              position="blog_sidebar_custom" 
              className="mb-4 sm:mb-6"
              intervalMs={6000}
            />
          </div>
        </div>
      </div>


      {/* Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-700/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <button onClick={() => window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })} className="flex items-center gap-3 mb-4 cursor-pointer group">
                <img src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" alt="Oráculo Jurídico" className="h-8 w-auto transition-transform group-hover:scale-105" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all">
                  Oráculo Jurídico
                </span>
              </button>
              <p className="text-slate-400">
                Seu portal de informações jurídicas atualizadas e confiáveis.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-200">Links Úteis</h3>
              <ul className="space-y-2 text-slate-400">
                
                
                <li><Link to="/contato" className="hover:text-blue-400 transition-colors">Contato</Link></li>
                <li><Link to="/termos" className="hover:text-blue-400 transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-blue-400 transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>
            
            
          </div>
          
          <div className="border-t border-slate-700/50 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Oráculo Jurídico. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default BlogJuridico;