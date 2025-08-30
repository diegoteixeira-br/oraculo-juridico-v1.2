-- Final security fix: Complete the last remaining functions with search_path
CREATE OR REPLACE FUNCTION public.get_admin_user_list()
 RETURNS TABLE(user_id uuid, masked_full_name text, masked_cpf text, plan_type text, subscription_status text, tokens bigint, is_active boolean, created_at timestamp with time zone, subscription_activated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log the access
  PERFORM log_sensitive_access(NULL, 'ADMIN_USER_LIST', ARRAY['full_name', 'cpf']);
  
  RETURN QUERY
  SELECT 
    p.user_id,
    CASE 
      WHEN p.full_name IS NOT NULL THEN 
        CONCAT(SUBSTRING(p.full_name FROM 1 FOR 2), '****', SUBSTRING(p.full_name FROM LENGTH(p.full_name)-1))
      ELSE NULL 
    END AS masked_full_name,
    CASE 
      WHEN p.cpf IS NOT NULL THEN 
        CONCAT(SUBSTRING(p.cpf FROM 1 FOR 3), '.***.***-', SUBSTRING(p.cpf FROM LENGTH(p.cpf)-1))
      ELSE NULL 
    END AS masked_cpf,
    p.plan_type,
    p.subscription_status,
    p.tokens,
    p.is_active,
    p.created_at,
    p.subscription_activated_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$function$;

-- Add missing search_path to the secure update profile function
CREATE OR REPLACE FUNCTION public.secure_update_profile(profile_user_id uuid, new_full_name text DEFAULT NULL::text, new_cpf text DEFAULT NULL::text, new_timezone text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- Add function that needs search_path fixed
CREATE OR REPLACE FUNCTION public.has_document_access(document_id uuid, user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user has direct access to the document
  RETURN EXISTS (
    SELECT 1 FROM public.document_shares ds
    WHERE ds.document_id = has_document_access.document_id
    AND (
      ds.target_user_id = has_document_access.user_id
      OR ds.target_group_id IN (
        SELECT group_id FROM public.user_group_members
        WHERE user_id = has_document_access.user_id
      )
    )
  );
END;
$function$;