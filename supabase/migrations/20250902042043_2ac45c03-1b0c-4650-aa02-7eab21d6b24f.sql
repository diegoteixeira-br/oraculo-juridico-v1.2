-- Primeiro, atualizar anúncios existentes com posições antigas para uma das novas posições válidas
UPDATE custom_ads 
SET position = 'blog_sidebar_custom' 
WHERE position NOT IN ('blog_between_articles', 'blog_sidebar_custom');

-- Agora remover a constraint antiga
ALTER TABLE custom_ads DROP CONSTRAINT IF EXISTS custom_ads_position_check;

-- Adicionar nova constraint com as posições atualizadas
ALTER TABLE custom_ads ADD CONSTRAINT custom_ads_position_check 
CHECK (position IN (
  'blog_between_articles',
  'blog_sidebar_custom'
));