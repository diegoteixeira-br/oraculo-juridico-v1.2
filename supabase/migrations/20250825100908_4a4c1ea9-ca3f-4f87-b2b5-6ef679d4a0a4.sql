-- Criar tabela de comentários para o blog
CREATE TABLE public.blog_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(post_id);
CREATE INDEX idx_blog_comments_user_id ON public.blog_comments(user_id);
CREATE INDEX idx_blog_comments_parent ON public.blog_comments(parent_comment_id);
CREATE INDEX idx_blog_comments_created_at ON public.blog_comments(created_at);

-- Habilitar RLS
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Comentários aprovados são públicos" 
ON public.blog_comments 
FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Usuários podem criar comentários" 
ON public.blog_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus próprios comentários" 
ON public.blog_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios comentários" 
ON public.blog_comments 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar todos os comentários" 
ON public.blog_comments 
FOR ALL 
USING (is_current_user_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_blog_comments_updated_at
BEFORE UPDATE ON public.blog_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_posts_updated_at();