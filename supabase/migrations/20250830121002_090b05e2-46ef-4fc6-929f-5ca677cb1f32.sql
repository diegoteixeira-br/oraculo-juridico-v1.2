-- Fix the has_document_access function by dropping and recreating
DROP FUNCTION IF EXISTS public.has_document_access(uuid, uuid);

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