-- Atualizar o produto Essencial para "Plano Básico" com novo preço
UPDATE public.product_types 
SET 
  name = 'Plano Básico',
  price_cents = 4459, -- R$ 44,59 em centavos
  description = 'Plano básico mensal com 30k tokens',
  updated_at = now()
WHERE name = 'Essencial' AND category = 'subscription' AND is_active = true;