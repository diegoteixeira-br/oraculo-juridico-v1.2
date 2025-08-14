-- Adicionar campo para horário de envio de notificação na agenda
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS agenda_email_time TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS agenda_timezone TEXT DEFAULT 'America/Sao_Paulo';