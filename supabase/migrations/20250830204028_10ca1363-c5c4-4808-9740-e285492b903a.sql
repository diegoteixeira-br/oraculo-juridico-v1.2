-- Tabela de processos do CNJ
CREATE TABLE public.processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_cnj text NOT NULL UNIQUE,
  tribunal text,
  classe text,
  assunto text[],
  partes jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Vínculo do processo com o advogado (multiusuário)
CREATE TABLE public.processos_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  processo_numero text REFERENCES public.processos(numero_cnj) ON DELETE CASCADE,
  apelido text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, processo_numero)
);

-- Audiências/prazos extraídos e normalizados para a Agenda
CREATE TABLE public.eventos_processo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_numero text REFERENCES public.processos(numero_cnj) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text CHECK (tipo IN ('audiencia','prazo','sessao','limite')),
  titulo text,
  descricao text,
  local text,
  inicio timestamptz NOT NULL,
  fim timestamptz,
  origem text DEFAULT 'datajud',
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_eventos_processo_user_inicio ON public.eventos_processo (user_id, inicio);
CREATE INDEX idx_processos_usuarios_user_id ON public.processos_usuarios (user_id);

-- RLS Policies
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_processo ENABLE ROW LEVEL SECURITY;

-- Policies para processos - separadas por operação
CREATE POLICY "Users can view processes through processos_usuarios" ON public.processos
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.processos_usuarios pu 
    WHERE pu.processo_numero = numero_cnj AND pu.user_id = auth.uid()
  ));

CREATE POLICY "Service role can insert processes" ON public.processos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update processes" ON public.processos
  FOR UPDATE USING (true);

-- Policies para processos_usuarios
CREATE POLICY "Users can view their own process links" ON public.processos_usuarios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own process links" ON public.processos_usuarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert process links" ON public.processos_usuarios
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own process links" ON public.processos_usuarios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own process links" ON public.processos_usuarios
  FOR DELETE USING (auth.uid() = user_id);

-- Policies para eventos_processo
CREATE POLICY "Users can view their own process events" ON public.eventos_processo
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own process events" ON public.eventos_processo
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert process events" ON public.eventos_processo
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own process events" ON public.eventos_processo
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own process events" ON public.eventos_processo
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_processos_updated_at
  BEFORE UPDATE ON public.processos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();