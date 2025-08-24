import { useState, useEffect } from "react";
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

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCustomAds(prev => !prev);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

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