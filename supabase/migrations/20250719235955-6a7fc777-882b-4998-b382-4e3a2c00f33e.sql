-- Corrigir foreign key constraint para permitir exclusão em cascata
-- Primeiro, remover a constraint existente
ALTER TABLE public.user_document_access 
DROP CONSTRAINT IF EXISTS user_document_access_document_id_fkey;

-- Recriar a constraint com ON DELETE CASCADE
ALTER TABLE public.user_document_access 
ADD CONSTRAINT user_document_access_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES public.legal_documents(id) 
ON DELETE CASCADE;