-- Adicionar política para permitir que a edge function insira compromissos
CREATE POLICY "Service role can insert legal commitments" 
ON public.legal_commitments 
FOR INSERT 
WITH CHECK (true);

-- Garantir que a role service_role tenha acesso
GRANT INSERT ON public.legal_commitments TO service_role;