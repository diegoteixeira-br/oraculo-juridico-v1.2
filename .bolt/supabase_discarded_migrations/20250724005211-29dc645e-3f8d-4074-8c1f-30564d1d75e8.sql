-- Adicionar constraint única para evitar transações duplicadas
-- Primeiro, vamos limpar as transações duplicadas mantendo apenas a mais antiga
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY cakto_transaction_id, user_id 
           ORDER BY created_at ASC
         ) as rn
  FROM public.credit_transactions 
  WHERE cakto_transaction_id IS NOT NULL
)
DELETE FROM public.credit_transactions 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora adicionar a constraint única para prevenir futuras duplicatas
ALTER TABLE public.credit_transactions 
ADD CONSTRAINT unique_cakto_transaction_user 
UNIQUE (cakto_transaction_id, user_id);

-- Também vamos corrigir os tokens do usuário subtraindo as duplicatas
UPDATE public.profiles 
SET 
  tokens = tokens - 300000,  -- Remove 2 transações duplicadas de 150000 cada
  plan_tokens = 150000,      -- Manter apenas 1 compra
  updated_at = now()
WHERE user_id = '59ebeb88-35a2-43c5-879f-1dcb49fbffa0';