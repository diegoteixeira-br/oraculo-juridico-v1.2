-- Adicionar política para permitir que usuários autenticados possam inserir, atualizar e deletar documentos
-- (para uso administrativo)

-- Política para INSERT
CREATE POLICY "Admin can insert legal documents" 
ON public.legal_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Política para UPDATE 
CREATE POLICY "Admin can update legal documents" 
ON public.legal_documents 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "Admin can delete legal documents" 
ON public.legal_documents 
FOR DELETE 
TO authenticated 
USING (true);