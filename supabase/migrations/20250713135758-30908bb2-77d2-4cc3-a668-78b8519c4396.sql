-- Criar tabela Leads dashboard
CREATE TABLE public."Leads dashboard" (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT,
  session_id TEXT,
  status TEXT,
  atendente_humano BOOLEAN,
  "Mensagem" TEXT,
  "Horario" TEXT,
  followup FLOAT,
  "followup-qnt" TEXT,
  "followup-qnt2" TEXT,
  "FollowUptxt" TEXT,
  numeros TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public."Leads dashboard" ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção via service role (para o n8n)
CREATE POLICY "Service role can insert leads" 
ON public."Leads dashboard" 
FOR INSERT 
WITH CHECK (true);

-- Política para visualizar todos os leads (ajuste conforme necessário)
CREATE POLICY "Anyone can view leads" 
ON public."Leads dashboard" 
FOR SELECT 
USING (true);