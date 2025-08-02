-- Ajustar sistema para manter tokens diários mesmo em planos pagos
-- Atualizar função para resetar tokens diários para todos os usuários
CREATE OR REPLACE FUNCTION public.reset_daily_tokens_if_needed(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se precisa resetar os tokens diários (se a data mudou)
  -- Agora todos os usuários recebem 3000 tokens diários, independente do plano
  UPDATE public.profiles 
  SET 
    daily_tokens = 3000,
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

-- Atualizar função para adicionar tokens sem zerar tokens diários
CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens bigint, p_plan_type text, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de tokens'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar os tokens do usuário mantendo os tokens diários
  UPDATE public.profiles 
  SET 
    tokens = tokens + p_tokens,
    plan_tokens = plan_tokens + p_tokens,
    plan_type = p_plan_type,
    -- Manter daily_tokens como está, não zerar
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

-- Atualizar função use_tokens para permitir usar tokens diários + do plano
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
  total_available_tokens BIGINT;
BEGIN
  -- Resetar tokens diários se necessário (agora para todos os usuários)
  PERFORM public.reset_daily_tokens_if_needed(p_user_id);
  
  -- Buscar tokens atuais
  SELECT tokens, daily_tokens, plan_tokens, plan_type 
  INTO current_tokens, current_daily_tokens, current_plan_tokens, user_plan_type
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF current_tokens IS NULL OR current_daily_tokens IS NULL OR current_plan_tokens IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular total de tokens disponíveis (diários + do plano)
  total_available_tokens := current_daily_tokens + current_plan_tokens;
  
  -- Verificar se tem tokens suficientes
  IF total_available_tokens < p_tokens THEN
    RETURN FALSE;
  END IF;
  
  -- Usar tokens diários primeiro, depois tokens do plano
  tokens_to_use_from_daily := LEAST(p_tokens, current_daily_tokens);
  tokens_to_use_from_plan := p_tokens - tokens_to_use_from_daily;
  
  -- Atualizar tokens
  UPDATE public.profiles 
  SET 
    daily_tokens = daily_tokens - tokens_to_use_from_daily,
    plan_tokens = plan_tokens - tokens_to_use_from_plan,
    tokens = tokens - p_tokens,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar as transações
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