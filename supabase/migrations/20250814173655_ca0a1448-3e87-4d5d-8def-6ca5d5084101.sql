-- Criar um compromisso de teste para as próximas 24 horas para testar as notificações
INSERT INTO public.legal_commitments (
  user_id, 
  title, 
  description, 
  commitment_type, 
  commitment_date, 
  status, 
  priority,
  auto_detected
) VALUES (
  '195b0286-2406-4bcb-a769-3b7432ce4864',
  'Reunião de teste para amanhã',
  'Compromisso de teste criado para validar o sistema de notificações da agenda jurídica',
  'reuniao',
  NOW() + INTERVAL '12 hours',
  'pendente',
  'normal',
  false
);