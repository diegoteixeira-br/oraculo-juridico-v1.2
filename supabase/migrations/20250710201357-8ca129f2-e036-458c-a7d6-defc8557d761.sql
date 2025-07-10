-- Adicionar novos status de subscription para o fluxo de pagamento
-- Atualizar a constraint para incluir os novos status

-- Primeiro, remover a constraint existente se existir
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

-- Adicionar nova constraint com os status incluindo 'pending_activation'
ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check 
CHECK (subscription_status IN ('trial', 'active', 'expired', 'pending_activation', 'cancelled'));

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.subscription_status IS 'Status da assinatura: trial (período gratuito), pending_activation (aguardando ativação após pagamento), active (ativo), expired (expirado), cancelled (cancelado)';