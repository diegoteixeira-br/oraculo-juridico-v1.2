-- Update admin email and secure admin_emails table with RLS

-- Enable RLS on admin_emails (if not already enabled)
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Policies: only authenticated admins can manage/read this table
DROP POLICY IF EXISTS "Admins can read admin_emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can insert admin_emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can update admin_emails" ON public.admin_emails;
DROP POLICY IF EXISTS "Admins can delete admin_emails" ON public.admin_emails;

CREATE POLICY "Admins can read admin_emails"
ON public.admin_emails
FOR SELECT
TO authenticated
USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert admin_emails"
ON public.admin_emails
FOR INSERT
TO authenticated
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update admin_emails"
ON public.admin_emails
FOR UPDATE
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can delete admin_emails"
ON public.admin_emails
FOR DELETE
TO authenticated
USING (public.is_current_user_admin());

-- Replace old admin email with the new one
DELETE FROM public.admin_emails 
WHERE email = 'nao-responda@oraculojuridico.com.br';

INSERT INTO public.admin_emails(email)
VALUES ('dtsilva84@hotmail.com')
ON CONFLICT (email) DO NOTHING;
