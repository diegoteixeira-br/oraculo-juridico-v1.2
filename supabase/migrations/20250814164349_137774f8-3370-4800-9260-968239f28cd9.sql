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