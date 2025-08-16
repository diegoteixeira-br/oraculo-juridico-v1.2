-- Adicionar campo para controlar se o vídeo está ativo na página de venda
ALTER TABLE public.landing_page_settings 
ADD COLUMN video_enabled BOOLEAN NOT NULL DEFAULT true;