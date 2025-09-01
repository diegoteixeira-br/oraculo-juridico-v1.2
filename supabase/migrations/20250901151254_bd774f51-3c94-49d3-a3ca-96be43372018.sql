-- Primeiro, vamos remover a função existente
DROP FUNCTION IF EXISTS public.auto_publish_scheduled_posts();

-- Agora criar a nova função com o tipo de retorno correto
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
      AND scheduled_for IS NOT NULL
      AND scheduled_for <= now()
      AND status IN ('agendado', 'rascunho')  -- Incluir rascunho também
  LOOP
    -- Publicar o post
    UPDATE public.blog_posts 
    SET 
      is_published = true,
      status = 'publicado',
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