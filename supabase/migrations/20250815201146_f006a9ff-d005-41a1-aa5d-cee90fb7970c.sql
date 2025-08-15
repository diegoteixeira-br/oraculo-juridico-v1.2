-- Corrigir função handle_new_user para dar 15.000 tokens iniciais
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
    cpf
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    15000, -- Total de tokens iniciais
    15000, -- Tokens de teste (trial)
    0,     -- Tokens do plano
    'gratuito',
    NEW.raw_user_meta_data->>'cpf'
  );
  RETURN NEW;
END;
$$;