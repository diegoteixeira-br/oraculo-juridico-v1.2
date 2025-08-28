-- Security enhancement for profiles table
-- Create view for safe admin access to profiles (excludes sensitive PII)
CREATE OR REPLACE VIEW admin_profiles_view AS 
SELECT 
  id,
  user_id,
  subscription_status,
  trial_start_date,
  trial_end_date,
  subscription_end_date,
  created_at,
  updated_at,
  tokens,
  plan_tokens,
  plan_type,
  is_active,
  subscription_activated_at,
  last_renewal_date,
  token_expiry_date,
  timezone,
  -- Mask sensitive data for admin view
  CASE 
    WHEN full_name IS NOT NULL THEN LEFT(full_name, 1) || '***'
    ELSE NULL 
  END AS masked_full_name,
  CASE 
    WHEN cpf IS NOT NULL THEN '***.' || RIGHT(cpf, 3)
    ELSE NULL 
  END AS masked_cpf,
  CASE 
    WHEN stripe_customer_id IS NOT NULL THEN 'cus_***'
    ELSE NULL 
  END AS masked_stripe_id
FROM public.profiles;

-- Create RLS policy for admin view
ALTER VIEW admin_profiles_view OWNER TO postgres;
GRANT SELECT ON admin_profiles_view TO authenticated;

-- Create policy for admin view
CREATE POLICY "Admins can view masked profiles"
ON admin_profiles_view
FOR SELECT
USING (is_current_user_admin());

-- Create a secure function for getting user profile summary (excludes PII)
CREATE OR REPLACE FUNCTION get_user_profile_summary(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  plan_type text,
  subscription_status text,
  tokens bigint,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.plan_type,
    p.subscription_status,
    p.tokens,
    p.is_active,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id
  AND (is_current_user_admin() OR auth.uid() = p.user_id);
$$;

-- Add audit logging for sensitive data access
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_user_id uuid NOT NULL,
  accessor_user_id uuid,
  access_type text NOT NULL,
  accessed_fields text[],
  created_at timestamptz DEFAULT now(),
  ip_address inet,
  user_agent text
);

-- Enable RLS on audit logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view access logs"
ON public.profile_access_logs
FOR SELECT
USING (is_current_user_admin());

-- Function to log sensitive data access
CREATE OR REPLACE FUNCTION log_sensitive_access(
  accessed_user uuid,
  access_type text,
  fields text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_access_logs (
    accessed_user_id,
    accessor_user_id,
    access_type,
    accessed_fields
  ) VALUES (
    accessed_user,
    auth.uid(),
    access_type,
    fields
  );
END;
$$;

-- Create trigger to log access to sensitive fields
CREATE OR REPLACE FUNCTION audit_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when sensitive fields are accessed by SELECT
  IF TG_OP = 'SELECT' AND (
    OLD.full_name IS NOT NULL OR 
    OLD.cpf IS NOT NULL OR 
    OLD.stripe_customer_id IS NOT NULL
  ) THEN
    PERFORM log_sensitive_access(
      OLD.user_id,
      'SELECT',
      ARRAY['full_name', 'cpf', 'stripe_customer_id']
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add constraint to ensure CPF format if provided (Brazilian CPF validation)
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_cpf_format 
CHECK (cpf IS NULL OR (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$' OR cpf ~ '^\d{11}$'));

-- Add constraint for stripe customer ID format
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_stripe_customer_id 
CHECK (stripe_customer_id IS NULL OR stripe_customer_id ~ '^cus_[a-zA-Z0-9]+$');

-- Create a secure function for profile updates that validates data
CREATE OR REPLACE FUNCTION secure_update_profile(
  profile_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_cpf text DEFAULT NULL,
  new_timezone text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  -- Only allow users to update their own profile or admins
  IF current_user_id != profile_user_id AND NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Cannot update other user profiles';
  END IF;

  -- Validate CPF format if provided
  IF new_cpf IS NOT NULL AND NOT (new_cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$' OR new_cpf ~ '^\d{11}$') THEN
    RAISE EXCEPTION 'Invalid CPF format';
  END IF;

  -- Log the update
  PERFORM log_sensitive_access(
    profile_user_id,
    'UPDATE',
    ARRAY_REMOVE(ARRAY[
      CASE WHEN new_full_name IS NOT NULL THEN 'full_name' END,
      CASE WHEN new_cpf IS NOT NULL THEN 'cpf' END,
      CASE WHEN new_timezone IS NOT NULL THEN 'timezone' END
    ], NULL)
  );

  -- Perform the update
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(new_full_name, full_name),
    cpf = COALESCE(new_cpf, cpf),
    timezone = COALESCE(new_timezone, timezone),
    updated_at = now()
  WHERE user_id = profile_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;