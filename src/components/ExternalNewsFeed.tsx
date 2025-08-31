import { useEffect, useState } from 'react';
import { ExternalLink, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface ExternalNews {
  id: string;
  title: string;
  snippet: string;
  source_name: string;
  author_name?: string;
  original_url: string;
  image_url?: string;
  created_at: string;
}

interface ExternalNewsFeedProps {
  limit?: number;
  className?: string;
}

export const ExternalNewsFeed = ({ limit = 6, className = "" }: ExternalNewsFeedProps) => {
  const [news, setNews] = useState<ExternalNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExternalNews();
  }, []);

  const fetchExternalNews = async () => {
    try {
      const { data, error } = await supabase
        .from('external_news')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Erro ao buscar notícias externas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-800/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <section className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-200">
            Radar Jurídico: <span className="text-blue-400">Fique por Dentro</span>
          </h2>
        </div>
      </div>
      
      <p className="text-slate-300 text-sm mb-6">
        Notícias selecionadas de sites jurídicos renomados para manter você sempre atualizado
      </p>

      <div className="grid gap-4">
        {news.map((item, index) => (
          <Card
            key={item.id}
            className="group hover-scale bg-slate-800/40 border-slate-700 hover:border-blue-500/50 transition-all duration-300 animate-fade-in overflow-hidden"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-0">
              <div className="flex h-full">
                {/* Imagem lateral */}
                {item.image_url && (
                  <div className="w-24 md:w-32 flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Conteúdo */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Título */}
                      <h3 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                      
                      {/* Snippet */}
                      <p className="text-sm text-slate-300 line-clamp-2 mb-3">
                        {item.snippet}
                      </p>
                      
                      {/* Créditos */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
                        <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-300 bg-blue-500/10">
                          <User className="w-3 h-3 mr-1" />
                          {item.author_name ? `${item.author_name} | ` : ''}
                          Fonte: {item.source_name}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botão de ação */}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
                      onClick={() => window.open(item.original_url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Leia a Matéria Completa
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Disclaimer ético */}
      <div className="text-xs text-slate-500 bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
        <p className="mb-1">
          <strong>Nota Importante:</strong> As notícias acima são de propriedade dos respectivos sites de origem. 
          O conteúdo é apresentado apenas como referência, com os devidos créditos aos autores e fontes originais.
        </p>
        <p>
          Para ler o conteúdo completo, clique no link "Leia a Matéria Completa" que o direcionará ao site original.
        </p>
      </div>
    </section>
  );
};