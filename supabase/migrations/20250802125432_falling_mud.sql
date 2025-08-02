/*
  # Criar tabela legal_commitments e corrigir políticas RLS

  1. Nova Tabela
    - `legal_commitments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text, optional)
      - `commitment_type` (enum)
      - `commitment_date` (timestamptz)
      - `location` (text, optional)
      - `process_number` (text, optional)
      - `client_name` (text, optional)
      - `status` (enum)
      - `priority` (enum)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela legal_commitments
    - Adicionar política para usuários verem seus próprios compromissos
    - Verificar política existente para legal_documents
*/

-- Criar enum para tipos de compromisso
DO $$ BEGIN
  CREATE TYPE commitment_type_enum AS ENUM ('prazo_processual', 'audiencia', 'reuniao', 'personalizado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar enum para status
DO $$ BEGIN
  CREATE TYPE commitment_status_enum AS ENUM ('pendente', 'concluido', 'cancelado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar enum para prioridade
DO $$ BEGIN
  CREATE TYPE commitment_priority_enum AS ENUM ('baixa', 'normal', 'alta', 'urgente');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Criar tabela legal_commitments se não existir
CREATE TABLE IF NOT EXISTS public.legal_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  commitment_type commitment_type_enum NOT NULL DEFAULT 'personalizado',
  commitment_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  process_number TEXT,
  client_name TEXT,
  status commitment_status_enum NOT NULL DEFAULT 'pendente',
  priority commitment_priority_enum NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_legal_commitments_user_id ON public.legal_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_commitments_date ON public.legal_commitments(commitment_date);
CREATE INDEX IF NOT EXISTS idx_legal_commitments_status ON public.legal_commitments(status);
CREATE INDEX IF NOT EXISTS idx_legal_commitments_type ON public.legal_commitments(commitment_type);

-- Habilitar RLS
ALTER TABLE public.legal_commitments ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seus próprios compromissos
DROP POLICY IF EXISTS "Users can view their own legal commitments" ON public.legal_commitments;
CREATE POLICY "Users can view their own legal commitments"
ON public.legal_commitments
FOR SELECT
USING (auth.uid() = user_id);

-- Política para usuários criarem seus próprios compromissos
DROP POLICY IF EXISTS "Users can create their own legal commitments" ON public.legal_commitments;
CREATE POLICY "Users can create their own legal commitments"
ON public.legal_commitments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem seus próprios compromissos
DROP POLICY IF EXISTS "Users can update their own legal commitments" ON public.legal_commitments;
CREATE POLICY "Users can update their own legal commitments"
ON public.legal_commitments
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política para usuários deletarem seus próprios compromissos
DROP POLICY IF EXISTS "Users can delete their own legal commitments" ON public.legal_commitments;
CREATE POLICY "Users can delete their own legal commitments"
ON public.legal_commitments
FOR DELETE
USING (auth.uid() = user_id);

-- Verificar e corrigir política para legal_documents se necessário
DROP POLICY IF EXISTS "Authenticated users can view active documents" ON public.legal_documents;
CREATE POLICY "Authenticated users can view active documents"
ON public.legal_documents
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION public.update_legal_commitments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
DROP TRIGGER IF EXISTS update_legal_commitments_updated_at ON public.legal_commitments;
CREATE TRIGGER update_legal_commitments_updated_at
  BEFORE UPDATE ON public.legal_commitments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_legal_commitments_updated_at();

-- Inserir alguns compromissos de exemplo (opcional)
-- Estes serão visíveis apenas para o usuário que os criar
INSERT INTO public.legal_commitments (
  user_id, 
  title, 
  description, 
  commitment_type, 
  commitment_date, 
  status, 
  priority,
  process_number,
  client_name
) VALUES 
-- Estes exemplos só funcionarão se houver usuários na tabela auth.users
-- Caso contrário, serão ignorados silenciosamente
(
  (SELECT id FROM auth.users LIMIT 1),
  'Audiência de Conciliação',
  'Audiência de conciliação no processo trabalhista',
  'audiencia',
  now() + interval '3 days',
  'pendente',
  'alta',
  '1234567-89.2024.5.02.0001',
  'João Silva'
) ON CONFLICT DO NOTHING;