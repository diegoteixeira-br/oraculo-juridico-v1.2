-- Remover o cron job atual
SELECT cron.unschedule('hourly-agenda-check');

-- Criar novo cron job que roda a cada 3 minutos
SELECT cron.schedule(
  'frequent-agenda-check',
  '*/3 * * * *', -- a cada 3 minutos
  $$
  SELECT net.http_post(
    url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}'::jsonb,
    body := '{"source": "pg_cron_frequent"}'::jsonb
  ) as request_id;
  $$
);