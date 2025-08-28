-- Atualizar valores no banco para corresponder à interface
UPDATE public.product_types SET 
  price_cents = 5990,  -- R$ 59,90
  tokens_included = 30000
WHERE name = 'Plano Básico';

UPDATE public.product_types SET 
  price_cents = 9700,  -- R$ 97,00  
  tokens_included = 999999
WHERE name = 'Plano Profissional';

UPDATE public.product_types SET 
  price_cents = 3990,  -- R$ 39,90
  tokens_included = 25000,
  name = 'Recarga Rápida',
  description = 'Pacote de 25.000 tokens para uso rápido'
WHERE id = 'b0571fb3-1fdf-437d-9b00-19edd1e89a23';

UPDATE public.product_types SET 
  price_cents = 6990,  -- R$ 69,90
  tokens_included = 50000,
  name = 'Recarga Inteligente', 
  description = 'Pacote de 50.000 tokens com melhor custo-benefício'
WHERE id = '9c75ed7c-8c4c-46c4-8576-931393d3f292';