-- Verificar e corrigir constraints na tabela profiles
-- O erro indica que existe uma constraint "profiles_plan_type_new_check" que está impedindo a atualização para "essencial"

-- Primeiro, vamos ver qual é a constraint atual
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass 
AND conname LIKE '%plan_type%';

-- Remover a constraint problemática se existir
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_type_new_check;

-- Criar nova constraint com todos os valores corretos
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_type_check 
CHECK (plan_type IN ('gratuito', 'basico', 'premium', 'essencial'));