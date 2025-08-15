-- Função para executar SQL customizado (necessária para gerenciamento de cron jobs)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS TABLE(result text)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Garantir que as extensões necessárias estão ativas
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;