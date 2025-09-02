-- Remover a constraint antiga de posição
ALTER TABLE custom_ads DROP CONSTRAINT IF EXISTS custom_ads_position_check;

-- Adicionar nova constraint com as posições atualizadas
ALTER TABLE custom_ads ADD CONSTRAINT custom_ads_position_check 
CHECK (position IN (
  'blog_between_articles',
  'blog_sidebar_custom'
));