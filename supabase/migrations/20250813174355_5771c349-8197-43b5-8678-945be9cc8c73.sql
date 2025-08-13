-- Criar trigger para atualizar automaticamente a data de ativação
CREATE TRIGGER update_subscription_activation_trigger
AFTER INSERT ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_activation();

-- Atualizar registros existentes com a data do primeiro pagamento
UPDATE public.profiles 
SET subscription_activated_at = (
  SELECT MIN(created_at) 
  FROM public.credit_transactions 
  WHERE credit_transactions.user_id = profiles.user_id 
  AND transaction_type = 'purchase'
)
WHERE subscription_activated_at IS NULL 
AND EXISTS (
  SELECT 1 FROM public.credit_transactions 
  WHERE credit_transactions.user_id = profiles.user_id 
  AND transaction_type = 'purchase'
);