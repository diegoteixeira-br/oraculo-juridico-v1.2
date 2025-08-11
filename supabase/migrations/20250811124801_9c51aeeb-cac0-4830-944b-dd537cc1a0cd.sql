-- Enable required extensions
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Unschedule existing job if present (ignore errors if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('daily-agenda-summary-0800-brt');
EXCEPTION
  WHEN OTHERS THEN
    -- do nothing if job does not exist or function signature differs
    NULL;
END;
$$;

-- Schedule the daily invocation at 11:00 UTC (08:00 America/Sao_Paulo)
select
  cron.schedule(
    'daily-agenda-summary-0800-brt',
    '0 11 * * *',
    $$
    select
      net.http_post(
        url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}'::jsonb,
        body := jsonb_build_object('time', now(), 'source', 'pg_cron')
      ) as request_id;
    $$
  );