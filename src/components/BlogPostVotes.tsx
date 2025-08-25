import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface BlogPostVotesProps {
  postId: string;
  initialLikes: number;
  initialDislikes: number;
}

export const BlogPostVotes: React.FC<BlogPostVotesProps> = ({
  postId,
  initialLikes,
  initialDislikes
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [dislikesCount, setDislikesCount] = useState(initialDislikes);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar voto do usuário atual
  useEffect(() => {
    if (user) {
      fetchUserVote();
    }
  }, [user, postId]);

  const fetchUserVote = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('blog_post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar voto:', error);
        return;
      }

      setUserVote(data?.vote_type as 'like' | 'dislike' || null);
    } catch (error) {
      console.error('Erro ao buscar voto:', error);
    }
  };

  const handleVote = async (voteType: 'like' | 'dislike') => {
    setLoading(true);

    try {
      // Se o usuário já votou no mesmo tipo, remover o voto
      if (userVote === voteType) {
        if (user) {
          const { error } = await supabase
            .from('blog_post_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
        }

        setUserVote(null);
        if (voteType === 'like') {
          setLikesCount(prev => prev - 1);
        } else {
          setDislikesCount(prev => prev - 1);
        }

        toast({
          title: "Voto removido",
          description: "Seu voto foi removido com sucesso.",
        });
      } else {
        // Para usuários logados, inserir/atualizar no banco
        if (user) {
          const { error } = await supabase
            .from('blog_post_votes')
            .upsert({
              post_id: postId,
              user_id: user.id,
              vote_type: voteType
            });

          if (error) throw error;
        }

        // Atualizar contadores localmente para todos os usuários
        if (userVote === 'like' && voteType === 'dislike') {
          setLikesCount(prev => prev - 1);
          setDislikesCount(prev => prev + 1);
        } else if (userVote === 'dislike' && voteType === 'like') {
          setDislikesCount(prev => prev - 1);
          setLikesCount(prev => prev + 1);
        } else if (!userVote) {
          if (voteType === 'like') {
            setLikesCount(prev => prev + 1);
          } else {
            setDislikesCount(prev => prev + 1);
          }
        }

        setUserVote(voteType);

        toast({
          title: "Voto registrado",
          description: `Você ${voteType === 'like' ? 'curtiu' : 'não curtiu'} este artigo.`,
        });
      }
    } catch (error) {
      console.error('Erro ao votar:', error);
      toast({
        title: "Erro ao votar",
        description: "Ocorreu um erro ao registrar seu voto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4 text-sm text-slate-400">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('like')}
          disabled={loading}
          className={`h-auto p-1 text-slate-400 hover:text-green-400 ${
            userVote === 'like' ? 'text-green-400' : ''
          }`}
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          <span>{likesCount}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleVote('dislike')}
          disabled={loading}
          className={`h-auto p-1 text-slate-400 hover:text-red-400 ${
            userVote === 'dislike' ? 'text-red-400' : ''
          }`}
        >
          <ThumbsDown className="w-4 h-4 mr-1" />
          <span>{dislikesCount}</span>
        </Button>
      </div>
    </div>
  );
};