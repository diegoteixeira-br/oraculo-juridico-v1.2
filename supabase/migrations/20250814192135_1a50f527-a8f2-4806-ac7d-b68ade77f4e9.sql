-- Criar tabela para histórico de cálculos de contrato bancário
CREATE TABLE public.calculo_contrato_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados do contrato
  valor_contrato DECIMAL(15,2) NOT NULL,
  data_contrato DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  taxa_juros DECIMAL(8,4) NOT NULL,
  tipo_juros TEXT NOT NULL CHECK (tipo_juros IN ('simples', 'compostos')),
  indice_correcao TEXT NOT NULL,
  valor_pago DECIMAL(15,2),
  data_pagamento_parcial DATE,
  multa_atraso DECIMAL(5,2),
  juros_mora DECIMAL(5,2),
  observacoes TEXT,
  
  -- Resultados do cálculo
  valor_total DECIMAL(15,2) NOT NULL,
  juros_total DECIMAL(15,2) NOT NULL,
  valor_corrigido DECIMAL(15,2) NOT NULL,
  diferenca DECIMAL(15,2) NOT NULL,
  detalhamento TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calculo_contrato_historico ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own calculation history" 
ON public.calculo_contrato_historico 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calculation history" 
ON public.calculo_contrato_historico 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calculation history" 
ON public.calculo_contrato_historico 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calculation history" 
ON public.calculo_contrato_historico 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_calculo_contrato_historico_updated_at
  BEFORE UPDATE ON public.calculo_contrato_historico
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_calculo_contrato_historico_user_id_created_at 
ON public.calculo_contrato_historico(user_id, created_at DESC);