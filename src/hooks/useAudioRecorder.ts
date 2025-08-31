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
    
    // Verificar se precisa adicionar espaço antes do novo texto
    const needsSpaceBefore = textBeforeCursor.length > 0 && 
                            !textBeforeCursor.endsWith(' ') && 
                            !textBeforeCursor.endsWith('\n') &&
                            newTranscript.length > 0 &&
                            !newTranscript.startsWith(' ');
    
    // Verificar se precisa adicionar espaço depois do texto interim
    const needsSpaceAfterInterim = interim.length > 0 && 
                                  textAfterCursor.length > 0 && 
                                  !textAfterCursor.startsWith(' ') &&
                                  !textAfterCursor.startsWith('\n') &&
                                  !interim.endsWith(' ');
    
    // Construir o novo texto com espaçamento correto
    const spaceBefore = needsSpaceBefore ? ' ' : '';
    const spaceAfterInterim = needsSpaceAfterInterim ? ' ' : '';
    const interimText = interim ? ` ${interim}${spaceAfterInterim}` : '';
    
    const finalText = textBeforeCursor + spaceBefore + newTranscript + interimText + textAfterCursor;
    
    // Calcular nova posição do cursor
    const newCursorPos = textBeforeCursor.length + spaceBefore.length + newTranscript.length + interimText.length;
    
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
    console.log('Starting audio recording');
    
    if (!isSupported) {
      throw new Error('Reconhecimento de voz não suportado neste navegador');
    }

    // Capturar estado atual sempre que iniciar
    const cursorPos = captureCurrentState(currentText);
    console.log('Captured state - cursor position:', cursorPos, 'text length:', currentText.length);
    
    // Garantir reset completo antes de iniciar
    resetSpeech();
    updateTranscript('');
    
    // Atualizar estado imediatamente para feedback visual
    setAudioState(prev => ({
      ...prev,
      isRecording: true
    }));
    
    // Delay maior para garantir que o reset foi processado completamente
    setTimeout(() => {
      console.log('Starting fresh speech recognition session');
      try {
        startSpeech();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setAudioState(prev => ({ ...prev, isRecording: false }));
      }
    }, 500);
  }, [isSupported, captureCurrentState, resetSpeech, updateTranscript, startSpeech]);

  // Parar gravação
  const stopRecording = useCallback(() => {
    console.log('Stopping audio recording');
    
    // Atualizar estado imediatamente para feedback visual rápido
    setAudioState(prev => ({
      ...prev,
      isRecording: false
    }));
    
    // Parar o reconhecimento
    stopSpeech();
    
    console.log('Audio recording stopped, ready for next session');
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