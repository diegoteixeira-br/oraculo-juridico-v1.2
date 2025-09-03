import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: any) => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// Função para processar comandos de pontuação
const processPunctuationCommands = (text: string): string => {
  let processedText = text;
  
  // Comandos de pontuação em português
  const punctuationCommands = {
    'vírgula': ',',
    'virgula': ',',
    'ponto': '.',
    'ponto final': '.',
    'interrogação': '?',
    'interogação': '?',
    'interogaçao': '?',
    'exclamação': '!',
    'exclamaçao': '!',
    'dois pontos': ':',
    'ponto e vírgula': ';',
    'ponto e virgula': ';',
    'aspas': '"',
    'abre parênteses': '(',
    'abre parenteses': '(',
    'fecha parênteses': ')',
    'fecha parenteses': ')',
    'travessão': '—',
    'travessao': '—',
    'nova linha': '\n',
    'quebra linha': '\n',
    'parágrafo': '\n\n',
    'paragrafo': '\n\n'
  };
  
  // Aplicar substituições
  Object.entries(punctuationCommands).forEach(([command, punctuation]) => {
    const regex = new RegExp(`\\b${command}\\b`, 'gi');
    processedText = processedText.replace(regex, punctuation);
  });
  
  // Limpar espaços extras ao redor da pontuação
  processedText = processedText
    .replace(/\s+([,.!?;:])/g, '$1') // Remove espaços antes da pontuação
    .replace(/([,.!?;:])\s*([,.!?;:])/g, '$1 $2') // Adiciona espaço entre pontuações consecutivas
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .trim();
  
  return processedText;
};

export function useSpeechRecognition(lang: string = "pt-BR") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false); // Novo estado
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError("Speech Recognition não é suportado neste navegador");
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      // Processar comandos de pontuação no texto final
      if (finalTranscript) {
        const processedText = processPunctuationCommands(finalTranscript);
        // For mobile audio editor, replace the entire transcript instead of accumulating
        setTranscript(processedText);
        setInterimTranscript("");
      } else {
        // Processar comandos também no texto provisório
        const processedInterim = processPunctuationCommands(interimText);
        setInterimTranscript(processedInterim);
      }

      // Reset timeout para parar automaticamente após silêncio
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (recognition && listening) {
          recognition.stop();
        }
      }, 3000); // Para após 3 segundos de silêncio
    };

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setListening(true);
      setIsTransitioning(false);
      setError(null);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setListening(false);
      setIsTransitioning(false);
      setInterimTranscript("");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      setIsTransitioning(false);
      
      // Ignorar erros "aborted" que são normais quando paramos manualmente
      if (event.error === 'aborted') {
        console.log('Speech recognition aborted (normal behavior)');
        return;
      }
      
      setError(`Erro no reconhecimento de voz: ${event.error}`);
      console.error('Speech recognition error:', event);
    };

    recRef.current = recognition;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [lang, listening]);

  const start = useCallback(() => {
    if (!recRef.current || !isSupported) {
      setError("Reconhecimento de voz não disponível");
      return;
    }

    console.log('Attempting to start speech recognition. Current state:', { listening, isTransitioning });
    
    try {
      setError(null);
      setInterimTranscript("");
      
      // Sempre para primeiro para garantir estado limpo
      if (listening && recRef.current) {
        console.log('Currently listening, stopping first...');
        try {
          recRef.current.stop();
        } catch (err) {
          console.log('Error stopping current recognition (ignoring):', err);
        }
        
        // Espera mais tempo para garantir parada completa
        setTimeout(() => {
          try {
            console.log('Starting fresh speech recognition session');
            if (recRef.current) {
              recRef.current.start();
            }
          } catch (err) {
            console.error('Error starting fresh speech recognition:', err);
            setError("Erro ao iniciar reconhecimento de voz");
          }
        }, 800);
      } else {
        console.log('Not currently listening, starting directly...');
        // Pequeno delay mesmo quando não está ouvindo para garantir estabilidade
        setTimeout(() => {
          try {
            if (recRef.current) {
              recRef.current.start();
            }
          } catch (err) {
            console.error('Error starting speech recognition:', err);
            setError("Erro ao iniciar reconhecimento de voz");
          }
        }, 100);
      }
    } catch (err) {
      setError("Erro ao iniciar reconhecimento de voz");
      console.error('Error starting speech recognition:', err);
    }
  }, [isSupported, listening]);

  const stop = useCallback(() => {
    console.log('Attempting to stop speech recognition');
    
    // Immediately update UI state for better responsiveness
    setListening(false);
    setIsTransitioning(false);
    setInterimTranscript("");
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  const updateTranscript = useCallback((newTranscript: string) => {
    setTranscript(newTranscript);
    setInterimTranscript("");
  }, []);

  return { 
    listening, 
    transcript, 
    interimTranscript,
    isSupported,
    error,
    start, 
    stop, 
    reset,
    setTranscript: updateTranscript
  };
}