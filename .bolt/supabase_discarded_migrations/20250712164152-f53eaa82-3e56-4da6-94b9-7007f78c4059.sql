-- Adicionar campo plan_type à tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'gratuito' CHECK (plan_type IN ('gratuito', 'basico', 'premium'));

-- Criar tabela query_history para histórico de consultas
CREATE TABLE IF NOT EXISTS public.query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_text TEXT NOT NULL,
  response_text TEXT,
  credits_consumed INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS na query_history
ALTER TABLE public.query_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para query_history - usuários podem ver apenas seu próprio histórico
CREATE POLICY "Users can view their own query history" 
ON public.query_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queries" 
ON public.query_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para edge functions poderem inserir
CREATE POLICY "Service role can insert query history" 
ON public.query_history 
FOR INSERT 
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_query_history_updated_at
BEFORE UPDATE ON public.query_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();