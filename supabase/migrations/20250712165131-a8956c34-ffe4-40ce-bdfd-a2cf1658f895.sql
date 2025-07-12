-- Verificar e corrigir a constraint de transaction_type na tabela credit_transactions
-- Primeiro, vamos remover a constraint existente se ela existir
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;

-- Agora vamos criar uma nova constraint que inclui todos os tipos necessários
ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_transaction_type_check 
CHECK (transaction_type IN ('purchase', 'usage', 'daily_usage'));