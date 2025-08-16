-- Criar tabela para gerenciar anúncios personalizados
CREATE TABLE public.custom_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ad_type VARCHAR(50) NOT NULL CHECK (ad_type IN ('image', 'html', 'script')),
  content TEXT NOT NULL, -- URL da imagem, código HTML ou script
  link_url TEXT, -- URL de destino para anúncios de imagem
  position VARCHAR(50) NOT NULL CHECK (position IN ('header', 'sidebar_top', 'sidebar_middle', 'sidebar_bottom', 'content_top', 'content_middle', 'content_bottom', 'footer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  click_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.custom_ads ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para anúncios - apenas admins podem gerenciar
CREATE POLICY "Admins podem gerenciar anúncios" 
ON public.custom_ads 
FOR ALL 
USING (public.is_current_user_admin());

-- Anúncios ativos são visíveis para todos
CREATE POLICY "Anúncios ativos são públicos" 
ON public.custom_ads 
FOR SELECT 
USING (
  is_active = true 
  AND (start_date IS NULL OR start_date <= now()) 
  AND (end_date IS NULL OR end_date >= now())
);

-- Índices para performance
CREATE INDEX idx_custom_ads_position ON public.custom_ads(position);
CREATE INDEX idx_custom_ads_active ON public.custom_ads(is_active);
CREATE INDEX idx_custom_ads_dates ON public.custom_ads(start_date, end_date);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_custom_ads_updated_at
  BEFORE UPDATE ON public.custom_ads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_blog_posts_updated_at();