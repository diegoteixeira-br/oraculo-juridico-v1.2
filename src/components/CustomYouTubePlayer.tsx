import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings } from 'lucide-react';

interface CustomYouTubePlayerProps {
  videoId: string;
  title: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const CustomYouTubePlayer: React.FC<CustomYouTubePlayerProps> = ({ videoId, title }) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Inicia sempre mutado
  const [showAudioPrompt, setShowAudioPrompt] = useState(true); // Mostra prompt de áudio
  const [isReady, setIsReady] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);

  // Salvar/carregar posição do vídeo
  const saveVideoPosition = (time: number) => {
    localStorage.setItem(`video_position_${videoId}`, time.toString());
  };

  const getSavedVideoPosition = (): number => {
    const saved = localStorage.getItem(`video_position_${videoId}`);
    return saved ? parseFloat(saved) : 0;
  };

  useEffect(() => {
    // Carregar API do YouTube
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        const currentTime = player.getCurrentTime();
        if (currentTime > 0) {
          saveVideoPosition(currentTime);
        }
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!containerRef.current) return;

    const newPlayer = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: {
        autoplay: 1, // Autoplay habilitado
        mute: 1, // Inicia mutado para permitir autoplay
        controls: 0, // Remove controles padrão
        disablekb: 1, // Desabilita teclado
        fs: 0, // Remove fullscreen
        iv_load_policy: 3, // Remove anotações
        modestbranding: 1, // Remove logo do YouTube
        rel: 0, // Remove vídeos relacionados
        showinfo: 0, // Remove informações do vídeo
        cc_load_policy: 1, // Carrega legendas se disponíveis
        hl: 'pt', // Idioma português
        playsinline: 1, // Reproduz inline no mobile
        widget_referrer: window.location.href, // Define referrer
        origin: window.location.origin, // Define origem
        enablejsapi: 1, // Habilita API JS
        end: 0, // Remove tela final com vídeos relacionados
        branding: 0, // Remove marca do YouTube
        autohide: 1, // Esconde controles automaticamente
        loop: 0, // Não fazer loop
        playlist: videoId, // Define playlist como o próprio vídeo para evitar sugestões
      },
      events: {
        onReady: (event: any) => {
          setPlayer(event.target);
          setIsReady(true);
          
          // Configurar volume inicial
          const savedVolume = localStorage.getItem(`video_volume_${videoId}`);
          if (savedVolume) {
            event.target.setVolume(parseInt(savedVolume));
            setIsMuted(parseInt(savedVolume) === 0);
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;
          setIsPlaying(state === window.YT.PlayerState.PLAYING);
          
          // Detectar quando o vídeo termina
          if (state === window.YT.PlayerState.ENDED) {
            setVideoEnded(true);
          }
          
          // Salvar posição a cada 5 segundos durante reprodução
          if (state === window.YT.PlayerState.PLAYING) {
            setVideoEnded(false); // Reset quando começa a reproduzir novamente
            const interval = setInterval(() => {
              if (player && player.getCurrentTime) {
                saveVideoPosition(player.getCurrentTime());
              }
            }, 5000);
            
            playerRef.current = interval;
          } else {
            if (playerRef.current) {
              clearInterval(playerRef.current);
            }
          }
        },
      },
    });
  };

  const handleAudioUnlock = () => {
    if (!player) return;
    
    // Voltar ao começo e liberar áudio
    player.seekTo(0);
    player.unMute();
    player.playVideo();
    setIsMuted(false);
    setShowAudioPrompt(false);
    setHasUserInteracted(true);
  };

  const togglePlayPause = () => {
    if (!player) return;

    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const toggleMute = () => {
    if (!player) return;

    if (isMuted) {
      player.unMute();
      const volume = localStorage.getItem(`video_volume_${videoId}`) || '50';
      player.setVolume(parseInt(volume));
      setIsMuted(false);
    } else {
      localStorage.setItem(`video_volume_${videoId}`, player.getVolume().toString());
      player.mute();
      setIsMuted(true);
    }
  };

  const toggleCaptions = () => {
    if (!player) return;
    
    // Tentar ativar/desativar legendas
    try {
      const options = player.getOptions();
      const captionTracks = options.captions || [];
      if (captionTracks.length > 0) {
        // Alternar entre português e off
        const currentTrack = player.getOption('captions', 'track');
        if (currentTrack && currentTrack.languageCode === 'pt') {
          player.setOption('captions', 'track', {});
        } else {
          const ptTrack = captionTracks.find((track: any) => track.languageCode === 'pt');
          if (ptTrack) {
            player.setOption('captions', 'track', ptTrack);
          }
        }
      }
    } catch (error) {
      console.log('Legendas não disponíveis para este vídeo');
    }
  };

  const handleWatchAgain = () => {
    if (!player) return;
    player.seekTo(0);
    player.playVideo();
    setVideoEnded(false);
  };

  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="aspect-video bg-slate-800/50 rounded-lg border border-border overflow-hidden shadow-2xl relative">
        {/* Container do player */}
        <div ref={containerRef} className="w-full h-full"></div>
        
        {/* Overlay sem controles customizados */}
        {isReady && !showAudioPrompt && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Controles removidos conforme solicitado */}
          </div>
        )}

        {/* Prompt central para liberar áudio */}
        {showAudioPrompt && isReady && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto cursor-pointer animate-pulse"
            onClick={handleAudioUnlock}
          >
            <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-8 text-center shadow-2xl max-w-md mx-4 border-2 border-red-400 animate-pulse">
              <div className="text-6xl mb-4 animate-bounce">🔊</div>
              <h3 className="text-xl font-bold mb-4 text-white">
                Clique para ativar o áudio
              </h3>
              <p className="text-red-100 mb-6">
                O vídeo está reproduzindo sem som. Clique aqui para ativar o áudio e reiniciar do começo.
              </p>
              <div className="text-sm text-red-200 animate-pulse">
                👆 Clique em qualquer lugar desta área
              </div>
            </div>
          </div>
        )}

        
        {/* Botão Assistir Novamente - só aparece quando vídeo termina */}
        {videoEnded && !showAudioPrompt && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-auto">
            <button
              onClick={handleWatchAgain}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-2xl border-2 border-red-400"
            >
              ▶️ Assistir Novamente
            </button>
          </div>
        )}

        {/* Loading state */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">⏳</div>
              <p>Carregando vídeo...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};