-- Remover as políticas administrativas atuais que requerem autenticação
DROP POLICY IF EXISTS "Admin can insert legal documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Admin can update legal documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Admin can delete legal documents" ON public.legal_documents;

-- Criar políticas que permitam operações sem autenticação (para administração)
-- IMPORTANTE: Isso permite operações sem autenticação. Na produção, considere implementar
-- autenticação Supabase para administradores ou adicionar verificação adicional

CREATE POLICY "Allow insert for admin operations" 
ON public.legal_documents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update for admin operations" 
ON public.legal_documents 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow delete for admin operations" 
ON public.legal_documents 
FOR DELETE 
USING (true);