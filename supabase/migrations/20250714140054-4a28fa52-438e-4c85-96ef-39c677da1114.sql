-- Adicionar campo session_id à tabela query_history para agrupar mensagens de uma conversa
ALTER TABLE public.query_history 
ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();

-- Criar índice para melhor performance nas consultas por sessão
CREATE INDEX IF NOT EXISTS idx_query_history_session_id ON public.query_history(session_id);
CREATE INDEX IF NOT EXISTS idx_query_history_user_session ON public.query_history(user_id, session_id);

-- Adicionar campo message_type para distinguir entre pergunta do usuário e resposta da IA
ALTER TABLE public.query_history 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'user_query' CHECK (message_type IN ('user_query', 'ai_response'));

-- Atualizar dados existentes - cada query existente vira uma sessão individual
UPDATE public.query_history 
SET session_id = gen_random_uuid() 
WHERE session_id IS NULL;