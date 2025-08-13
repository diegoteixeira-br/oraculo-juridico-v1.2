-- Adicionar coluna para controlar data de última renovação na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_renewal_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS token_expiry_date TIMESTAMPTZ DEFAULT NULL;

-- Atualizar função add_tokens_to_user para implementar a regra do plano essencial
CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens bigint, p_plan_type text, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de tokens'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_plan_tokens BIGINT;
  v_current_subscription_status TEXT;
  v_last_renewal TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  v_expiry_date TIMESTAMPTZ;
  v_tokens_to_add BIGINT := p_tokens;
BEGIN
  -- Buscar dados atuais do usuário
  SELECT plan_tokens, subscription_status, last_renewal_date
  INTO v_current_plan_tokens, v_current_subscription_status, v_last_renewal
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Se é plano Essencial e é uma renovação
  IF p_plan_type = 'Essencial' AND v_current_subscription_status = 'active' THEN
    -- Verificar se é uma renovação (já tinha assinatura ativa)
    IF v_last_renewal IS NOT NULL THEN
      -- Se a última renovação foi há mais de 7 dias, zerar tokens antigos
      IF v_last_renewal + INTERVAL '7 days' < v_now THEN
        -- Perdeu os tokens por não renovar a tempo
        v_current_plan_tokens := 0;
      END IF;
      -- Se renovar dentro de 7 dias, mantém os tokens acumulados
    END IF;
    
    -- Somar tokens novos com os existentes (se ainda válidos)
    v_tokens_to_add := p_tokens + COALESCE(v_current_plan_tokens, 0);
    
    -- Definir data de expiração dos tokens (7 dias após a renovação)
    v_expiry_date := v_now + INTERVAL '7 days';
  ELSE
    v_expiry_date := NULL; -- Outros planos não têm expiração de tokens
  END IF;

  -- Atualizar profile com a nova lógica
  UPDATE public.profiles 
  SET 
    plan_tokens = v_tokens_to_add,
    plan_type = p_plan_type,
    tokens = COALESCE(token_balance, 0) + v_tokens_to_add,
    subscription_status = 'active',
    subscription_activated_at = COALESCE(subscription_activated_at, v_now),
    last_renewal_date = v_now,
    token_expiry_date = v_expiry_date,
    updated_at = v_now
  WHERE user_id = p_user_id;
  
  -- Registrar a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    stripe_session_id
  ) VALUES (
    p_user_id, 
    CASE 
      WHEN v_current_subscription_status = 'active' THEN 'renewal'
      ELSE 'purchase'
    END,
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

-- Função para verificar e expirar tokens do plano essencial
CREATE OR REPLACE FUNCTION public.check_and_expire_tokens(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expiry_date TIMESTAMPTZ;
  v_plan_type TEXT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Buscar dados do usuário
  SELECT token_expiry_date, plan_type
  INTO v_expiry_date, v_plan_type
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Se é plano essencial e tokens expiraram
  IF v_plan_type = 'Essencial' AND v_expiry_date IS NOT NULL AND v_expiry_date < v_now THEN
    -- Zerar tokens do plano
    UPDATE public.profiles
    SET 
      plan_tokens = 0,
      tokens = COALESCE(token_balance, 0),
      token_expiry_date = NULL,
      updated_at = v_now
    WHERE user_id = p_user_id;
    
    -- Registrar a expiração
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'expiry',
      -(SELECT plan_tokens FROM public.profiles WHERE user_id = p_user_id)::integer,
      'Tokens do plano essencial expiraram (7 dias sem renovação)'
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Atualizar função use_tokens para verificar expiração antes de usar
CREATE OR REPLACE FUNCTION public.use_tokens(p_user_id uuid, p_tokens bigint, p_description text DEFAULT 'Uso de tokens na consulta'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tokens BIGINT;
  v_plan_tokens BIGINT;
  v_token_balance BIGINT;
  v_subscription_status TEXT;
  v_trial_end TIMESTAMPTZ;
  v_now TIMESTAMPTZ := now();
  use_from_trial BIGINT := 0;
  use_from_plan BIGINT := 0;
  trial_active BOOLEAN := FALSE;
BEGIN
  -- Verificar e expirar tokens se necessário
  PERFORM check_and_expire_tokens(p_user_id);

  -- Buscar dados atualizados do usuário
  SELECT tokens, plan_tokens, token_balance, subscription_status, trial_end_date
  INTO v_tokens, v_plan_tokens, v_token_balance, v_subscription_status, v_trial_end
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_tokens IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Determinar se trial está ativo
  trial_active := (COALESCE(v_subscription_status, 'trial') = 'trial') AND 
                  (v_trial_end IS NULL OR v_now < v_trial_end) AND 
                  (COALESCE(v_token_balance,0) > 0);

  IF trial_active THEN
    use_from_trial := LEAST(p_tokens, COALESCE(v_token_balance,0));
  ELSE
    use_from_trial := 0;
  END IF;

  use_from_plan := p_tokens - use_from_trial;

  IF (COALESCE(v_token_balance,0) + COALESCE(v_plan_tokens,0)) < p_tokens THEN
    RETURN FALSE;
  END IF;

  -- Atualizar saldos
  UPDATE public.profiles
  SET 
    token_balance = GREATEST(0, COALESCE(token_balance,0) - use_from_trial),
    plan_tokens = GREATEST(0, COALESCE(plan_tokens,0) - use_from_plan),
    tokens = GREATEST(0, (COALESCE(token_balance,0) - use_from_trial)) + GREATEST(0, (COALESCE(plan_tokens,0) - use_from_plan)),
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Registrar transações
  IF use_from_trial > 0 THEN
    INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description)
    VALUES (p_user_id, 'trial_usage', -use_from_trial::integer, CONCAT(p_description, ' (tokens de teste)'));
  END IF;
  IF use_from_plan > 0 THEN
    INSERT INTO public.credit_transactions (user_id, transaction_type, amount, description)
    VALUES (p_user_id, 'usage', -use_from_plan::integer, CONCAT(p_description, ' (tokens do plano)'));
  END IF;

  RETURN TRUE;
END;
$$;