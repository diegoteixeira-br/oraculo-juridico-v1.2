-- Criar tabela para notícias externas
CREATE TABLE public.external_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  snippet TEXT NOT NULL CHECK (length(snippet) <= 280),
  source_name TEXT NOT NULL,
  author_name TEXT,
  original_url TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.external_news ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público de leitura
CREATE POLICY "External news are viewable by everyone" 
ON public.external_news 
FOR SELECT 
USING (is_active = true);

-- Políticas para administradores
CREATE POLICY "Admins can manage external news" 
ON public.external_news 
FOR ALL 
USING (public.is_current_user_admin()) 
WITH CHECK (public.is_current_user_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_external_news_updated_at
BEFORE UPDATE ON public.external_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_external_news_active ON public.external_news(is_active, display_order, created_at);
CREATE INDEX idx_external_news_created_at ON public.external_news(created_at);