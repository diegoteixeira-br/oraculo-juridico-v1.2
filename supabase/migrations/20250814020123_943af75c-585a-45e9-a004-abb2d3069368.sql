-- Remover o constraint antigo
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_type_check;

-- Criar novo constraint que permite "gratuito" e "Essencial"
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_type_check 
CHECK (plan_type IN ('gratuito', 'Essencial', 'premium'));