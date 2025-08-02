-- Atualizar função use_credits para usar apenas inteiros
CREATE OR REPLACE FUNCTION public.use_credits(p_user_id uuid, p_credits integer, p_description text DEFAULT 'Uso de créditos na consulta'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_credits INTEGER;
  current_daily_credits INTEGER;
  credits_to_use_from_daily INTEGER;
  credits_to_use_from_purchased INTEGER;
BEGIN
  -- Resetar créditos diários se necessário
  PERFORM public.reset_daily_credits_if_needed(p_user_id);
  
  -- Buscar créditos atuais
  SELECT credits, daily_credits INTO current_credits, current_daily_credits
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL OR current_daily_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se tem créditos suficientes (diários + comprados)
  IF (current_daily_credits + current_credits) < p_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Usar créditos diários primeiro
  credits_to_use_from_daily := LEAST(p_credits, current_daily_credits);
  credits_to_use_from_purchased := p_credits - credits_to_use_from_daily;
  
  -- Atualizar créditos
  UPDATE public.profiles 
  SET 
    daily_credits = daily_credits - credits_to_use_from_daily,
    credits = credits - credits_to_use_from_purchased,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação (separar diários dos comprados se ambos foram usados)
  IF credits_to_use_from_daily > 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'daily_usage', 
      -credits_to_use_from_daily, 
      CONCAT(p_description, ' (créditos diários)')
    );
  END IF;
  
  IF credits_to_use_from_purchased > 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'usage', 
      -credits_to_use_from_purchased, 
      CONCAT(p_description, ' (créditos comprados)')
    );
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Atualizar função add_credits_to_user para usar apenas inteiros
CREATE OR REPLACE FUNCTION public.add_credits_to_user(p_user_id uuid, p_credits integer, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de créditos'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Atualizar os créditos do usuário
  UPDATE public.profiles 
  SET 
    credits = credits + p_credits,
    total_credits_purchased = total_credits_purchased + p_credits,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    cakto_transaction_id
  ) VALUES (
    p_user_id, 
    'purchase', 
    p_credits, 
    p_description, 
    p_transaction_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;