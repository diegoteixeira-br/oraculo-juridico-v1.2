-- Adicionar coluna para salvar arquivos anexados no histórico
ALTER TABLE query_history 
ADD COLUMN attached_files JSONB DEFAULT NULL;