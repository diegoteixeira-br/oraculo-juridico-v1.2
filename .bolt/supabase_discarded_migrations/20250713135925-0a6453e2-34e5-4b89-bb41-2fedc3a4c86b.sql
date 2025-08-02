-- Criar tabela documents
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT,
  metadata JSONB,
  embedding VECTOR,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela imagenes  
CREATE TABLE public.imagenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  link TEXT,
  tipo_imagem TEXT,
  tipo_video TEXT,
  descricao TEXT
);

-- Criar tabela nbn_chat_histories
CREATE TABLE public.nbn_chat_histories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  message JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para todas as tabelas
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nbn_chat_histories ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso via service role
CREATE POLICY "Service role can manage documents" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage imagenes" ON public.imagenes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role can manage chat histories" ON public.nbn_chat_histories FOR ALL USING (true) WITH CHECK (true);