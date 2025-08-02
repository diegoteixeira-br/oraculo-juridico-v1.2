-- Criar tabela nbn_chat_histories
CREATE TABLE public.nbn_chat_histories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  message JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.nbn_chat_histories ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso via service role
CREATE POLICY "Service role can manage chat histories" ON public.nbn_chat_histories FOR ALL USING (true) WITH CHECK (true);