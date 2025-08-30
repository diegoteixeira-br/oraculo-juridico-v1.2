-- Adicionar campos para agendamento de publicação
ALTER TABLE public.blog_posts 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_publish BOOLEAN DEFAULT false;

-- Atualizar a política para considerar artigos agendados
DROP POLICY IF EXISTS "Everyone can read published posts" ON public.blog_posts;

CREATE POLICY "Everyone can read published posts" 
ON public.blog_posts 
FOR SELECT 
USING (
  is_published = true 
  AND (
    published_at IS NULL 
    OR published_at <= now()
  )
);

-- Criar edge function para auto-publicação (será executada via cron)
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Publicar posts que estão agendados e chegaram na hora
  UPDATE public.blog_posts 
  SET 
    is_published = true,
    published_at = now(),
    updated_at = now()
  WHERE 
    auto_publish = true 
    AND scheduled_for IS NOT NULL 
    AND scheduled_for <= now() 
    AND is_published = false;
    
  -- Log dos posts publicados
  INSERT INTO public.credit_transactions (
    user_id, 
    transaction_type, 
    amount, 
    description
  ) 
  SELECT 
    '00000000-0000-0000-0000-000000000000'::uuid, -- Sistema
    'system_log',
    0,
    'Auto-publicação executada - ' || (SELECT COUNT(*) FROM public.blog_posts WHERE auto_publish = true AND scheduled_for <= now() AND is_published = true AND updated_at >= now() - interval '1 minute') || ' posts publicados'
  WHERE EXISTS (
    SELECT 1 FROM public.blog_posts 
    WHERE auto_publish = true 
    AND scheduled_for <= now() 
    AND is_published = true 
    AND updated_at >= now() - interval '1 minute'
  );
END;
$$;