-- Corrigir a função que verifica limites do plano para reconhecer o plano Essencial
CREATE OR REPLACE FUNCTION public.enforce_free_plan_commitment_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan_type TEXT;
  v_pending_count INTEGER;
BEGIN
  -- Buscar o tipo de plano do usuário
  SELECT plan_type INTO v_plan_type
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  -- Só aplicar limites para plano gratuito
  -- Planos pagos (Essencial, Premium, etc.) não têm limite
  IF COALESCE(v_plan_type, 'gratuito') = 'gratuito' THEN
    IF TG_OP = 'INSERT' THEN
      IF COALESCE(NEW.status, 'pendente') = 'pendente' THEN
        SELECT COUNT(*) INTO v_pending_count
        FROM public.legal_commitments
        WHERE user_id = NEW.user_id AND status = 'pendente';
        IF v_pending_count >= 5 THEN
          RAISE EXCEPTION 'Limite do plano gratuito: máximo de 5 compromissos pendentes simultâneos';
        END IF;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF COALESCE(NEW.status, 'pendente') = 'pendente' THEN
        SELECT COUNT(*) INTO v_pending_count
        FROM public.legal_commitments
        WHERE user_id = NEW.user_id AND status = 'pendente' AND id <> NEW.id;
        IF v_pending_count >= 5 THEN
          RAISE EXCEPTION 'Limite do plano gratuito: máximo de 5 compromissos pendentes simultâneos';
        END IF;
      END IF;
    END IF;
  END IF;
  -- Para planos pagos (Essencial, Premium, etc.), não aplicar limites

  RETURN NEW;
END;
$$;