-- Função para processar reembolsos
CREATE OR REPLACE FUNCTION public.process_refund(
  p_user_id uuid, 
  p_refunded_credits integer, 
  p_transaction_id text DEFAULT NULL,
  p_description text DEFAULT 'Reembolso de créditos'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;