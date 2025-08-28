-- Security enhancement for profiles table - Fixed version

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

-- Service role can insert logs
CREATE POLICY "Service role can insert access logs"
ON public.profile_access_logs
FOR INSERT
WITH CHECK (true);

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

-- Create a secure function for getting masked admin user data
CREATE OR REPLACE FUNCTION get_admin_user_list()
RETURNS TABLE(
  user_id uuid,
  masked_full_name text,
  masked_cpf text,
  plan_type text,
  subscription_status text,
  tokens bigint,
  is_active boolean,
  created_at timestamptz,
  subscription_activated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this function
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  -- Log admin access
  PERFORM log_sensitive_access(
    NULL, -- No specific user, it's a bulk operation
    'ADMIN_LIST',
    ARRAY['masked_full_name', 'masked_cpf']
  );

  RETURN QUERY
  SELECT 
    p.user_id,
    CASE 
      WHEN p.full_name IS NOT NULL THEN LEFT(p.full_name, 1) || '***'
      ELSE NULL 
    END AS masked_full_name,
    CASE 
      WHEN p.cpf IS NOT NULL THEN '***.' || RIGHT(p.cpf, 3)
      ELSE NULL 
    END AS masked_cpf,
    p.plan_type,
    p.subscription_status,
    p.tokens,
    p.is_active,
    p.created_at,
    p.subscription_activated_at
  FROM public.profiles p;
END;
$$;

-- Create additional RLS policies for more granular access control
CREATE POLICY "Users cannot access sensitive fields of others"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR is_current_user_admin()
);

-- Update existing policies to be more restrictive for updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update non-sensitive fields"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());