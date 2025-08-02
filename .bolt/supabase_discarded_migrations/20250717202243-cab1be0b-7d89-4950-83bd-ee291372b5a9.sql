-- Remover função is_user_admin
DROP FUNCTION IF EXISTS public.is_user_admin(uuid);

-- Remover tabela admins (as políticas RLS serão removidas automaticamente)
DROP TABLE IF EXISTS public.admins;