-- Adicionar Plano Profissional na tabela product_types
INSERT INTO public.product_types (
  id,
  name,
  category,
  tokens_included,
  price_cents,
  price_currency,
  billing_period,
  description,
  is_active
) VALUES (
  'prof-plan-id-123',
  'Plano Profissional',
  'subscription',
  999999,  -- Tokens ilimitados (valor simbólico alto)
  9700,    -- R$ 97,00
  'BRL',
  'monthly',
  'Plano profissional com tokens ilimitados e suporte prioritário',
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  tokens_included = EXCLUDED.tokens_included,
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  updated_at = now();