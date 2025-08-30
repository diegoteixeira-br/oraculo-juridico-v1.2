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

export function useSpeechRecognition(lang: string = "pt-BR") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        setInterimTranscript("");
      } else {
        setInterimTranscript(interimText);
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
      setListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setListening(false);
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
    if (!recRef.current || !isSupported) {
      setError("Reconhecimento de voz não disponível");
      return;
    }

    try {
      setError(null);
      setInterimTranscript("");
      recRef.current.start();
    } catch (err) {
      setError("Erro ao iniciar reconhecimento de voz");
      console.error('Error starting speech recognition:', err);
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recRef.current) {
      recRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Forçar o reset do estado de listening
    setListening(false);
    setInterimTranscript("");
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