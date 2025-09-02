import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomAd {
  id: string;
  title: string;
  ad_type: string;
  content: string;
  link_url?: string;
  position: string;
  view_count: number;
  click_count: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  description: string;
}

interface CustomAdCarouselProps {
  position: string;
  className?: string;
  autoPlay?: boolean;
  intervalMs?: number;
}

export default function CustomAdCarousel({ 
  position, 
  className = "", 
  autoPlay = true,
  intervalMs = 5000 
}: CustomAdCarouselProps) {
  const [ads, setAds] = useState<CustomAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [position]);

  useEffect(() => {
    if (!autoPlay || ads.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [autoPlay, intervalMs, ads.length]);

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
      
      setAds(validAds);
    } catch (error) {
      console.error('Erro ao buscar anúncios customizados:', error);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async (adId: string) => {
    try {
      // Primeiro buscar o valor atual
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
      // Primeiro buscar o valor atual
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

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev - 1 + ads.length) % ads.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % ads.length);
  };

  const handleAdClick = (ad: CustomAd) => {
    trackClick(ad.id);
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  // Track view when ad changes
  useEffect(() => {
    if (ads[currentIndex]) {
      trackView(ads[currentIndex].id);
    }
  }, [currentIndex, ads]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-800/30 rounded-lg h-32 ${className}`}>
        <div className="text-slate-400 text-sm">Carregando anúncios...</div>
      </div>
    );
  }

  if (ads.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-slate-800/30 rounded-lg h-32 ${className}`}>
        <div className="text-slate-400 text-sm">Nenhum anúncio disponível</div>
      </div>
    );
  }

  const currentAd = ads[currentIndex];

  const renderAd = (ad: CustomAd) => {
    const handleClick = () => handleAdClick(ad);

    // Para simplificar, vamos usar o campo content para todos os tipos
    // O admin pode inserir HTML, script ou URL de imagem no campo content
    if (ad.ad_type === 'image') {
      // Se o content é uma URL de imagem
      return ad.link_url ? (
        <button onClick={handleClick} className="w-full h-full block">
          <img 
            src={ad.content} 
            alt={ad.title}
            className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
          />
        </button>
      ) : (
        <img 
          src={ad.content} 
          alt={ad.title}
          className="w-full h-full object-cover rounded-lg"
        />
      );
    } else if (ad.ad_type === 'html') {
      return (
        <div 
          className="w-full h-full"
          dangerouslySetInnerHTML={{ __html: ad.content || '' }}
          onClick={ad.link_url ? handleClick : undefined}
          style={{ cursor: ad.link_url ? 'pointer' : 'default' }}
        />
      );
    } else if (ad.ad_type === 'script') {
      return (
        <div className="w-full h-full">
          <script dangerouslySetInnerHTML={{ __html: ad.content || '' }} />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-700 rounded-lg">
          <span className="text-slate-300">Anúncio: {ad.title}</span>
        </div>
      );
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Conteúdo do anúncio */}
      <div className="relative overflow-hidden rounded-lg bg-slate-800/30 min-h-[120px]">
        {renderAd(currentAd)}
        
        {/* Controles de navegação */}
        {ads.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}
      </div>
      
      {/* Indicadores */}
      {ads.length > 1 && (
        <div className="flex justify-center mt-2 space-x-1">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-500' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      )}
      
      {/* Título do anúncio atual */}
      <div className="text-center mt-2">
        <span className="text-xs text-slate-400">
          {currentAd.title}
        </span>
      </div>
    </div>
  );
}