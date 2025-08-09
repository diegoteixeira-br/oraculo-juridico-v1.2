-- Enforce free plan limit of 5 simultaneous pending commitments
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
  -- Obtain user plan type (default to 'gratuito' if not found)
  SELECT plan_type INTO v_plan_type
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

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

  RETURN NEW;
END;
$$;

-- Attach trigger to legal_commitments table
DROP TRIGGER IF EXISTS trg_enforce_free_plan_commitment_limit ON public.legal_commitments;
CREATE TRIGGER trg_enforce_free_plan_commitment_limit
BEFORE INSERT OR UPDATE ON public.legal_commitments
FOR EACH ROW EXECUTE FUNCTION public.enforce_free_plan_commitment_limit();