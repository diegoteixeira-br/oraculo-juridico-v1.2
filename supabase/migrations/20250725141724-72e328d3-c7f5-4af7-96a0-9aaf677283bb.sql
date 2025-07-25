-- Verificar e corrigir a constraint message_type na tabela query_history
-- Primeiro, vamos ver quais valores são permitidos e adicionar 'legal_consultation' se necessário

-- Remover a constraint existente se houver
ALTER TABLE query_history DROP CONSTRAINT IF EXISTS query_history_message_type_check;

-- Adicionar a nova constraint com todos os valores necessários incluindo 'legal_consultation'
ALTER TABLE query_history ADD CONSTRAINT query_history_message_type_check 
CHECK (message_type IN ('user', 'assistant', 'system', 'legal_consultation', 'chat', 'consultation'));