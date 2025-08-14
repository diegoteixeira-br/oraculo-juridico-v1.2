-- Função para agendar envio de email da agenda baseado no horário escolhido pelo usuário
CREATE OR REPLACE FUNCTION schedule_daily_agenda_emails()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rec RECORD;
  cron_job_name TEXT;
  cron_schedule TEXT;
  hour_part INTEGER;
  minute_part INTEGER;
BEGIN
  -- Buscar usuários que querem receber notificações
  FOR user_rec IN 
    SELECT DISTINCT 
      p.user_id,
      COALESCE(ns.agenda_email_time, '08:00:00') as email_time,
      COALESCE(p.timezone, ns.agenda_timezone, 'America/Sao_Paulo') as timezone
    FROM profiles p
    LEFT JOIN notification_settings ns ON ns.user_id = p.user_id
    WHERE p.receber_notificacao_agenda = true
  LOOP
    -- Extrair hora e minuto do horário preferido
    SELECT 
      EXTRACT(hour FROM user_rec.email_time::time),
      EXTRACT(minute FROM user_rec.email_time::time)
    INTO hour_part, minute_part;
    
    -- Nome único para o cron job
    cron_job_name := 'daily-agenda-' || user_rec.user_id;
    
    -- Criar schedule no formato cron (minuto hora * * *)
    cron_schedule := minute_part || ' ' || hour_part || ' * * *';
    
    -- Tentar cancelar job existente primeiro (ignore errors)
    BEGIN
      PERFORM cron.unschedule(cron_job_name);
    EXCEPTION 
      WHEN OTHERS THEN NULL;
    END;
    
    -- Criar novo cron job para este usuário
    PERFORM cron.schedule(
      cron_job_name,
      cron_schedule,
      $$
      SELECT net.http_post(
        url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}'::jsonb,
        body := '{"source": "pg_cron"}'::jsonb
      );
      $$
    );
  END LOOP;
END;
$$;

-- Função para executar uma vez quando um usuário atualiza suas configurações
CREATE OR REPLACE FUNCTION update_user_agenda_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cron_job_name TEXT;
  cron_schedule TEXT;
  hour_part INTEGER;
  minute_part INTEGER;
  user_timezone TEXT;
  email_time TIME;
BEGIN
  -- Só processa se for relacionado a notificações de agenda
  IF TG_TABLE_NAME = 'profiles' AND (OLD.receber_notificacao_agenda IS DISTINCT FROM NEW.receber_notificacao_agenda) THEN
    cron_job_name := 'daily-agenda-' || NEW.user_id;
    
    IF NEW.receber_notificacao_agenda = false THEN
      -- Cancelar cron job se desativou notificações
      BEGIN
        PERFORM cron.unschedule(cron_job_name);
      EXCEPTION 
        WHEN OTHERS THEN NULL;
      END;
      RETURN NEW;
    END IF;
  END IF;
  
  IF TG_TABLE_NAME = 'notification_settings' AND (
    OLD.agenda_email_time IS DISTINCT FROM NEW.agenda_email_time OR
    OLD.agenda_timezone IS DISTINCT FROM NEW.agenda_timezone
  ) THEN
    -- Buscar dados do usuário
    SELECT 
      COALESCE(NEW.agenda_email_time, '08:00:00'),
      COALESCE((SELECT timezone FROM profiles WHERE user_id = NEW.user_id), NEW.agenda_timezone, 'America/Sao_Paulo'),
      (SELECT receber_notificacao_agenda FROM profiles WHERE user_id = NEW.user_id)
    INTO email_time, user_timezone, NEW.user_id;
    
    -- Só agendar se usuário quer receber notificações
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.user_id AND receber_notificacao_agenda = true) THEN
      -- Extrair hora e minuto
      SELECT 
        EXTRACT(hour FROM email_time),
        EXTRACT(minute FROM email_time)
      INTO hour_part, minute_part;
      
      cron_job_name := 'daily-agenda-' || NEW.user_id;
      cron_schedule := minute_part || ' ' || hour_part || ' * * *';
      
      -- Cancelar job existente
      BEGIN
        PERFORM cron.unschedule(cron_job_name);
      EXCEPTION 
        WHEN OTHERS THEN NULL;
      END;
      
      -- Criar novo job
      PERFORM cron.schedule(
        cron_job_name,
        cron_schedule,
        $$
        SELECT net.http_post(
          url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}'::jsonb,
          body := '{"source": "pg_cron"}'::jsonb
        );
        $$
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar triggers para atualizar automaticamente os cron jobs
DROP TRIGGER IF EXISTS trigger_update_agenda_schedule_profiles ON profiles;
CREATE TRIGGER trigger_update_agenda_schedule_profiles
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_agenda_schedule();

DROP TRIGGER IF EXISTS trigger_update_agenda_schedule_notifications ON notification_settings;
CREATE TRIGGER trigger_update_agenda_schedule_notifications
  AFTER UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_agenda_schedule();

-- Executar função inicial para configurar jobs existentes
SELECT schedule_daily_agenda_emails();