-- Remover campo is_admin da tabela profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- Remover índice relacionado
DROP INDEX IF EXISTS idx_profiles_is_admin;

-- Criar tabela separada para administradores
CREATE TABLE public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Criar índice para performance
CREATE INDEX idx_admins_user_id ON public.admins(user_id);

-- Política para permitir que apenas admins vejam a tabela de admins
CREATE POLICY "Only admins can view admins table"
ON public.admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
);

-- Política para permitir que apenas admins insiram novos admins
CREATE POLICY "Only admins can insert admins"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
);

-- Política para permitir que apenas admins removam admins
CREATE POLICY "Only admins can delete admins"
ON public.admins
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid()
  )
);

-- Atualizar função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = $1
  );
$$;

-- Trigger para updated_at
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();