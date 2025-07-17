-- Adicionar coluna is_admin na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Criar índice para performance
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);

-- Função para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE profiles.user_id = $1),
    false
  );
$$;