-- Criar configurações padrão para usuários que têm receber_notificacao_agenda = true mas não têm notification_settings
INSERT INTO notification_settings (
  user_id,
  email_enabled,
  days_before_deadline,
  hours_before_commitment,
  whatsapp_enabled,
  push_enabled,
  agenda_email_time,
  agenda_timezone
)
SELECT 
  p.user_id,
  true as email_enabled,
  3 as days_before_deadline,
  24 as hours_before_commitment,
  false as whatsapp_enabled,
  true as push_enabled,
  '08:00:00'::time as agenda_email_time,
  'America/Sao_Paulo' as agenda_timezone
FROM profiles p
LEFT JOIN notification_settings ns ON p.user_id = ns.user_id
WHERE p.receber_notificacao_agenda = true 
  AND ns.user_id IS NULL;