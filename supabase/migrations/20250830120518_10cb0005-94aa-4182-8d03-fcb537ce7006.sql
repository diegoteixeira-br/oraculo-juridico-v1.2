-- Final security fixes: Complete remaining functions with search_path

-- Fix the remaining 10 functions that need search_path
CREATE OR REPLACE FUNCTION public.check_and_block_expired_trials()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Bloquear usuários cujo trial expirou e não têm cartão cadastrado
  UPDATE public.profiles 
  SET is_active = false,
      updated_at = now()
  WHERE subscription_status = 'trial'
    AND trial_end_date IS NOT NULL 
    AND trial_end_date < now()
    AND is_active = true;
    
  -- Log da operação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description
  ) 
  SELECT 
    user_id,
    'account_blocked',
    0,
    'Conta bloqueada automaticamente - trial expirado sem cartão cadastrado'
  FROM public.profiles
  WHERE subscription_status = 'trial'
    AND trial_end_date IS NOT NULL 
    AND trial_end_date < now()
    AND is_active = false
    AND updated_at >= now() - interval '1 minute'; -- Apenas os recém bloqueados
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_trial_status_on_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se o trial expirou, bloquear a conta
  IF NEW.subscription_status = 'trial' 
     AND NEW.trial_end_date IS NOT NULL 
     AND NEW.trial_end_date < now() 
     AND NEW.is_active = true THEN
    NEW.is_active = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_tokens_to_user(p_user_id uuid, p_tokens bigint, p_plan_type text, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de tokens'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_feature_usage(p_user_id uuid, p_feature_name text, p_feature_data jsonb DEFAULT '{}'::jsonb, p_tokens_consumed integer DEFAULT 0)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.feature_usage (
    user_id,
    feature_name,
    feature_data,
    tokens_consumed
  ) VALUES (
    p_user_id,
    p_feature_name,
    p_feature_data,
    p_tokens_consumed
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_and_expire_tokens(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_expiry_date TIMESTAMPTZ;
  v_plan_type TEXT;
  v_plan_tokens BIGINT;
  v_now TIMESTAMPTZ := now();
BEGIN
  -- Buscar dados do usuário
  SELECT token_expiry_date, plan_type, plan_tokens
  INTO v_expiry_date, v_plan_type, v_plan_tokens
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
    
    -- Registrar a expiração usando o valor que tínhamos antes do UPDATE
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'expiry',
      -v_plan_tokens::integer,
      'Tokens do plano essencial expiraram (7 dias sem renovação)'
    );
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;