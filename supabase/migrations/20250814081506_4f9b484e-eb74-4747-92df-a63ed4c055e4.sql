-- Atualizar os dados dos pacotes de tokens para corresponder aos Payment Links do Stripe
UPDATE product_types 
SET 
  tokens_included = 75000,
  price_cents = 5990,
  name = 'Pacote Básico',
  description = 'Pacote básico de 75.000 tokens'
WHERE name = 'Pacote Básico' AND category = 'token_pack';

UPDATE product_types 
SET 
  tokens_included = 150000,
  price_cents = 9700,
  name = 'Pacote Premium', 
  description = 'Pacote premium de 150.000 tokens'
WHERE name = 'Pacote Premium' AND category = 'token_pack';

-- Verificar se há um produto para o Plano Essencial e atualizá-lo se necessário
UPDATE product_types 
SET 
  tokens_included = 30000,
  price_cents = 3790,
  name = 'Essencial',
  description = 'Plano essencial mensal',
  billing_period = 'monthly'
WHERE name = 'Essencial' AND category = 'subscription';