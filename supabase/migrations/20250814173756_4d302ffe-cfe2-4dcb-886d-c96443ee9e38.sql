-- Atualizar o horário de notificação para alguns minutos à frente para teste
UPDATE public.notification_settings 
SET agenda_email_time = '14:40:00'::time
WHERE user_id = '195b0286-2406-4bcb-a769-3b7432ce4864';