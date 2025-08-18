-- Adicionar coluna stripe_customer_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN stripe_customer_id TEXT;