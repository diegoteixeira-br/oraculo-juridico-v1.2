-- Corrigir funções com search_path mutable (problemas de segurança)
-- Atualizar função is_admin para ter search_path seguro
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_emails a
    WHERE lower(a.email) = lower(v_email)
  );
END;
$function$;

-- Atualizar função is_current_user_admin para ter search_path seguro
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.is_admin(auth.uid());
$function$;

-- Atualizar função has_document_access para ter search_path seguro
CREATE OR REPLACE FUNCTION public.has_document_access(p_document_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Acesso direto ou via grupo
  RETURN EXISTS (
    SELECT 1 FROM public.document_shares ds
    WHERE ds.document_id = p_document_id AND ds.target_user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.document_shares ds
    JOIN public.user_group_members gm ON gm.group_id = ds.target_group_id
    WHERE ds.document_id = p_document_id AND gm.user_id = p_user_id
  );
END;
$function$;