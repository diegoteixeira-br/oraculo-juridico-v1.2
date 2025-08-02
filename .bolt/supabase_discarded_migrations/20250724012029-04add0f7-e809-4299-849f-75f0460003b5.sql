-- Corrigir tokens para o usuário atual que fez a compra
UPDATE public.profiles 
SET 
  tokens = 75000,
  plan_tokens = 75000,
  plan_type = 'basico',
  daily_tokens = 0,
  updated_at = now()
WHERE user_id = 'cbdef654-7370-4780-a7b1-ea742a7671cc';

-- Registrar a transação de compra para o usuário correto
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description, 
  cakto_transaction_id,
  status
) 
SELECT 
  'cbdef654-7370-4780-a7b1-ea742a7671cc', 
  'purchase', 
  75000, 
  'Transferência Plano Básico', 
  'transfer_basic_plan',
  'completed'
WHERE NOT EXISTS (
  SELECT 1 FROM public.credit_transactions 
  WHERE user_id = 'cbdef654-7370-4780-a7b1-ea742a7671cc' 
  AND transaction_type = 'purchase'
);