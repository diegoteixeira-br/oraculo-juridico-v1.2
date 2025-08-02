-- Adicionar colunas de créditos ao profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_credits_purchased INTEGER DEFAULT 0;

-- Criar tabela para controlar transações de créditos
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'bonus')),
  amount INTEGER NOT NULL,
  description TEXT,
  cakto_transaction_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS na tabela de transações
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para visualizar próprias transações
CREATE POLICY "Users can view their own credit transactions" 
ON public.credit_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para edge functions inserirem transações
CREATE POLICY "Service role can insert credit transactions" 
ON public.credit_transactions 
FOR INSERT 
WITH CHECK (true);

-- Política para edge functions atualizarem transações
CREATE POLICY "Service role can update credit transactions" 
ON public.credit_transactions 
FOR UPDATE 
USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE TRIGGER update_credit_transactions_updated_at
BEFORE UPDATE ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para adicionar créditos
CREATE OR REPLACE FUNCTION public.add_credits_to_user(
  p_user_id UUID,
  p_credits INTEGER,
  p_transaction_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT 'Compra de créditos'
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar os créditos do usuário
  UPDATE public.profiles 
  SET 
    credits = credits + p_credits,
    total_credits_purchased = total_credits_purchased + p_credits,
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
    p_credits, 
    p_description, 
    p_transaction_id
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Criar função para usar créditos
CREATE OR REPLACE FUNCTION public.use_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_description TEXT DEFAULT 'Uso de créditos na consulta'
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Verificar se o usuário tem créditos suficientes
  SELECT credits INTO current_credits 
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  IF current_credits IS NULL OR current_credits < p_credits THEN
    RETURN FALSE;
  END IF;
  
  -- Usar os créditos
  UPDATE public.profiles 
  SET 
    credits = credits - p_credits,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Registrar a transação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description
  ) VALUES (
    p_user_id, 
    'usage', 
    -p_credits, 
    p_description
  );
  
  RETURN TRUE;
END;
$$;