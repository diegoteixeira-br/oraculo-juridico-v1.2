-- Adicionar políticas RLS para permitir que usuários excluam seu próprio histórico
CREATE POLICY "Users can delete their own query history" 
ON public.query_history 
FOR DELETE 
USING (auth.uid() = user_id);