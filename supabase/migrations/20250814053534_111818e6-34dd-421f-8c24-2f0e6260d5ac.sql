-- Criar bucket para armazenar áudios gerados
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-cache', 'audio-cache', false);

-- Políticas para o bucket de áudio cache
-- Usuários podem visualizar seus próprios áudios
CREATE POLICY "Users can view their own cached audio" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-cache' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Usuários podem fazer upload de seus próprios áudios
CREATE POLICY "Users can upload their own cached audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'audio-cache' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Usuários podem deletar seus próprios áudios
CREATE POLICY "Users can delete their own cached audio" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'audio-cache' AND auth.uid()::text = (storage.foldername(name))[1]);