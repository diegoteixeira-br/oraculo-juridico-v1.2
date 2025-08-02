-- Criar perfil para o usuário que está sem perfil
INSERT INTO public.profiles (
  user_id,
  full_name,
  tokens,
  daily_tokens,
  plan_tokens,
  plan_type,
  created_at,
  updated_at
) VALUES (
  'cbdef654-7370-4780-a7b1-ea742a7671cc',
  'Diego T da Silva',
  0,
  3000,
  0,
  'gratuito',
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;