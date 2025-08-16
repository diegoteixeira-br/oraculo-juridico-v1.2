-- Atualizar o trial_end_date para refletir 7 dias a partir de hoje
UPDATE profiles 
SET trial_end_date = '2025-08-22 23:59:59.999999+00'::timestamp with time zone
WHERE user_id = '91220a9f-d02d-407e-8aa2-824146c7bbae';