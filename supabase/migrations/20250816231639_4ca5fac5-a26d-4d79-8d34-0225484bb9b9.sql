-- Permitir leitura pública das configurações da landing page
CREATE POLICY "Allow public read access to landing page settings" 
ON public.landing_page_settings 
FOR SELECT 
USING (true);