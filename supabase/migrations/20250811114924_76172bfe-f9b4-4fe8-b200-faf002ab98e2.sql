-- Admin control and secure RLS for legal_documents

-- 1) Admin whitelist table
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.admin_emails IS 'Whitelisted admin emails with elevated permissions';

-- 2) Helper functions to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT public.is_admin(auth.uid());
$$;

-- 3) Seed provided admin email
INSERT INTO public.admin_emails(email)
VALUES ('nao-responda@oraculojuridico.com.br')
ON CONFLICT (email) DO NOTHING;

-- 4) Secure RLS for legal_documents (drop insecure open policies and add admin-only CRUD)
DROP POLICY IF EXISTS "Allow insert for admin operations" ON public.legal_documents;
DROP POLICY IF EXISTS "Allow update for admin operations" ON public.legal_documents;
DROP POLICY IF EXISTS "Allow delete for admin operations" ON public.legal_documents;

-- Admin CRUD policies
CREATE POLICY "Admins can insert legal documents"
ON public.legal_documents
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update legal documents"
ON public.legal_documents
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete legal documents"
ON public.legal_documents
FOR DELETE
TO authenticated
USING (public.is_current_user_admin());

-- Allow admins to view all documents (including inactive)
CREATE POLICY "Admins can view all legal documents"
ON public.legal_documents
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());
