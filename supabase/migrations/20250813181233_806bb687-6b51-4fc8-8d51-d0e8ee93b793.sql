-- Atualizar função add_tokens_to_user para registrar data de ativação da assinatura
CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens bigint, p_plan_type text, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de tokens'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar os tokens do usuário e registrar data de ativação da assinatura
  UPDATE public.profiles 
  SET 
    plan_tokens = COALESCE(plan_tokens,0) + p_tokens,
    plan_type = p_plan_type,
    tokens = COALESCE(token_balance,0) + COALESCE(plan_tokens,0) + p_tokens,
    subscription_status = 'active',
    subscription_activated_at = COALESCE(subscription_activated_at, now()), -- Define apenas se ainda não foi definido
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    stripe_session_id
  ) VALUES (
    p_user_id, 
    'purchase', 
    p_tokens::integer, 
    p_description, 
    p_transaction_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Criar função para registrar renovação mensal de assinatura
CREATE OR REPLACE FUNCTION public.renew_monthly_subscription(p_user_id uuid, p_tokens bigint, p_transaction_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Renovar assinatura mensal - não muda a data de ativação original
  UPDATE public.profiles 
  SET 
    plan_tokens = COALESCE(plan_tokens,0) + p_tokens,
    tokens = COALESCE(token_balance,0) + COALESCE(plan_tokens,0) + p_tokens,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação de renovação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    stripe_session_id
  ) VALUES (
    p_user_id, 
    'renewal', 
    p_tokens::integer, 
    'Renovação mensal da assinatura', 
    p_transaction_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;