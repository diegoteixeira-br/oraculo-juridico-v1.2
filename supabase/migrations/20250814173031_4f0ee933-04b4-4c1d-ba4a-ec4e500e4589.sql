-- Remover o trigger problemático da tabela profiles
DROP TRIGGER IF EXISTS trigger_update_agenda_schedule_profiles ON public.profiles;

-- Recriar apenas o trigger necessário na tabela notification_settings
DROP TRIGGER IF EXISTS trigger_update_agenda_schedule_notification_settings ON public.notification_settings;

CREATE TRIGGER trigger_update_agenda_schedule_notification_settings
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_agenda_schedule();