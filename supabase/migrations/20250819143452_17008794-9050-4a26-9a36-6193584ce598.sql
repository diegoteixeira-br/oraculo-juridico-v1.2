-- Criar tabela para configurações do blog
CREATE TABLE IF NOT EXISTS public.blog_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  google_adsense_client_id TEXT,
  google_adsense_enabled BOOLEAN DEFAULT true,
  google_analytics_id TEXT,
  meta_title TEXT DEFAULT 'Blog Jurídico - Oráculo Jurídico',
  meta_description TEXT DEFAULT 'Artigos especializados em direito e jurisprudência',
  keywords TEXT DEFAULT 'direito, jurídico, advogados, legislação, jurisprudência',
  favicon TEXT,
  social_image TEXT,
  canonical_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.blog_settings ENABLE ROW LEVEL SECURITY;

-- Criar políticas para administradores
CREATE POLICY "Admins manage blog_settings" 
ON public.blog_settings 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_blog_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_settings_updated_at
BEFORE UPDATE ON public.blog_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_settings_updated_at();

-- Inserir configurações padrão se não existir
INSERT INTO public.blog_settings (
  google_adsense_enabled,
  meta_title,
  meta_description,
  keywords
) 
SELECT 
  true,
  'Blog Jurídico - Oráculo Jurídico',
  'Artigos especializados em direito e jurisprudência',
  'direito, jurídico, advogados, legislação, jurisprudência'
WHERE NOT EXISTS (SELECT 1 FROM public.blog_settings LIMIT 1);