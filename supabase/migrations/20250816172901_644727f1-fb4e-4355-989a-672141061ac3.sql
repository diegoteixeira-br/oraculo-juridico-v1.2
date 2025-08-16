-- Criar tabela para configurações da página de venda
CREATE TABLE public.landing_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  youtube_video_id TEXT,
  video_title TEXT DEFAULT 'Oráculo Jurídico - Demonstração',
  video_description TEXT DEFAULT 'Assista ao vídeo demonstrativo e descubra como o Oráculo Jurídico pode revolucionar sua prática advocatícia',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (apenas admins)
CREATE POLICY "Admins can view landing page settings" 
ON public.landing_page_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update landing page settings" 
ON public.landing_page_settings 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

CREATE POLICY "Admins can insert landing page settings" 
ON public.landing_page_settings 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_landing_page_settings_updated_at
BEFORE UPDATE ON public.landing_page_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir configuração padrão
INSERT INTO public.landing_page_settings (youtube_video_id, video_title, video_description) 
VALUES (
  'VIDEO_ID', 
  'Oráculo Jurídico - Demonstração',
  'Assista ao vídeo demonstrativo e descubra como o Oráculo Jurídico pode revolucionar sua prática advocatícia'
);