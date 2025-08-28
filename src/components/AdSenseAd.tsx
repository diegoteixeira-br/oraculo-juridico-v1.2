import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessControl } from '@/hooks/useAccessControl';

interface AdSenseAdProps {
  format: 'auto' | 'rectangle' | 'banner' | 'leaderboard' | 'mobile' | 'large-mobile';
  slot?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdSenseAd({ format, slot, className = '', style = {} }: AdSenseAdProps) {
  const [adSenseClientId, setAdSenseClientId] = useState<string | null>(null);
  const [isAdSenseEnabled, setIsAdSenseEnabled] = useState(false);
  const { user } = useAuth();
  const { isFreeUser } = useAccessControl();
  const location = useLocation();

  // Páginas onde os anúncios devem aparecer
  const allowedPages = ['/dashboard', '/blog'];
  const isAllowedPage = allowedPages.some(page => 
    location.pathname === page || location.pathname.startsWith('/blog/')
  );

  useEffect(() => {
    const loadAdSenseConfig = async () => {
      try {
        const { data } = await supabase
          .from('blog_settings')
          .select('google_adsense_client_id, google_adsense_enabled')
          .single();

        if (data) {
          setAdSenseClientId(data.google_adsense_client_id);
          setIsAdSenseEnabled(data.google_adsense_enabled || false);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do AdSense:', error);
      }
    };

    loadAdSenseConfig();
  }, []);

  useEffect(() => {
    // Carregar anúncios quando o componente for montado e as configurações estiverem prontas
    if (isAdSenseEnabled && adSenseClientId && isFreeUser && isAllowedPage) {
      try {
        // @ts-ignore
        if (window.adsbygoogle && window.adsbygoogle.loaded) {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (error) {
        console.error('Erro ao carregar anúncio:', error);
      }
    }
  }, [isAdSenseEnabled, adSenseClientId, isFreeUser, isAllowedPage]);

  // Não mostrar anúncios se:
  // - AdSense não estiver configurado
  // - Usuário não for gratuito
  // - Não estiver em uma página permitida
  if (!isAdSenseEnabled || !adSenseClientId || !isFreeUser || !isAllowedPage) {
    return null;
  }

  const getAdFormat = () => {
    switch (format) {
      case 'rectangle':
        return { width: 300, height: 250 };
      case 'banner':
        return { width: 728, height: 90 };
      case 'leaderboard':
        return { width: 728, height: 90 };
      case 'mobile':
        return { width: 320, height: 50 };
      case 'large-mobile':
        return { width: 320, height: 100 };
      case 'auto':
      default:
        return { width: 'auto', height: 'auto' };
    }
  };

  const adFormat = getAdFormat();
  const adStyle = format === 'auto' ? { display: 'block', ...style } : { ...adFormat, ...style };

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={adSenseClientId}
        data-ad-slot={slot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}