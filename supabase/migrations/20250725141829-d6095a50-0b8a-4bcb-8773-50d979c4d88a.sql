-- Corrigir a constraint message_type para aceitar apenas valores válidos
-- Primeiro, remover a constraint existente
ALTER TABLE query_history DROP CONSTRAINT IF EXISTS query_history_message_type_check;

-- Adicionar a nova constraint com os valores corretos baseados nos dados existentes
ALTER TABLE query_history ADD CONSTRAINT query_history_message_type_check 
CHECK (message_type IN ('user_query', 'ai_response'));