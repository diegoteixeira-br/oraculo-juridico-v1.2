-- Corrigir a função check_and_expire_tokens que está causando erro
CREATE OR REPLACE FUNCTION public.check_and_expire_tokens(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expiry_date TIMESTAMPTZ;
  v_plan_type TEXT;
  v_plan_tokens BIGINT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Buscar dados do usuário
  SELECT token_expiry_date, plan_type, plan_tokens
  INTO v_expiry_date, v_plan_type, v_plan_tokens
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Se é plano essencial e tokens expiraram
  IF v_plan_type = 'Essencial' AND v_expiry_date IS NOT NULL AND v_expiry_date < v_now THEN
    -- Zerar tokens do plano
    UPDATE public.profiles
    SET 
      plan_tokens = 0,
      tokens = COALESCE(token_balance, 0),
      token_expiry_date = NULL,
      updated_at = v_now
    WHERE user_id = p_user_id;
    
    -- Registrar a expiração usando o valor que tínhamos antes do UPDATE
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'expiry',
      -v_plan_tokens::integer,
      'Tokens do plano essencial expiraram (7 dias sem renovação)'
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;