-- Primeiro, remover completamente qualquer constraint de posição
ALTER TABLE custom_ads DROP CONSTRAINT IF EXISTS custom_ads_position_check;

-- Atualizar todos os anúncios existentes para uma posição válida  
UPDATE custom_ads 
SET position = 'blog_sidebar_custom' 
WHERE position NOT IN ('blog_between_articles', 'blog_sidebar_custom');

-- Agora adicionar a nova constraint
ALTER TABLE custom_ads 
ADD CONSTRAINT custom_ads_position_check 
CHECK (position IN ('blog_between_articles', 'blog_sidebar_custom'));