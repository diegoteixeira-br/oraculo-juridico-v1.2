-- Corrigir a função exec_sql com security definer adequado
DROP FUNCTION IF EXISTS public.exec_sql(text);

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS TABLE(result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Esta função permite execução de SQL customizado
  -- Usado especificamente para gerenciamento de cron jobs
  RETURN QUERY EXECUTE sql;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retorna a mensagem de erro
    RETURN QUERY SELECT SQLERRM;
END;
$function$;