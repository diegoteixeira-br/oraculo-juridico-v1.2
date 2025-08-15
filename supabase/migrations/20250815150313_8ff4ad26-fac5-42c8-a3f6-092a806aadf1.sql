-- Criar bucket para logos de email
INSERT INTO storage.buckets (id, name, public) 
VALUES ('email-logos', 'email-logos', true);

-- Política para admins fazerem upload de logos
CREATE POLICY "Admins can upload email logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'email-logos' 
  AND public.is_current_user_admin()
);

-- Política para todos verem as logos (público)
CREATE POLICY "Email logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'email-logos');