-- Security fixes: Add proper search_path to all functions that need it

-- Fix update_blog_posts_updated_at function
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix update_blog_settings_updated_at function
CREATE OR REPLACE FUNCTION public.update_blog_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_emails a
    WHERE lower(a.email) = lower(v_email)
  );
END;
$function$;

-- Fix update_subscription_activation function
CREATE OR REPLACE FUNCTION public.update_subscription_activation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se for uma transação de compra e o usuário ainda não tem data de ativação
  IF NEW.transaction_type = 'purchase' THEN
    UPDATE public.profiles 
    SET subscription_activated_at = COALESCE(subscription_activated_at, NEW.created_at)
    WHERE user_id = NEW.user_id AND subscription_activated_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix use_credits function
CREATE OR REPLACE FUNCTION public.use_credits(p_user_id uuid, p_credits numeric, p_description text DEFAULT 'Uso de créditos na consulta'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_credits DECIMAL;
  current_daily_credits DECIMAL;
  credits_to_use_from_daily DECIMAL;
  credits_to_use_from_purchased DECIMAL;
BEGIN
  -- Resetar créditos diários se necessário
  PERFORM public.reset_daily_credits_if_needed(p_user_id);
  
  -- Buscar créditos atuais
  SELECT credits, daily_credits INTO current_credits, current_daily_credits
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL OR current_daily_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se tem créditos suficientes (diários + comprados)
  IF (current_daily_credits + current_credits) < p_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Usar créditos diários primeiro
  credits_to_use_from_daily := LEAST(p_credits, current_daily_credits);
  credits_to_use_from_purchased := p_credits - credits_to_use_from_daily;
  
  -- Atualizar créditos
  UPDATE public.profiles 
  SET 
    daily_credits = daily_credits - credits_to_use_from_daily,
    credits = credits - credits_to_use_from_purchased,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação (separar diários dos comprados se ambos foram usados)
  IF credits_to_use_from_daily > 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'daily_usage', 
      -credits_to_use_from_daily, 
      CONCAT(p_description, ' (créditos diários)')
    );
  END IF;
  
  IF credits_to_use_from_purchased > 0 THEN
    INSERT INTO public.credit_transactions (
      user_id, 
      transaction_type, 
      amount, 
      description
    ) VALUES (
      p_user_id, 
      'usage', 
      -credits_to_use_from_purchased, 
      CONCAT(p_description, ' (créditos comprados)')
    );
  END IF;
  
  RETURN TRUE;
END;
$function$;

-- Fix add_credits_to_user function
CREATE OR REPLACE FUNCTION public.add_credits_to_user(p_user_id uuid, p_credits numeric, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de créditos'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Atualizar os créditos do usuário
  UPDATE public.profiles 
  SET 
    credits = credits + p_credits,
    total_credits_purchased = total_credits_purchased + p_credits::integer,
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
    p_credits::integer, 
    p_description, 
    p_transaction_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

-- Fix other critical functions with search path
CREATE OR REPLACE FUNCTION public.enforce_free_plan_commitment_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_plan_type TEXT;
  v_pending_count INTEGER;
BEGIN
  -- Buscar o tipo de plano do usuário
  SELECT plan_type INTO v_plan_type
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  -- Só aplicar limites para plano gratuito
  -- Planos pagos (Essencial, Premium, etc.) não têm limite
  IF COALESCE(v_plan_type, 'gratuito') = 'gratuito' THEN
    IF TG_OP = 'INSERT' THEN
      IF COALESCE(NEW.status, 'pendente') = 'pendente' THEN
        SELECT COUNT(*) INTO v_pending_count
        FROM public.legal_commitments
        WHERE user_id = NEW.user_id AND status = 'pendente';
        IF v_pending_count >= 5 THEN
          RAISE EXCEPTION 'Limite do plano gratuito: máximo de 5 compromissos pendentes simultâneos';
        END IF;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF COALESCE(NEW.status, 'pendente') = 'pendente' THEN
        SELECT COUNT(*) INTO v_pending_count
        FROM public.legal_commitments
        WHERE user_id = NEW.user_id AND status = 'pendente' AND id <> NEW.id;
        IF v_pending_count >= 5 THEN
          RAISE EXCEPTION 'Limite do plano gratuito: máximo de 5 compromissos pendentes simultâneos';
        END IF;
      END IF;
    END IF;
  END IF;
  -- Para planos pagos (Essencial, Premium, etc.), não aplicar limites

  RETURN NEW;
END;
$function$;

-- Fix remaining functions that need search path
CREATE OR REPLACE FUNCTION public.increment_ad_views(ad_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.custom_ads 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.custom_ads 
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_daily_credits_if_needed(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;