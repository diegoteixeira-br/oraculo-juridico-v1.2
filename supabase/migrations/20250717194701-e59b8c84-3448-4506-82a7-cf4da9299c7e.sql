-- Adicionar coluna is_admin na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN is_admin boolean NOT NULL DEFAULT false;

-- Criar índice para performance
CREATE INDEX idx_profiles_is_admin ON public.profiles(is_admin);

-- Criar política RLS para que apenas admins possam atualizar o campo is_admin
CREATE POLICY "Only admins can update admin status"
ON public.profiles
FOR UPDATE
USING (
  -- Só permite atualizar is_admin se o usuário atual já for admin
  CASE 
    WHEN OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() AND is_admin = true
      )
    ELSE true
  END
);

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

-- Política para que admins possam ver todos os profiles (para gerenciamento)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  -- Usuários normais veem apenas seu próprio perfil
  (auth.uid() = user_id) OR
  -- Admins podem ver todos os perfis
  public.is_user_admin(auth.uid())
);

-- Política para que admins possam atualizar qualquer profile (para gerenciamento)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (
  -- Usuários normais podem atualizar apenas seu próprio perfil
  (auth.uid() = user_id) OR
  -- Admins podem atualizar qualquer perfil
  public.is_user_admin(auth.uid())
);