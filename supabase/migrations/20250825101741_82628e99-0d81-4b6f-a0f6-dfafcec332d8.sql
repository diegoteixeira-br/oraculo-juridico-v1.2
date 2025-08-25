-- Criar tabela para votos em artigos do blog
CREATE TABLE IF NOT EXISTS public.blog_post_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garantir que um usuário só pode votar uma vez por post
  UNIQUE(post_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.blog_post_votes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem ver todos os votos" 
ON public.blog_post_votes 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários logados podem votar" 
ON public.blog_post_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios votos" 
ON public.blog_post_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios votos" 
ON public.blog_post_votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_blog_post_votes_updated_at
BEFORE UPDATE ON public.blog_post_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- Adicionar colunas de contadores na tabela blog_posts para performance
ALTER TABLE public.blog_posts 
ADD COLUMN likes_count INTEGER DEFAULT 0,
ADD COLUMN dislikes_count INTEGER DEFAULT 0;

-- Função para atualizar contadores
CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular contadores para o post afetado
  UPDATE public.blog_posts 
  SET 
    likes_count = (
      SELECT COUNT(*) FROM public.blog_post_votes 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND vote_type = 'like'
    ),
    dislikes_count = (
      SELECT COUNT(*) FROM public.blog_post_votes 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND vote_type = 'dislike'
    )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para manter contadores atualizados
CREATE TRIGGER update_vote_counts_insert
AFTER INSERT ON public.blog_post_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_vote_counts();

CREATE TRIGGER update_vote_counts_update
AFTER UPDATE ON public.blog_post_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_vote_counts();

CREATE TRIGGER update_vote_counts_delete
AFTER DELETE ON public.blog_post_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_vote_counts();