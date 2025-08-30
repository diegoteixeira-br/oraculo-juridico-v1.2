-- Complete security fixes: Add search_path to remaining functions

-- Fix remaining functions that need search path
CREATE OR REPLACE FUNCTION public.renew_monthly_subscription(p_user_id uuid, p_tokens bigint, p_transaction_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Renovar assinatura mensal - não muda a data de ativação original
  UPDATE public.profiles 
  SET 
    plan_tokens = COALESCE(plan_tokens,0) + p_tokens,
    tokens = COALESCE(token_balance,0) + COALESCE(plan_tokens,0) + p_tokens,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação de renovação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    stripe_session_id
  ) VALUES (
    p_user_id, 
    'renewal', 
    p_tokens::integer, 
    'Renovação mensal da assinatura', 
    p_transaction_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_legal_documents_updated_at()
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

CREATE OR REPLACE FUNCTION public.process_refund(p_user_id uuid, p_refunded_credits integer, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Reembolso de créditos'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_purchased_credits INTEGER;
BEGIN
  -- Buscar créditos comprados atuais do usuário
  SELECT credits INTO current_purchased_credits
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF current_purchased_credits IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Remover apenas os créditos comprados (não mexe nos créditos diários)
  -- Se o usuário tem menos créditos comprados que o valor do reembolso, remove só o que tem
  UPDATE public.profiles 
  SET 
    credits = GREATEST(0, credits - p_refunded_credits),
    total_credits_purchased = GREATEST(0, total_credits_purchased - p_refunded_credits),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação de reembolso
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    cakto_transaction_id,
    status
  ) VALUES (
    p_user_id, 
    'refund', 
    -p_refunded_credits, 
    p_description, 
    p_transaction_id,
    'completed'
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
 RETURNS TABLE(result text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Esta função permite execução de SQL customizado
  -- Usado especificamente para gerenciamento de cron jobs
  RETURN QUERY EXECUTE sql;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retorna a mensagem de erro
    RETURN QUERY SELECT SQLERRM;
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_tokens_to_user_v2(p_user_id uuid, p_product_type_id uuid, p_stripe_session_id text DEFAULT NULL::text, p_payment_intent_id text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product_type RECORD;
  v_purchase_id UUID;
BEGIN
  -- Buscar informações do tipo de produto
  SELECT * INTO v_product_type
  FROM public.product_types
  WHERE id = p_product_type_id AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tipo de produto não encontrado ou inativo';
  END IF;
  
  -- Registrar a compra
  INSERT INTO public.purchases (
    user_id,
    product_type_id,
    stripe_session_id,
    stripe_payment_intent_id,
    amount_cents,
    currency,
    tokens_granted,
    status,
    completed_at
  ) VALUES (
    p_user_id,
    p_product_type_id,
    p_stripe_session_id,
    p_payment_intent_id,
    v_product_type.price_cents,
    v_product_type.price_currency,
    v_product_type.tokens_included,
    'completed',
    now()
  ) RETURNING id INTO v_purchase_id;
  
  -- Atualizar profile baseado no tipo de produto
  IF v_product_type.category = 'subscription' THEN
    -- É uma assinatura
    UPDATE public.profiles 
    SET 
      plan_tokens = COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      plan_type = v_product_type.name,
      tokens = COALESCE(token_balance, 0) + COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      subscription_status = 'active',
      subscription_activated_at = COALESCE(subscription_activated_at, now()),
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    -- É compra de tokens avulsa
    UPDATE public.profiles 
    SET 
      plan_tokens = COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      tokens = COALESCE(token_balance, 0) + COALESCE(plan_tokens, 0) + v_product_type.tokens_included,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  -- Registrar na tabela de transações (para compatibilidade)
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description, 
    stripe_session_id
  ) VALUES (
    p_user_id, 
    CASE 
      WHEN v_product_type.category = 'subscription' THEN 'subscription'
      ELSE 'token_purchase'
    END,
    v_product_type.tokens_included::integer, 
    CONCAT('Compra: ', v_product_type.name, ' - ', v_product_type.description), 
    p_stripe_session_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;