-- Migrar coluna min_credits_required para min_tokens_required na tabela legal_documents
-- Primeiro adicionar a nova coluna
ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS min_tokens_required INTEGER DEFAULT 3000;

-- Migrar dados existentes (converter créditos para tokens - assumindo 1 crédito = 1000 tokens)
UPDATE public.legal_documents 
SET min_tokens_required = COALESCE(min_credits_required, 3) * 1000;

-- Remover coluna antiga após migração
ALTER TABLE public.legal_documents 
DROP COLUMN IF EXISTS min_credits_required;