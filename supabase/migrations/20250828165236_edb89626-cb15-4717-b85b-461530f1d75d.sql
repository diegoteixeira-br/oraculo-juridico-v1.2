-- Create table for AdSense sites management
CREATE TABLE public.adsense_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'preparando' CHECK (approval_status IN ('preparando', 'pronto', 'precisa_revisao', 'requer_atencao')),
  status_details TEXT,
  ads_txt_status TEXT NOT NULL DEFAULT 'verificando' CHECK (ads_txt_status IN ('encontrado', 'nao_encontrado', 'verificando')),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.adsense_sites ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Only admins can manage AdSense sites" 
ON public.adsense_sites 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_adsense_sites_updated_at
BEFORE UPDATE ON public.adsense_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();