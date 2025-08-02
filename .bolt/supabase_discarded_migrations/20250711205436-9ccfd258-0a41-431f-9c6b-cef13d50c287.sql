-- Adicionar colunas para sistema de créditos diários
ALTER TABLE public.profiles 
ADD COLUMN daily_credits INTEGER DEFAULT 3,
ADD COLUMN last_daily_reset DATE DEFAULT CURRENT_DATE;