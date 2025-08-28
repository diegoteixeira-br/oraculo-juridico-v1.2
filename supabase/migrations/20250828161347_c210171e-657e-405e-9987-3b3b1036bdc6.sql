-- Adicionar Plano Profissional na tabela product_types
INSERT INTO public.product_types (
  name,
  category,
  tokens_included,
  price_cents,
  price_currency,
  billing_period,
  description,
  is_active
) VALUES (
  'Plano Profissional',
  'subscription',
  999999,  -- Tokens ilimitados (valor simbólico alto)
  9700,    -- R$ 97,00
  'BRL',
  'monthly',
  'Plano profissional com tokens ilimitados e suporte prioritário',
  true
) ON CONFLICT (name) DO UPDATE SET
  tokens_included = EXCLUDED.tokens_included,
  price_cents = EXCLUDED.price_cents,
  description = EXCLUDED.description,
  updated_at = now();