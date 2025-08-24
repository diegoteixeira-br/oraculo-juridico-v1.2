import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdDisplay from "./AdDisplay";
import GoogleAdsPlaceholder from "./GoogleAdsPlaceholder";

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
  intervalMs = 8000 // 8 segundos por padrão
}: AdCarouselProps) {
  const [showCustomAds, setShowCustomAds] = useState(true);
  const [hasCustomAds, setHasCustomAds] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCustomAds();
  }, [position]);

  useEffect(() => {
    if (!hasCustomAds) return;

    const interval = setInterval(() => {
      setShowCustomAds(prev => !prev);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, hasCustomAds]);

  const checkCustomAds = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_ads')
        .select('id, start_date, end_date')
        .eq('position', position)
        .eq('is_active', true);

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
      
      setHasCustomAds(validAds.length > 0);
    } catch (error) {
      console.error('Erro ao verificar anúncios customizados:', error);
      setHasCustomAds(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  // Se não há anúncios customizados, mostra apenas Google Ads
  if (!hasCustomAds) {
    return (
      <div className={className}>
        <GoogleAdsPlaceholder 
          format={format} 
          position={position}
        />
      </div>
    );
  }

  // Se há anúncios customizados, faz carrossel
  return (
    <div className={`relative ad-carousel-container ${className}`}>
      {/* Anúncios Customizados */}
      <div 
        className={`transition-opacity duration-1000 ${showCustomAds ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
      >
        <AdDisplay position={position} />
      </div>
      
      {/* Google Ads */}
      <div 
        className={`transition-opacity duration-1000 ${!showCustomAds ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'}`}
      >
        <GoogleAdsPlaceholder 
          format={format} 
          position={position}
        />
      </div>
      
      {/* Indicadores do carrossel */}
      <div className="flex justify-center mt-2 space-x-1">
        <div className={`w-2 h-2 rounded-full transition-colors ${showCustomAds ? 'bg-blue-500' : 'bg-slate-400'}`} />
        <div className={`w-2 h-2 rounded-full transition-colors ${!showCustomAds ? 'bg-blue-500' : 'bg-slate-400'}`} />
      </div>
      
      {/* Labels para debugging */}
      <div className="text-xs text-center text-slate-500 mt-1">
        {showCustomAds ? 'Anúncios Customizados' : 'Google AdSense'}
      </div>
    </div>
  );
}