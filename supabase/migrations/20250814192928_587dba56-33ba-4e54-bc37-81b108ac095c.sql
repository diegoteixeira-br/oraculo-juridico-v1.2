-- Criar tabela para histórico de cálculos de pensão alimentícia
CREATE TABLE public.calculo_pensao_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da pensão
  tipo_calculo TEXT NOT NULL CHECK (tipo_calculo IN ('percentual', 'fixo')),
  renda_alimentante DECIMAL(15,2),
  percentual_pensao DECIMAL(5,2),
  valor_fixo DECIMAL(15,2),
  numero_filhos INTEGER NOT NULL,
  idades_filhos JSONB NOT NULL DEFAULT '[]'::jsonb,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  meses_atraso INTEGER,
  observacoes TEXT,
  
  -- Resultados do cálculo
  valor_pensao DECIMAL(15,2) NOT NULL,
  percentual_renda DECIMAL(5,2) NOT NULL,
  valor_total_atrasado DECIMAL(15,2) NOT NULL,
  multa DECIMAL(15,2) NOT NULL,
  juros DECIMAL(15,2) NOT NULL,
  valor_corrigido DECIMAL(15,2) NOT NULL,
  detalhamento TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calculo_pensao_historico ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own pension calculation history" 
ON public.calculo_pensao_historico 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pension calculation history" 
ON public.calculo_pensao_historico 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pension calculation history" 
ON public.calculo_pensao_historico 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pension calculation history" 
ON public.calculo_pensao_historico 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calculo_pensao_historico_updated_at
  BEFORE UPDATE ON public.calculo_pensao_historico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_calculo_pensao_historico_user_id_created_at 
ON public.calculo_pensao_historico(user_id, created_at DESC);