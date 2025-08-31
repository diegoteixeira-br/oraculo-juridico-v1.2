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
        setTranscript(prev => prev + processedText);
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
    if (!recRef.current || !isSupported || isTransitioning) {
      setError("Reconhecimento de voz não disponível ou em transição");
      return;
    }

    console.log('Attempting to start speech recognition. Current state:', { listening, isTransitioning });
    
    try {
      setError(null);
      setInterimTranscript("");
      setIsTransitioning(true);
      
      // Se já está ouvindo, para primeiro e aguarda completar
      if (listening) {
        console.log('Currently listening, stopping first...');
        recRef.current.stop();
        
        // Aguardar o evento onend ser disparado
        const waitForStop = () => {
          if (!listening && !isTransitioning) {
            console.log('Successfully stopped, starting again...');
            recRef.current?.start();
          } else {
            setTimeout(waitForStop, 50);
          }
        };
        setTimeout(waitForStop, 100);
      } else {
        console.log('Not currently listening, starting directly...');
        recRef.current.start();
      }
    } catch (err) {
      setError("Erro ao iniciar reconhecimento de voz");
      setIsTransitioning(false);
      console.error('Error starting speech recognition:', err);
    }
  }, [isSupported, listening, isTransitioning]);

  const stop = useCallback(() => {
    console.log('Attempting to stop speech recognition');
    setIsTransitioning(true);
    
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        setIsTransitioning(false);
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
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