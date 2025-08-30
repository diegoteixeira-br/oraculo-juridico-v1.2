-- Criar cron job para auto-publicação de posts (executa a cada 5 minutos)
SELECT cron.schedule(
  'auto-publish-blog-posts',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/auto-publish-posts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}'::jsonb,
    body := '{"source": "cron_job"}'::jsonb
  );
  $$
);