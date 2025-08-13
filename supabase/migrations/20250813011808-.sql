-- Function to zero free trial tokens after trial ends
CREATE OR REPLACE FUNCTION public.reset_trial_tokens_if_expired(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_trial_end TIMESTAMPTZ;
  v_status TEXT;
  v_token_balance BIGINT;
BEGIN
  SELECT trial_end_date, subscription_status, token_balance
  INTO v_trial_end, v_status, v_token_balance
  FROM public.profiles
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RETURN FALSE;
  END IF;

  IF COALESCE(v_status, 'trial') = 'trial' AND v_trial_end IS NOT NULL AND now() >= v_trial_end AND COALESCE(v_token_balance,0) > 0 THEN
    UPDATE public.profiles
    SET 
      token_balance = 0,
      tokens = GREATEST(0, COALESCE(plan_tokens,0)),
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;