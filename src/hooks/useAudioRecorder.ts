import { useState, useRef, useCallback } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';

interface AudioRecorderState {
  isRecording: boolean;
  hasText: boolean;
  cursorPosition: number;
  originalText: string;
}

export function useAudioRecorder(lang: string = "pt-BR") {
  const [audioState, setAudioState] = useState<AudioRecorderState>({
    isRecording: false,
    hasText: false,
    cursorPosition: 0,
    originalText: ''
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    listening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    start: startSpeech,
    stop: stopSpeech,
    reset: resetSpeech,
    setTranscript: updateTranscript
  } = useSpeechRecognition(lang);

  // Capturar posição atual do cursor e texto
  const captureCurrentState = useCallback((currentText: string) => {
    const cursorPos = textareaRef.current?.selectionStart || currentText.length;
    setAudioState(prev => ({
      ...prev,
      cursorPosition: cursorPos,
      originalText: currentText,
      hasText: currentText.length > 0
    }));
    return cursorPos;
  }, []);

  // Inserir texto na posição correta
  const insertTextAtCursor = useCallback((currentText: string, newTranscript: string, interim: string = '') => {
    const { cursorPosition, originalText } = audioState;
    
    const textBeforeCursor = originalText.substring(0, cursorPosition);
    const textAfterCursor = originalText.substring(cursorPosition);
    
    // Construir o novo texto inserindo na posição do cursor
    const finalText = textBeforeCursor + newTranscript + (interim ? ` ${interim}` : '') + textAfterCursor;
    
    // Calcular nova posição do cursor
    const newCursorPos = textBeforeCursor.length + newTranscript.length + (interim ? ` ${interim}`.length : 0);
    
    // Atualizar posição do cursor no DOM
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
    
    return finalText;
  }, [audioState]);

  // Iniciar gravação
  const startRecording = useCallback((currentText: string) => {
    if (!isSupported) {
      throw new Error('Reconhecimento de voz não suportado neste navegador');
    }

    // Capturar estado atual
    captureCurrentState(currentText);
    
    // Limpar transcript anterior
    resetSpeech();
    updateTranscript('');
    
    // Atualizar estado
    setAudioState(prev => ({
      ...prev,
      isRecording: true
    }));

    // Iniciar reconhecimento
    startSpeech();
  }, [isSupported, captureCurrentState, resetSpeech, updateTranscript, startSpeech]);

  // Parar gravação
  const stopRecording = useCallback(() => {
    stopSpeech();
    
    setAudioState(prev => ({
      ...prev,
      isRecording: false
    }));
  }, [stopSpeech]);

  // Retomar gravação (agora simplesmente inicia novamente)
  const resumeRecording = useCallback((currentText: string) => {
    return startRecording(currentText);
  }, [startRecording]);

  // Resetar completamente
  const resetRecording = useCallback(() => {
    stopSpeech();
    resetSpeech();
    
    setAudioState({
      isRecording: false,
      hasText: false,
      cursorPosition: 0,
      originalText: ''
    });
  }, [stopSpeech, resetSpeech]);

  // Processar mudanças no texto atual
  const processTextChange = useCallback((newText: string) => {
    if (audioState.isRecording && listening && (transcript || interimTranscript)) {
      return insertTextAtCursor(newText, transcript, interimTranscript);
    }
    return newText;
  }, [audioState.isRecording, listening, transcript, interimTranscript, insertTextAtCursor]);

  return {
    // Estados
    isRecording: audioState.isRecording,
    hasText: audioState.hasText,
    listening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    
    // Referências
    textareaRef,
    
    // Métodos
    startRecording,
    stopRecording,
    resumeRecording,
    resetRecording,
    processTextChange,
    
    // Status readable
    status: audioState.isRecording ? 'recording' : 'idle'
  };
}