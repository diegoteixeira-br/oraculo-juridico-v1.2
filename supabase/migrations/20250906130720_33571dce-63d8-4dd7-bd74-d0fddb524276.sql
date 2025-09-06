-- Add launch offer fields to landing_page_settings table
ALTER TABLE public.landing_page_settings 
ADD COLUMN launch_offer_enabled boolean DEFAULT false,
ADD COLUMN launch_offer_text text DEFAULT 'OFERTA DE LANÇAMENTO: Use o cupom ORACULO10 e ganhe 10% de desconto no seu primeiro mês. Válido por tempo limitado!',
ADD COLUMN launch_offer_code text DEFAULT 'ORACULO10',
ADD COLUMN launch_offer_discount_percentage integer DEFAULT 10;