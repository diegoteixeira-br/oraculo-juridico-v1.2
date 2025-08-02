-- Resetar os tokens diários para usuários gratuitos
UPDATE public.profiles 
SET 
  daily_tokens = 3000,
  tokens = daily_tokens + plan_tokens,
  updated_at = now()
WHERE plan_type = 'gratuito' AND user_id = 'cbdef654-7370-4780-a7b1-ea742a7671cc';