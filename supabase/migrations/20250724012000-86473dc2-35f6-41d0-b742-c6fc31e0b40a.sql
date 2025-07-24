-- Adicionar tokens do plano básico comprado manualmente
UPDATE public.profiles 
SET 
  tokens = 75000,
  plan_tokens = 75000,
  plan_type = 'basico',
  updated_at = now()
WHERE user_id = 'cbdef654-7370-4780-a7b1-ea742a7671cc';

-- Registrar a transação de compra
INSERT INTO public.credit_transactions (
  user_id, 
  transaction_type, 
  amount, 
  description, 
  cakto_transaction_id,
  status
) VALUES (
  'cbdef654-7370-4780-a7b1-ea742a7671cc', 
  'purchase', 
  75000, 
  'Compra Plano Básico - Correção manual', 
  'manual_correction_basic_plan',
  'completed'
);