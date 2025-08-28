import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function AdSenseScript() {
  useEffect(() => {
    const loadAdSense = async () => {
      try {
        // Buscar configurações do blog
        const { data } = await supabase
          .from('blog_settings')
          .select('google_adsense_client_id, google_adsense_enabled')
          .single();

        if (data?.google_adsense_enabled && data?.google_adsense_client_id) {
          // Verificar se o script já foi carregado
          if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
            return;
          }

          // Criar e inserir o script do AdSense
          const script = document.createElement('script');
          script.async = true;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${data.google_adsense_client_id}`;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);

          // Inserir o script de inicialização global
          const initScript = document.createElement('script');
          initScript.innerHTML = `
            (adsbygoogle = window.adsbygoogle || []).push({
              google_ad_client: "${data.google_adsense_client_id}",
              enable_page_level_ads: true
            });
          `;
          document.head.appendChild(initScript);
        }
      } catch (error) {
        console.error('Erro ao carregar AdSense:', error);
      }
    };

    loadAdSense();
  }, []);

  return null;
}