import React, { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
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
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para votar nos artigos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Se o usuário já votou no mesmo tipo, remover o voto
      if (userVote === voteType) {
        const { error } = await supabase
          .from('blog_post_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;

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
        // Inserir ou atualizar voto
        const { error } = await supabase
          .from('blog_post_votes')
          .upsert({
            post_id: postId,
            user_id: user.id,
            vote_type: voteType
          });

        if (error) throw error;

        // Atualizar contadores localmente
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
          description: `Você ${voteType === 'like' ? 'curtiu' : 'descurtiu'} este artigo.`,
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
    <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center text-sm text-muted-foreground">
        Avalie este artigo:
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant={userVote === 'like' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleVote('like')}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Heart className={`w-4 h-4 ${userVote === 'like' ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </Button>

        <Button
          variant={userVote === 'dislike' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => handleVote('dislike')}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <HeartOff className={`w-4 h-4 ${userVote === 'dislike' ? 'fill-current' : ''}`} />
          <span>{dislikesCount}</span>
        </Button>
      </div>

      {!user && (
        <div className="text-sm text-muted-foreground ml-2">
          <a href="/login" className="text-primary hover:underline">
            Faça login
          </a>{' '}
          para votar
        </div>
      )}
    </div>
  );
};