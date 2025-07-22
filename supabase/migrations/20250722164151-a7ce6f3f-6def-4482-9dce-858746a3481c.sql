-- Atualizar sistema de créditos para 2 créditos diários
-- Alterar default dos créditos diários de 3 para 2
ALTER TABLE public.profiles 
ALTER COLUMN daily_credits SET DEFAULT 2;

-- Atualizar função reset_daily_credits_if_needed para usar 2 créditos
CREATE OR REPLACE FUNCTION public.reset_daily_credits_if_needed(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se precisa resetar os créditos diários (se a data mudou)
  UPDATE public.profiles 
  SET 
    daily_credits = 2,
    last_daily_reset = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND (last_daily_reset < CURRENT_DATE OR last_daily_reset IS NULL);

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Resetar todos os usuários existentes para 2 créditos diários
UPDATE public.profiles 
SET daily_credits = 2, updated_at = now() 
WHERE daily_credits = 3;