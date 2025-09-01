-- Corrigir a função de auto-publicação removendo referência à coluna status inexistente
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_posts()
RETURNS VOID
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
      AND auto_publish = true
      AND scheduled_for IS NOT NULL
      AND scheduled_for <= now()
  LOOP
    -- Publicar o post
    UPDATE public.blog_posts 
    SET 
      is_published = true,
      published_at = now(),
      updated_at = now()
    WHERE id = post_record.id;
    
    published_count := published_count + 1;
    
    -- Log da publicação
    RAISE LOG 'Post auto-publicado: % (ID: %), agendado para: %', 
              post_record.title, post_record.id, post_record.scheduled_for;
  END LOOP;
  
  -- Log do resultado
  RAISE LOG 'Auto-publicação finalizada: % posts publicados', published_count;
END;
$$;