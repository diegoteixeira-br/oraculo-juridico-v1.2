-- Renomear coluna cakto_transaction_id para stripe_session_id
ALTER TABLE public.credit_transactions 
RENAME COLUMN cakto_transaction_id TO stripe_session_id;

-- Atualizar função add_tokens_to_user para usar stripe_session_id
CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens bigint, p_plan_type text, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de tokens'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar os tokens do usuário mantendo os tokens diários
  UPDATE public.profiles 
  SET 
    tokens = tokens + p_tokens,
    plan_tokens = plan_tokens + p_tokens,
    plan_type = p_plan_type,
    -- Manter daily_tokens como está, não zerar
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