-- Criar tabela para tipos de produtos
CREATE TABLE public.product_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('subscription', 'token_pack')),
  tokens_included BIGINT NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0,
  price_currency TEXT NOT NULL DEFAULT 'BRL',
  billing_period TEXT NULL CHECK (billing_period IN ('monthly', 'yearly', 'one_time')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inserir os tipos de produtos
INSERT INTO public.product_types (name, category, tokens_included, price_cents, billing_period, description) VALUES
('Gratuito', 'subscription', 15000, 0, NULL, 'Plano gratuito com período de teste'),
('Essencial', 'subscription', 50000, 4900, 'monthly', 'Plano essencial mensal'),
('Pacote Básico', 'token_pack', 25000, 2900, 'one_time', 'Pacote básico de tokens'),
('Pacote Premium', 'token_pack', 60000, 5900, 'one_time', 'Pacote premium de tokens');

-- Criar tabela para compras/transações detalhadas
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_type_id UUID NOT NULL REFERENCES public.product_types(id),
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  tokens_granted BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Habilitar RLS
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Políticas para product_types (públicas para usuários autenticados)
CREATE POLICY "Authenticated users can view active products" 
ON public.product_types 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins manage product_types" 
ON public.product_types 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Políticas para purchases
CREATE POLICY "Users can view their own purchases" 
ON public.purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchases" 
ON public.purchases 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update purchases" 
ON public.purchases 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can view all purchases" 
ON public.purchases 
FOR SELECT 
USING (is_current_user_admin());

-- Atualizar função add_tokens_to_user para usar a nova estrutura
CREATE OR REPLACE FUNCTION public.add_tokens_to_user_v2(
  p_user_id uuid, 
  p_product_type_id uuid,
  p_stripe_session_id text DEFAULT NULL,
  p_payment_intent_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_product_type RECORD;
  v_purchase_id UUID;
BEGIN
  -- Buscar informações do tipo de produto
  SELECT * INTO v_product_type
  FROM public.product_types
  WHERE id = p_product_type_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tipo de produto não encontrado ou inativo';
  END IF;
  
  -- Registrar a compra
  INSERT INTO public.purchases (
    user_id,
    product_type_id,
    stripe_session_id,
    stripe_payment_intent_id,
    amount_cents,
    currency,
    tokens_granted,
    status,
    completed_at
  ) VALUES (
    p_user_id,
    p_product_type_id,
    p_stripe_session_id,
    p_payment_intent_id,
    v_product_type.price_cents,
    v_product_type.price_currency,
    v_product_type.tokens_included,
    'completed',
    now()
  ) RETURNING id INTO v_purchase_id;
  
  -- Atualizar profile baseado no tipo de produto
  IF v_product_type.category = 'subscription' THEN
    -- É uma assinatura
    UPDATE public.profiles 
    SET 
      plan_tokens = COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      plan_type = v_product_type.name,
      tokens = COALESCE(token_balance, 0) + COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      subscription_status = 'active',
      subscription_activated_at = COALESCE(subscription_activated_at, now()),
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- É compra de tokens avulsa
    UPDATE public.profiles 
    SET 
      plan_tokens = COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      tokens = COALESCE(token_balance, 0) + COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Registrar na tabela de transações (para compatibilidade)
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    stripe_session_id
  ) VALUES (
    p_user_id, 
    CASE 
      WHEN v_product_type.category = 'subscription' THEN 'subscription'
      ELSE 'token_purchase'
    END,
    v_product_type.tokens_included::integer, 
    CONCAT('Compra: ', v_product_type.name, ' - ', v_product_type.description), 
    p_stripe_session_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_product_types_updated_at
  BEFORE UPDATE ON public.product_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();