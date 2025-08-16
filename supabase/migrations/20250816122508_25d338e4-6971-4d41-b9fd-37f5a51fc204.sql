-- Funções para incrementar contadores de anúncios
CREATE OR REPLACE FUNCTION public.increment_ad_views(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.custom_ads 
  SET view_count = view_count + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.custom_ads 
  SET click_count = click_count + 1,
      updated_at = now()
  WHERE id = ad_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;