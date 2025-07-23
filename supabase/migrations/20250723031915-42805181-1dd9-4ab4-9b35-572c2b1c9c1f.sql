-- Reestruturação completa do sistema de créditos para tokens
-- Atualizar tabela profiles para usar tokens ao invés de créditos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_tokens BIGINT DEFAULT 3000,
ADD COLUMN IF NOT EXISTS plan_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_type_new TEXT DEFAULT 'gratuito' CHECK (plan_type_new IN ('gratuito', 'basico', 'premium'));

-- Migrar dados existentes (converter créditos para tokens - assumindo 1 crédito = 1000 tokens)
UPDATE public.profiles 
SET 
  tokens = COALESCE(credits::bigint, 0) * 1000,
  plan_tokens = COALESCE(total_credits_purchased, 0) * 1000,
  daily_tokens = CASE 
    WHEN plan_type = 'gratuito' THEN 3000 
    ELSE 0 
  END,
  plan_type_new = COALESCE(plan_type, 'gratuito');

-- Remover colunas antigas após migração
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS credits,
DROP COLUMN IF EXISTS daily_credits,
DROP COLUMN IF EXISTS total_credits_purchased,
DROP COLUMN IF EXISTS plan_type;

-- Renomear nova coluna
ALTER TABLE public.profiles 
RENAME COLUMN plan_type_new TO plan_type;

-- Atualizar função para resetar tokens diários
CREATE OR REPLACE FUNCTION public.reset_daily_tokens_if_needed(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se precisa resetar os tokens diários (se a data mudou)
  UPDATE public.profiles 
  SET 
    daily_tokens = CASE 
      WHEN plan_type = 'gratuito' THEN 3000 
      ELSE 0 
    END,
    last_daily_reset = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id 
    AND (last_daily_reset < CURRENT_DATE OR last_daily_reset IS NULL)
    AND plan_type = 'gratuito';

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Atualizar função para usar tokens
CREATE OR REPLACE FUNCTION public.use_tokens(p_user_id uuid, p_tokens bigint, p_description text DEFAULT 'Uso de tokens na consulta'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_tokens BIGINT;
  current_daily_tokens BIGINT;
  current_plan_tokens BIGINT;
  user_plan_type TEXT;
  tokens_to_use_from_daily BIGINT;
  tokens_to_use_from_plan BIGINT;
BEGIN
  -- Resetar tokens diários se necessário para plano gratuito
  PERFORM public.reset_daily_tokens_if_needed(p_user_id);
  
  -- Buscar tokens atuais
  SELECT tokens, daily_tokens, plan_tokens, plan_type 
  INTO current_tokens, current_daily_tokens, current_plan_tokens, user_plan_type
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF current_tokens IS NULL OR current_daily_tokens IS NULL OR current_plan_tokens IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se tem tokens suficientes baseado no plano
  IF user_plan_type = 'gratuito' THEN
    -- Plano gratuito: só pode usar tokens diários
    IF current_daily_tokens < p_tokens THEN
      RETURN FALSE;
    END IF;
    tokens_to_use_from_daily := p_tokens;
    tokens_to_use_from_plan := 0;
  ELSE
    -- Planos pagos: usar tokens do plano
    IF current_plan_tokens < p_tokens THEN
      RETURN FALSE;
    END IF;
    tokens_to_use_from_daily := 0;
    tokens_to_use_from_plan := p_tokens;
  END IF;
  
  -- Atualizar tokens
  UPDATE public.profiles 
  SET 
    daily_tokens = daily_tokens - tokens_to_use_from_daily,
    plan_tokens = plan_tokens - tokens_to_use_from_plan,
    tokens = tokens - p_tokens,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação
  IF tokens_to_use_from_daily > 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'daily_usage', 
      -tokens_to_use_from_daily::integer, 
      CONCAT(p_description, ' (tokens diários)')
    );
  END IF;
  
  IF tokens_to_use_from_plan > 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'usage', 
      -tokens_to_use_from_plan::integer, 
      CONCAT(p_description, ' (tokens do plano)')
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Atualizar função para adicionar tokens
CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens bigint, p_plan_type text, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de tokens'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar os tokens do usuário
  UPDATE public.profiles 
  SET 
    tokens = tokens + p_tokens,
    plan_tokens = CASE 
      WHEN p_plan_type != 'gratuito' THEN p_tokens 
      ELSE plan_tokens 
    END,
    plan_type = p_plan_type,
    daily_tokens = CASE 
      WHEN p_plan_type = 'gratuito' THEN 3000 
      ELSE 0 
    END,
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
    p_tokens::integer, 
    p_description, 
    p_transaction_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;