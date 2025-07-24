-- Corrigir tokens para o usuário atual que fez a compra
UPDATE public.profiles 
SET 
  tokens = 75000,
  plan_tokens = 75000,
  plan_type = 'basico',
  daily_tokens = 0,
  updated_at = now()
WHERE user_id = 'cbdef654-7370-4780-a7b1-ea742a7671cc';