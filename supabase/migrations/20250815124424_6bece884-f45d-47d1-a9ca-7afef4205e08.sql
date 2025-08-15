-- Limpar todos os cron jobs de agenda existentes e criar um novo sistema mais eficiente
DO $$
DECLARE
    job_record RECORD;
    job_created boolean := false;
BEGIN
    -- Remover todos os jobs de agenda existentes
    FOR job_record IN 
        SELECT jobname FROM cron.job WHERE jobname LIKE 'daily-agenda-%' OR jobname = 'hourly-agenda-check'
    LOOP
        BEGIN
            PERFORM cron.unschedule(job_record.jobname);
            RAISE NOTICE 'Removido job: %', job_record.jobname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Falha ao remover job: %, erro: %', job_record.jobname, SQLERRM;
        END;
    END LOOP;
    
    -- Criar um único job que roda a cada hora
    BEGIN
        PERFORM cron.schedule(
            'hourly-agenda-check',
            '0 * * * *',
            $job$
            SELECT net.http_post(
                url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}'::jsonb,
                body := '{"source": "pg_cron_hourly"}'::jsonb
            );
            $job$
        );
        job_created := true;
        RAISE NOTICE 'Criado novo job hourly-agenda-check que roda a cada hora';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Falha ao criar job: %', SQLERRM;
    END;
    
    IF NOT job_created THEN
        RAISE EXCEPTION 'Falha ao criar o cron job necessário';
    END IF;
END $$;