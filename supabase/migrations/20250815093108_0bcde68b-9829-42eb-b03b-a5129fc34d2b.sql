-- Adicionar política para permitir que edge functions salvem no histórico de contrato bancário
CREATE POLICY "Service role can insert contract calculation history" 
ON public.calculo_contrato_historico 
FOR INSERT 
WITH CHECK (true);