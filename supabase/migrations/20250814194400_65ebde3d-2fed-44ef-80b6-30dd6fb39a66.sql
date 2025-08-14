-- Adicionar política para permitir que edge functions salvem no histórico de pensão
CREATE POLICY "Service role can insert pension calculation history" 
ON public.calculo_pensao_historico 
FOR INSERT 
WITH CHECK (true);