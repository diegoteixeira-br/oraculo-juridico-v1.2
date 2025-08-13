-- Corrigir função update_subscription_activation com search_path seguro
CREATE OR REPLACE FUNCTION public.update_subscription_activation()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for uma transação de compra e o usuário ainda não tem data de ativação
  IF NEW.transaction_type = 'purchase' THEN
    UPDATE public.profiles 
    SET subscription_activated_at = COALESCE(subscription_activated_at, NEW.created_at)
    WHERE user_id = NEW.user_id AND subscription_activated_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';