import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface AdCarouselProps {
  position: string;
  format: string;
  className?: string;
  intervalMs?: number;
}

export default function AdCarousel({ 
  position, 
  format, 
  className = "", 
  intervalMs = 5000 // 5 segundos por padrão
}: AdCarouselProps) {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [position]);

  useEffect(() => {
    if (ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % ads.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, ads.length]);

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

  const nextAd = () => {
    setCurrentAdIndex(prev => (prev + 1) % ads.length);
  };

  const prevAd = () => {
    setCurrentAdIndex(prev => (prev - 1 + ads.length) % ads.length);
  };

  const goToAd = (index: number) => {
    setCurrentAdIndex(index);
  };

  if (loading || ads.length === 0) {
    return null;
  }

  const currentAd = ads[currentAdIndex];

  return (
    <div className={`relative ad-carousel-container ${className}`}>
      {/* Container do anúncio atual */}
      <div className="relative overflow-hidden rounded-lg">
        <div key={currentAd.id} className="ad-container">
          {currentAd.ad_type === 'image' && (
            <div 
              className={`cursor-pointer transition-transform hover:scale-105 ${currentAd.link_url ? '' : 'cursor-default'}`}
              onClick={() => handleImageClick(currentAd)}
              title={currentAd.title}
            >
              <img 
                src={currentAd.content} 
                alt={currentAd.title}
                className="w-full h-auto rounded-lg border border-slate-600/30"
                onError={(e) => {
                  console.error('Erro ao carregar imagem do anúncio:', currentAd.title);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {currentAd.ad_type === 'html' && (
            <div 
              className="ad-html-content"
              dangerouslySetInnerHTML={{ __html: currentAd.content }}
              onClick={() => trackClick(currentAd.id)}
            />
          )}
          
          {currentAd.ad_type === 'script' && (
            <div 
              className="ad-script-content"
              onClick={() => trackClick(currentAd.id)}
            >
              <script
                dangerouslySetInnerHTML={{ __html: currentAd.content }}
              />
            </div>
          )}
        </div>

        {/* Controles de navegação - apenas se houver mais de um anúncio */}
        {ads.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 h-8 w-8"
              onClick={prevAd}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 h-8 w-8"
              onClick={nextAd}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      
      {/* Indicadores do carrossel - apenas se houver mais de um anúncio */}
      {ads.length > 1 && (
        <div className="flex justify-center mt-3 space-x-2">
          {ads.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentAdIndex ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              onClick={() => goToAd(index)}
            />
          ))}
        </div>
      )}
      
      {/* Título do anúncio */}
      {currentAd.title && (
        <div className="text-xs text-center text-muted-foreground mt-2">
          {currentAd.title}
        </div>
      )}
    </div>
  );
}