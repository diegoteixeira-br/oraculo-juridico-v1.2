-- Adicionar campo CPF na tabela profiles
ALTER TABLE public.profiles ADD COLUMN cpf TEXT;

-- Criar índice único para CPF
CREATE UNIQUE INDEX idx_profiles_cpf_unique ON public.profiles(cpf) WHERE cpf IS NOT NULL;

-- Atualizar função handle_new_user para incluir CPF
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    full_name,
    cpf,
    tokens,
    plan_tokens,
    token_balance,
    plan_type
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'cpf',
    0,
    0,
    3000, -- Tokens de teste
    'gratuito'
  );
  RETURN NEW;
END;
$$;