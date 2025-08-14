-- Corrigir o trigger que está causando erro ao tentar acessar campo inexistente
DROP TRIGGER IF EXISTS trigger_update_agenda_schedule_profiles ON public.profiles;

-- Criar função corrigida para o trigger
CREATE OR REPLACE FUNCTION public.update_user_agenda_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cron_job_name TEXT;
  cron_schedule TEXT;
  hour_part INTEGER;
  minute_part INTEGER;
  email_time TIME;
  sql_command TEXT;
BEGIN
  -- Só processa se for relacionado a notificações de agenda na tabela profiles
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
  
  -- Para notification_settings, processar mudanças de horário
  IF TG_TABLE_NAME = 'notification_settings' AND (
    OLD.agenda_email_time IS DISTINCT FROM NEW.agenda_email_time OR
    OLD.agenda_timezone IS DISTINCT FROM NEW.agenda_timezone
  ) THEN
    -- Só agendar se usuário quer receber notificações
    IF EXISTS (SELECT 1 FROM profiles WHERE user_id = NEW.user_id AND receber_notificacao_agenda = true) THEN
      -- Buscar horário preferido
      email_time := COALESCE(NEW.agenda_email_time, '08:00:00');
      
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
      
      -- Comando SQL para executar
      sql_command := 'SELECT net.http_post(
        url := ''https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary'',
        headers := ''{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU"}''::jsonb,
        body := ''{"source": "pg_cron"}''::jsonb
      );';
      
      -- Criar novo job
      PERFORM cron.schedule(
        cron_job_name,
        cron_schedule,
        sql_command
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar o trigger apenas na tabela profiles
CREATE TRIGGER trigger_update_agenda_schedule_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_agenda_schedule();