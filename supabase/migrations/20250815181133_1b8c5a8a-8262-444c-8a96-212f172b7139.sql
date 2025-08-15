-- Criar função para verificar e bloquear contas com trial expirado
CREATE OR REPLACE FUNCTION public.check_and_block_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Bloquear usuários cujo trial expirou e não têm cartão cadastrado
  UPDATE public.profiles 
  SET is_active = false,
      updated_at = now()
  WHERE subscription_status = 'trial'
    AND trial_end_date IS NOT NULL 
    AND trial_end_date < now()
    AND is_active = true;
    
  -- Log da operação
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description
  ) 
  SELECT 
    user_id,
    'account_blocked',
    0,
    'Conta bloqueada automaticamente - trial expirado sem cartão cadastrado'
  FROM public.profiles
  WHERE subscription_status = 'trial'
    AND trial_end_date IS NOT NULL 
    AND trial_end_date < now()
    AND is_active = false
    AND updated_at >= now() - interval '1 minute'; -- Apenas os recém bloqueados
END;
$$;

-- Criar função para verificar status de trial na autenticação
CREATE OR REPLACE FUNCTION public.check_trial_status_on_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o trial expirou, bloquear a conta
  IF NEW.subscription_status = 'trial' 
     AND NEW.trial_end_date IS NOT NULL 
     AND NEW.trial_end_date < now() 
     AND NEW.is_active = true THEN
    NEW.is_active = false;
  END IF;
  
  RETURN NEW;
END;
$$;