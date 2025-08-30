-- Final batch of functions that need search_path fix
CREATE OR REPLACE FUNCTION public.validate_profile_uniqueness()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Verificar se CPF já existe (apenas se não for nulo)
  IF NEW.cpf IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE cpf = NEW.cpf AND user_id != NEW.user_id
    ) THEN
      RAISE EXCEPTION 'CPF já cadastrado em outra conta';
    END IF;
  END IF;
  
  -- Verificar se user_id já tem profile
  IF TG_OP = 'INSERT' THEN
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Usuário já possui um perfil cadastrado';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_post_vote_counts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Recalcular contadores para o post afetado
  UPDATE public.blog_posts 
  SET 
    likes_count = (
      SELECT COUNT(*) FROM public.blog_post_votes 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND vote_type = 'like'
    ),
    dislikes_count = (
      SELECT COUNT(*) FROM public.blog_post_votes 
      WHERE post_id = COALESCE(NEW.post_id, OLD.post_id) AND vote_type = 'dislike'
    )
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_sensitive_access(accessed_user uuid, access_type text, fields text[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profile_access_logs (
    accessed_user_id,
    accessor_user_id,
    access_type,
    accessed_fields
  ) VALUES (
    accessed_user,
    auth.uid(),
    access_type,
    fields
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.use_tokens(p_user_id uuid, p_tokens bigint, p_description text DEFAULT 'Uso de tokens na consulta'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;