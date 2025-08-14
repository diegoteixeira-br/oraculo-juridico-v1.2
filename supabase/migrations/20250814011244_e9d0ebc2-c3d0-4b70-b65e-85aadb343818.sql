-- Atualizar a constraint de transaction_type para incluir tipos administrativos
ALTER TABLE public.credit_transactions 
DROP CONSTRAINT credit_transactions_transaction_type_check;

ALTER TABLE public.credit_transactions 
ADD CONSTRAINT credit_transactions_transaction_type_check 
CHECK (transaction_type = ANY (ARRAY[
  'purchase'::text, 
  'usage'::text, 
  'daily_usage'::text,
  'trial_usage'::text,
  'subscription'::text,
  'renewal'::text,
  'refund'::text,
  'expiry'::text,
  'token_purchase'::text,
  'admin_addition'::text,
  'admin_removal'::text,
  'admin_action'::text
]));