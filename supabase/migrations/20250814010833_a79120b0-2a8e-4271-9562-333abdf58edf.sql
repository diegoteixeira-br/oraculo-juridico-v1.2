-- Criar uma função específica para adição administrativa de tokens
-- que é mais simples e direta que a função de pagamento
CREATE OR REPLACE FUNCTION public.admin_add_tokens_to_user(
  p_user_id uuid, 
  p_tokens bigint, 
  p_description text DEFAULT 'Adição administrativa de tokens'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_tokens BIGINT;
  v_current_plan_tokens BIGINT;
  v_current_token_balance BIGINT;
BEGIN
  -- Buscar dados atuais do usuário
  SELECT tokens, plan_tokens, token_balance
  INTO v_current_tokens, v_current_plan_tokens, v_current_token_balance
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Atualizar tokens de forma simples e direta
  UPDATE public.profiles 
  SET 
    plan_tokens = COALESCE(plan_tokens, 0) + p_tokens,
    tokens = COALESCE(tokens, 0) + p_tokens,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description,
    status
  ) VALUES (
    p_user_id, 
    'admin_addition',
    p_tokens::integer, 
    p_description,
    'completed'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro ao adicionar tokens administrativamente: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Criar uma função específica para remoção administrativa de tokens
CREATE OR REPLACE FUNCTION public.admin_remove_tokens_from_user(
  p_user_id uuid, 
  p_tokens bigint, 
  p_description text DEFAULT 'Remoção administrativa de tokens'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verificar se o usuário tem tokens suficientes
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = p_user_id AND COALESCE(tokens, 0) >= p_tokens
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Remover tokens de forma segura
  UPDATE public.profiles 
  SET 
    plan_tokens = GREATEST(0, COALESCE(plan_tokens, 0) - p_tokens),
    tokens = GREATEST(0, COALESCE(tokens, 0) - p_tokens),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description,
    status
  ) VALUES (
    p_user_id, 
    'admin_removal',
    -p_tokens::integer, 
    p_description,
    'completed'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erro ao remover tokens administrativamente: %', SQLERRM;
    RETURN FALSE;
END;
$$;