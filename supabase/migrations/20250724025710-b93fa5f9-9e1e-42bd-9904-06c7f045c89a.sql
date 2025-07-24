-- Corrigir função handle_new_user para garantir valores corretos
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
    daily_tokens,
    plan_tokens,
    plan_type
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    3000, -- Total igual aos tokens diários
    3000, -- Tokens diários
    0,    -- Tokens do plano
    'gratuito'
  );
  RETURN NEW;
END;
$$;