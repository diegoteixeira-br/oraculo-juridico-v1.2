-- Limpar todos os cron jobs de agenda existentes e criar um novo sistema mais eficiente
DO $$
DECLARE
    job_record RECORD;
BEGIN
    -- Remover todos os jobs de agenda existentes
    FOR job_record IN 
        SELECT jobname FROM cron.job WHERE jobname LIKE 'daily-agenda-%'
    LOOP
        PERFORM cron.unschedule(job_record.jobname);
        RAISE NOTICE 'Removido job: %', job_record.jobname;
    END LOOP;
    
    -- Criar um único job que roda a cada hora
    PERFORM cron.schedule(
        'hourly-agenda-check',
        '0 * * * *', -- A cada hora no minuto 0
        $$
        SELECT net.http_post(
            url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}'::jsonb,
            body := '{"source": "pg_cron_hourly"}'::jsonb
        ) as request_id;
        $$
    );
    
    RAISE NOTICE 'Criado novo job hourly-agenda-check que roda a cada hora';
END $$;