-- Corrigir função handle_new_user para usar a estrutura atual de tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    full_name,
    tokens,
    token_balance,
    plan_tokens,
    plan_type,
    subscription_status,
    trial_start_date,
    trial_end_date
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    15000, -- Total inicial de tokens (trial)
    15000, -- Tokens de trial
    0,     -- Tokens do plano (inicialmente zero)
    'gratuito',
    'trial',
    now(),
    now() + INTERVAL '7 days'
  );
  RETURN NEW;
END;
$$;