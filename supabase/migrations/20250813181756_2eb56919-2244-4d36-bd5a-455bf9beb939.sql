-- Atualizar função add_tokens_to_user para sempre registrar a data correta do pagamento
CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens bigint, p_plan_type text, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de tokens'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atualizar os tokens do usuário e sempre registrar data de ativação como NOW (data do pagamento)
  UPDATE public.profiles 
  SET 
    plan_tokens = COALESCE(plan_tokens,0) + p_tokens,
    plan_type = p_plan_type,
    tokens = COALESCE(token_balance,0) + COALESCE(plan_tokens,0) + p_tokens,
    subscription_status = 'active',
    subscription_activated_at = now(), -- Sempre atualiza com a data atual (data do pagamento)
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