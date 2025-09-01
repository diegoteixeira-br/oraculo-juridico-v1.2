-- Criar função para auto-publicação de posts agendados
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_posts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  published_count INTEGER := 0;
  post_record RECORD;
BEGIN
  -- Buscar posts agendados que devem ser publicados agora
  FOR post_record IN 
    SELECT id, title, scheduled_for
    FROM public.blog_posts
    WHERE is_published = false
      AND scheduled_for IS NOT NULL
      AND scheduled_for <= now()
      AND status = 'agendado'
  LOOP
    -- Publicar o post
    UPDATE public.blog_posts 
    SET 
      is_published = true,
      status = 'publicado',
      updated_at = now()
    WHERE id = post_record.id;
    
    published_count := published_count + 1;
    
    -- Log da publicação
    RAISE LOG 'Post auto-publicado: % (ID: %)', post_record.title, post_record.id;
  END LOOP;
  
  RETURN published_count;
END;
$$;