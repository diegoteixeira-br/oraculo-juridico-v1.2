-- Criar bucket para imagens do blog
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket blog-images
CREATE POLICY "Imagens do blog são públicas" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins podem fazer upload de imagens do blog" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'blog-images' 
  AND is_current_user_admin()
);

CREATE POLICY "Admins podem atualizar imagens do blog" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'blog-images' 
  AND is_current_user_admin()
);

CREATE POLICY "Admins podem deletar imagens do blog" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'blog-images' 
  AND is_current_user_admin()
);