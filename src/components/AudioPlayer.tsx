import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AudioPlayerProps {
  audioSrc: string;
  className?: string;
  onProgress?: (current: number, duration: number, percent: number, isPlaying: boolean, playbackRate: number) => void;
  onPlayChange?: (playing: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export const AudioPlayer = ({ audioSrc, className = '', onProgress, onPlayChange, onLoadingChange }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoadingAudio, setIsLoadingAudio] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      const d = audio.duration || 0;
      if (d > 0) {
        onProgress?.(audio.currentTime, d, audio.currentTime / d, isPlaying, playbackRate);
      }
    };
    const updateDuration = () => {
      setDuration(audio.duration || 0);
    };
    const handleCanPlay = () => {
      setIsLoadingAudio(false);
      onLoadingChange?.(false);
      updateDuration();
    };
    const handleWaiting = () => {
      setIsLoadingAudio(true);
      onLoadingChange?.(true);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      onPlayChange?.(true);
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPlayChange?.(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      onPlayChange?.(false);
    };
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('loadeddata', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('loadeddata', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc, isPlaying, onProgress, onPlayChange, onLoadingChange, playbackRate]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const seekTime = (value[0] / 100) * duration;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleSpeedChange = (value: string) => {
    const speed = parseFloat(value);
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const resetAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    audio.pause();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-blue-600/20 border border-blue-500/30 rounded-lg p-4 space-y-3 ${className}`}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      
      <div className="flex items-center gap-3">
        <Button
          onClick={togglePlayPause}
          variant="ghost"
          size="sm"
          className="text-blue-300 hover:text-blue-200 hover:bg-blue-600/20"
          disabled={isLoadingAudio}
          title={isLoadingAudio ? 'Carregando áudio...' : isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isLoadingAudio ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        <Button
          onClick={resetAudio}
          variant="ghost"
          size="sm"
          className="text-blue-300 hover:text-blue-200 hover:bg-blue-600/20"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
            disabled={isLoadingAudio || !duration}
          />
        </div>

        <div className="text-xs text-blue-300 font-mono whitespace-nowrap">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-blue-300/80">
          Resposta em áudio
        </div>
        
        <Select value={playbackRate.toString()} onValueChange={handleSpeedChange}>
          <SelectTrigger className="w-20 h-7 text-xs bg-blue-700/30 border-blue-500/30 text-blue-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.5">0.5x</SelectItem>
            <SelectItem value="0.75">0.75x</SelectItem>
            <SelectItem value="1">1x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="2">2x</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};