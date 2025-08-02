-- Atualizar a função add_credits_to_user para trabalhar com valores decimais
CREATE OR REPLACE FUNCTION public.add_credits_to_user(p_user_id uuid, p_credits decimal, p_transaction_id text DEFAULT NULL::text, p_description text DEFAULT 'Compra de créditos'::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;