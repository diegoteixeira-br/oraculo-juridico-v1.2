import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomAd {
  id: string;
  title: string;
  ad_type: 'image' | 'html' | 'script';
  content: string;
  link_url?: string;
  position: string;
  click_count: number;
  view_count: number;
}

interface AdDisplayProps {
  position: string;
  className?: string;
}

export default function AdDisplay({ position, className = "" }: AdDisplayProps) {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [position]);

  const fetchAds = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_ads')
        .select('*')
        .eq('position', position)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrar anúncios válidos por data
      const now = new Date();
      const validAds = (data || []).filter(ad => {
        const startDate = ad.start_date ? new Date(ad.start_date) : null;
        const endDate = ad.end_date ? new Date(ad.end_date) : null;
        
        if (startDate && now < startDate) return false;
        if (endDate && now > endDate) return false;
        
        return true;
      });
      
      setAds(validAds.map(ad => ({
        ...ad,
        ad_type: ad.ad_type as 'image' | 'html' | 'script'
      })));
      
      // Registrar visualizações para cada anúncio
      if (validAds.length > 0) {
        validAds.forEach(ad => trackView(ad.id));
      }
    } catch (error) {
      console.error('Erro ao carregar anúncios:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (adId: string) => {
    try {
      // Buscar contagem atual primeiro
      const { data: currentAd } = await supabase
        .from('custom_ads')
        .select('view_count')
        .eq('id', adId)
        .single();
      
      if (currentAd) {
        await supabase
          .from('custom_ads')
          .update({ view_count: currentAd.view_count + 1 })
          .eq('id', adId);
      }
    } catch (error) {
      console.error('Erro ao registrar visualização:', error);
    }
  };

  const trackClick = async (adId: string) => {
    try {
      // Buscar contagem atual primeiro
      const { data: currentAd } = await supabase
        .from('custom_ads')
        .select('click_count')
        .eq('id', adId)
        .single();
      
      if (currentAd) {
        await supabase
          .from('custom_ads')
          .update({ click_count: currentAd.click_count + 1 })
          .eq('id', adId);
      }
    } catch (error) {
      console.error('Erro ao registrar clique:', error);
    }
  };

  const handleImageClick = (ad: CustomAd) => {
    trackClick(ad.id);
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading || ads.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {ads.map((ad) => (
        <div key={ad.id} className="ad-container">
          {ad.ad_type === 'image' && (
            <div 
              className={`cursor-pointer transition-transform hover:scale-105 ${ad.link_url ? '' : 'cursor-default'}`}
              onClick={() => handleImageClick(ad)}
              title={ad.title}
            >
              <img 
                src={ad.content} 
                alt={ad.title}
                className="w-full h-auto rounded-lg border border-slate-600/30"
                onError={(e) => {
                  console.error('Erro ao carregar imagem do anúncio:', ad.title);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {ad.ad_type === 'html' && (
            <div 
              className="ad-html-content"
              dangerouslySetInnerHTML={{ __html: ad.content }}
              onClick={() => trackClick(ad.id)}
            />
          )}
          
          {ad.ad_type === 'script' && (
            <div 
              className="ad-script-content"
              onClick={() => trackClick(ad.id)}
            >
              <script
                dangerouslySetInnerHTML={{ __html: ad.content }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}