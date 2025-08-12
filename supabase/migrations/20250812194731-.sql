-- 1) Enum de papéis e tabela de user_roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar papel (SECURITY DEFINER para evitar recursão de RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Políticas de RLS para user_roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage user_roles'
      AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "Admins can manage user_roles" ON public.user_roles
    FOR ALL
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read their roles'
      AND tablename = 'user_roles'
  ) THEN
    CREATE POLICY "Users can read their roles" ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 2) Tabela de biblioteca de documentos
CREATE TABLE IF NOT EXISTS public.documents_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type text NOT NULL DEFAULT 'file', -- 'file' | 'text'
  content text,
  bucket_id text NOT NULL DEFAULT 'documents',
  object_path text, -- caminho no bucket
  file_url text,    -- opcionalmente a URL pública/assinada
  folder text,
  tags text[] DEFAULT '{}',
  uploaded_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents_library ENABLE ROW LEVEL SECURITY;

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_documents_library_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_update_documents_library_updated_at ON public.documents_library;
CREATE TRIGGER trg_update_documents_library_updated_at
BEFORE UPDATE ON public.documents_library
FOR EACH ROW EXECUTE FUNCTION public.update_documents_library_updated_at();

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_documents_library_folder ON public.documents_library (folder);
CREATE INDEX IF NOT EXISTS idx_documents_library_tags ON public.documents_library USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_documents_library_uploaded_by ON public.documents_library (uploaded_by);

-- 3) Grupos de usuários e membros
CREATE TABLE IF NOT EXISTS public.user_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;

-- 4) Compartilhamentos de documentos
CREATE TABLE IF NOT EXISTS public.document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents_library(id) ON DELETE CASCADE,
  target_user_id uuid,
  target_group_id uuid,
  shared_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_target CHECK ((target_user_id IS NOT NULL) <> (target_group_id IS NOT NULL))
);
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- 5) Função auxiliar para verificação de acesso a documentos (bypass RLS)
CREATE OR REPLACE FUNCTION public.has_document_access(p_document_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Acesso direto ou via grupo
  RETURN EXISTS (
    SELECT 1 FROM public.document_shares ds
    WHERE ds.document_id = p_document_id AND ds.target_user_id = p_user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.document_shares ds
    JOIN public.user_group_members gm ON gm.group_id = ds.target_group_id
    WHERE ds.document_id = p_document_id AND gm.user_id = p_user_id
  );
END;
$$;

-- 6) Políticas
-- documents_library: admins total; usuários somente SELECT se têm acesso
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage documents_library'
      AND tablename = 'documents_library'
  ) THEN
    CREATE POLICY "Admins manage documents_library" ON public.documents_library
    FOR ALL
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can select shared documents'
      AND tablename = 'documents_library'
  ) THEN
    CREATE POLICY "Users can select shared documents" ON public.documents_library
    FOR SELECT
    USING (is_current_user_admin() OR has_document_access(id, auth.uid()));
  END IF;
END $$;

-- document_shares e grupos: apenas admins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage document_shares'
      AND tablename = 'document_shares'
  ) THEN
    CREATE POLICY "Admins manage document_shares" ON public.document_shares
    FOR ALL
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage user_groups'
      AND tablename = 'user_groups'
  ) THEN
    CREATE POLICY "Admins manage user_groups" ON public.user_groups
    FOR ALL
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins manage user_group_members'
      AND tablename = 'user_group_members'
  ) THEN
    CREATE POLICY "Admins manage user_group_members" ON public.user_group_members
    FOR ALL
    USING (is_current_user_admin())
    WITH CHECK (is_current_user_admin());
  END IF;
END $$;

-- 7) Notificações in-app
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  url text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users read their notifications'
      AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users read their notifications" ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users update their notifications'
      AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Users update their notifications" ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role inserts notifications'
      AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Service role inserts notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins insert notifications'
      AND tablename = 'notifications'
  ) THEN
    CREATE POLICY "Admins insert notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (is_current_user_admin());
  END IF;
END $$;

-- 8) Adicionar coluna is_active no profiles para status de usuário
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;
END $$;

-- 9) Criar bucket de storage 'documents' (privado)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'documents'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
  END IF;
END $$;

-- Políticas de storage para admins
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins full access documents bucket'
      AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Admins full access documents bucket" ON storage.objects
    FOR ALL
    USING (bucket_id = 'documents' AND public.is_current_user_admin())
    WITH CHECK (bucket_id = 'documents' AND public.is_current_user_admin());
  END IF;
END $$;
