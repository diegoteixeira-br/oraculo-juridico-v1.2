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