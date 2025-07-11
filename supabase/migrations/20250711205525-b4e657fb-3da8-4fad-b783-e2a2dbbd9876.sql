-- Função para resetar créditos diários
CREATE OR REPLACE FUNCTION public.reset_daily_credits_if_needed(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Verifica se precisa resetar os créditos diários (se a data mudou)
  UPDATE public.profiles 
  SET 
    daily_credits = 3,
    last_daily_reset = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND (last_daily_reset < CURRENT_DATE OR last_daily_reset IS NULL);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$

-- Atualizar função use_credits para usar créditos diários primeiro
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
$function$