import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Paperclip, Trash2, MessageSquare, Plus, X, Download, Volume2, VolumeX, Menu, ArrowLeft, Zap, Mic, Square } from "lucide-react";
import { AudioPlayer } from '@/components/AudioPlayer';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import ReactMarkdown from "react-markdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAccessControl } from "@/hooks/useAccessControl";
import InlineWordUnderlineOverlay from "@/components/InlineWordUnderlineOverlay";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachedFiles?: AttachedFile[];
  tokensConsumed?: number;
  audioUrl?: string;
}

interface AttachedFile {
  name: string;
  type: string;
  data: string;
  size: number;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

export default function Chat() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [readingMsgId, setReadingMsgId] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  
  // Estado para áudios salvos de cada mensagem (7 dias de cache)
  const [messageAudios, setMessageAudios] = useState<Map<string, { audioUrl: string; text: string }>>(new Map());
  const [pendingShowHistory, setPendingShowHistory] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  
  const { user, profile, refreshProfile } = useAuth();
  const access = useAccessControl();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);
  const { visible: menuVisible } = useScrollDirection();
  const isMobile = useIsMobile();
  const messageContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [pendingNewSession, setPendingNewSession] = useState(false);
  const { formatDateInUserTimezone } = useUserTimezone();
  
  // Audio Recorder
  const audioRecorder = useAudioRecorder("pt-BR");

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Inicializar parâmetros da URL (mostrar histórico no mobile e abrir sessão específica)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showHistory = urlParams.get('show-history');
    const sessionParam = urlParams.get('session');
    const messageParam = urlParams.get('msg');
    const newParam = urlParams.get('new');

    if (showHistory === 'true') {
      setPendingShowHistory(true);
    }
    if (sessionParam) {
      setPendingSessionId(sessionParam);
    }
    if (messageParam) {
      setPendingMessageId(messageParam);
    }
    if (newParam === 'true' || newParam === '1') {
      setPendingNewSession(true);
    }

    // Limpar os parâmetros da URL após capturar intenções
    if (window.location.search) {
      window.history.replaceState({}, '', '/chat');
    }
  }, []);

  // Abrir histórico no mobile assim que a info e o estado de mobile estiverem prontos
  useEffect(() => {
    if (pendingShowHistory && isMobile) {
      setSidebarOpen(true);
      setPendingShowHistory(false);
    }
  }, [pendingShowHistory, isMobile]);

  // Criar nova conversa quando solicitado via URL
  useEffect(() => {
    if (pendingNewSession) {
      createNewSession();
      setPendingNewSession(false);
    }
  }, [pendingNewSession]);
  // Scroll automático para a última mensagem
  // Scroll automático para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar sessões do usuário
  useEffect(() => {
    if (user?.id) {
      loadChatSessions();
    }
  }, [user?.id]);

  const loadChatSessions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('query_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }); // Ordem crescente para montar conversa cronologicamente

      if (error) throw error;

      // Agrupar mensagens por session_id para formar conversas completas
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach((query) => {
        const sessionId = query.session_id || query.id;
        
        // Criar sessão se não existir
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            id: sessionId,
            title: query.prompt_text.substring(0, 50) + (query.prompt_text.length > 50 ? "..." : ""),
            lastMessage: "",
            timestamp: new Date(query.created_at),
            messages: []
          });
        }

        const session = sessionMap.get(sessionId)!;
        
        // Adicionar mensagem do usuário (sempre presente)
        session.messages.push({
          id: `${query.id}-user`,
          type: 'user',
          content: query.prompt_text,
          timestamp: new Date(query.created_at),
          attachedFiles: Array.isArray(query.attached_files) ? (query.attached_files as unknown as AttachedFile[]) : []
        });

        // Adicionar resposta da IA (se existir)
        if (query.response_text) {
          session.messages.push({
            id: `${query.id}-assistant`,
            type: 'assistant',
            content: query.response_text,
            timestamp: new Date(query.created_at),
            tokensConsumed: query.credits_consumed ? query.credits_consumed * 1000 : undefined
          });
        }
        
        // Atualizar informações da sessão com dados mais recentes
        session.lastMessage = query.response_text ? 
          query.response_text.substring(0, 100) + (query.response_text.length > 100 ? "..." : "") :
          query.prompt_text.substring(0, 100) + (query.prompt_text.length > 100 ? "..." : "");
        
        // Usar o timestamp mais recente
        if (new Date(query.created_at) > session.timestamp) {
          session.timestamp = new Date(query.created_at);
        }
      });

      const sessionsArray = Array.from(sessionMap.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Atualizar as sessões históricas
      setSessions(prev => {
        // Quando ainda não há sessões na memória e nenhuma sessão selecionada
        if (prev.length === 0 && !currentSessionId) {
          if (sessionsArray.length > 0) {
            // Se já existem conversas históricas, usar a correta (pendente) ou a mais recente
            const targetId = (pendingSessionId && sessionsArray.find(s => s.id === pendingSessionId))
              ? pendingSessionId
              : sessionsArray[0].id;
            setCurrentSessionId(targetId);
            return [...sessionsArray];
          }
          
          // Só cria uma nova conversa vazia se não houver histórico e não houver intenção pendente
          if (!pendingSessionId && !pendingNewSession) {
            const newSessionId = crypto.randomUUID();
            const newSession: ChatSession = {
              id: newSessionId,
              title: "Nova Conversa",
              lastMessage: "",
              timestamp: new Date(),
              messages: []
            };
            setCurrentSessionId(newSessionId);
            return [newSession];
          }
        }
        
        // Manter sessões existentes e adicionar históricas que não existem
        const existingIds = new Set(prev.map(s => s.id));
        const newSessions = sessionsArray.filter(s => !existingIds.has(s.id));
        const merged = [...prev, ...newSessions];
        
        // Se ainda não há sessão selecionada e não há intenção pendente, selecionar a primeira disponível
        if (!currentSessionId && !pendingSessionId && !pendingNewSession && merged.length > 0) {
          setCurrentSessionId(merged[0].id);
        }
        
        return merged;
      });
      
      // Sistema simples de cache só para a sessão atual
      const savedAudios = new Map<string, { audioUrl: string; text: string }>();
      setMessageAudios(savedAudios);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  // Após carregar/atualizar sessões, selecionar a sessão passada pela URL, se houver
  useEffect(() => {
    if (pendingSessionId) {
      setCurrentSessionId(pendingSessionId);
      setPendingSessionId(null);
      if (isMobile) setSidebarOpen(false);
    }
  }, [pendingSessionId, sessions.length, isMobile]);

  // Se veio um msg=<id> na URL, rolar até a mensagem correspondente quando pronta
  useEffect(() => {
    if (!pendingMessageId) return;
    const keysToTry = [
      `${pendingMessageId}-assistant`,
      `${pendingMessageId}-user`
    ];
    const target = keysToTry.map(k => messageContainerRefs.current[k]).find(Boolean);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPendingMessageId(null);
    }
  }, [messages.length, currentSessionId, pendingMessageId]);

  // Sync transcript with message input
  useEffect(() => {
    if (audioRecorder.isRecording) {
      const processedText = audioRecorder.processTextChange(message);
      if (processedText !== message) {
        setMessage(processedText);
      }
    }
  }, [audioRecorder.transcript, audioRecorder.interimTranscript, audioRecorder.isRecording]);

  // Handle audio recorder errors
  useEffect(() => {
    if (audioRecorder.error) {
      toast({
        title: "Erro no reconhecimento de voz",
        description: audioRecorder.error,
        variant: "destructive"
      });
    }
  }, [audioRecorder.error, toast]);

  // Atalho de teclado para microfone (Ctrl+M ou Cmd+M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleSpeechToggle();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [audioRecorder.isRecording, audioRecorder.isPaused, message]);

  const handleSpeechToggle = () => {
    try {
      if (audioRecorder.isRecording) {
        // Parar a gravação
        audioRecorder.stopRecording();
        
        toast({
          title: "Gravação parada",
          description: "Você pode editar o texto e clicar no microfone novamente para continuar.",
        });
      } else if (audioRecorder.isPaused) {
        // Retomar gravação
        audioRecorder.resumeRecording(message);
        
        toast({
          title: "Gravação retomada",
          description: "Fale agora. O áudio será inserido na posição do cursor.",
        });
      } else {
        // Iniciar nova gravação
        if (!audioRecorder.isSupported) {
          toast({
            title: "Reconhecimento de voz não suportado",
            description: "Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge.",
            variant: "destructive"
          });
          return;
        }
        
        audioRecorder.startRecording(message);
        
        toast({
          title: "Gravação iniciada",
          description: "Fale agora. O áudio será inserido na posição do cursor.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na gravação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };
  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('query_history')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        setCurrentSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null);
      }

      toast({
        title: "Conversa excluída",
        description: "A conversa foi removida com sucesso."
      });
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a conversa.",
        variant: "destructive"
      });
    }
  };

  const createNewSession = () => {
    const newSessionId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      title: "Nova Conversa",
      lastMessage: "",
      timestamp: new Date(),
      messages: []
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSessionId);
    
    // Limpar o campo de mensagem e anexos
    setMessage("");
    setAttachedFiles([]);
    
    // Limpar gravação de voz se existir
    audioRecorder.resetRecording();
    
    // Fechar sidebar no mobile após criar nova sessão
    if (isMobile) {
      setSidebarOpen(false);
    }
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 10MB.`,
          variant: "destructive"
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: AttachedFile = {
          name: file.name,
          type: file.type,
          data: e.target?.result as string,
          size: file.size
        };
        
        setAttachedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && attachedFiles.length === 0) {
      toast({
        title: "Mensagem vazia",
        description: "Digite uma mensagem ou anexe um arquivo.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para usar o chat.",
        variant: "destructive"
      });
      return;
    }

    // Verificar tokens disponíveis
    const totalTokens = (profile?.token_balance || 0) + (profile?.plan_tokens || 0);
    if (totalTokens < 1000) {
      toast({
        title: "Tokens insuficientes",
        description: "Você precisa de pelo menos 1.000 tokens para usar o chat.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Garantir que existe uma sessão ativa
      let sessionId = currentSessionId;
      if (!sessionId) {
        // Se não há sessão atual, criar uma nova
        sessionId = crypto.randomUUID();
        setCurrentSessionId(sessionId);
        
        const newSession: ChatSession = {
          id: sessionId,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          lastMessage: "",
          timestamp: new Date(),
          messages: []
        };
        setSessions(prev => [newSession, ...prev]);
      }

      // Adicionar mensagem do usuário à sessão atual
      const userMessage: Message = {
        id: crypto.randomUUID(),
        type: 'user',
        content: message,
        timestamp: new Date(),
        attachedFiles: attachedFiles.length > 0 ? [...attachedFiles] : undefined
      };

      // Atualizar a sessão atual com a nova mensagem
      setSessions(prev => {
        const updatedSessions = [...prev];
        const sessionIndex = updatedSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex >= 0) {
          updatedSessions[sessionIndex].messages.push(userMessage);
          updatedSessions[sessionIndex].lastMessage = message.substring(0, 100) + (message.length > 100 ? "..." : "");
          updatedSessions[sessionIndex].timestamp = new Date();
          
          // Atualizar título apenas se for a primeira mensagem
          if (updatedSessions[sessionIndex].title === "Nova Conversa" || updatedSessions[sessionIndex].messages.length === 1) {
            updatedSessions[sessionIndex].title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
          }
          
          // Mover a sessão para o topo da lista (conversa mais recente)
          const currentSession = updatedSessions[sessionIndex];
          updatedSessions.splice(sessionIndex, 1);
          updatedSessions.unshift(currentSession);
        }
        return updatedSessions;
      });

      // Chamar a API passando o sessionId para continuar a conversa
      const { data, error } = await supabase.functions.invoke('legal-ai-chat', {
        body: {
          message,
          userId: user.id,
          sessionId: sessionId, // Enviar o session_id atual para continuar a conversa
          attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Adicionar resposta da IA
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        tokensConsumed: data.tokensConsumed || data.totalTokens
      };

      setSessions(prev => {
        const updatedSessions = [...prev];
        const sessionIndex = updatedSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex >= 0) {
          updatedSessions[sessionIndex].messages.push(assistantMessage);
          updatedSessions[sessionIndex].lastMessage = data.response.substring(0, 100) + "...";
        }
        return updatedSessions;
      });

      // Atualizar perfil para mostrar tokens atualizados
      await refreshProfile();

      // Limpar formulário
      setMessage("");
      setAttachedFiles([]);
      audioRecorder.resetRecording(); // Limpar gravação

      toast({
        title: "Resposta recebida!",
        description: `${data.tokensConsumed || data.totalTokens || 0} tokens utilizados.`
      });

    } catch (error: any) {
      console.error('Erro no chat:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar sua mensagem.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAudioToStorage = async (textHash: string, audioBlob: Blob) => {
    try {
      if (!user?.id) return null;
      
      const fileName = `${user.id}/audio_${textHash}.mp3`;
      const { data, error } = await supabase.storage
        .from('audio-cache')
        .upload(fileName, audioBlob, {
          upsert: true,
          contentType: 'audio/mpeg'
        });
      
      if (error) {
        console.log('Erro ao salvar áudio no storage:', error);
        return null;
      }
      
      return fileName;
    } catch (error) {
      console.log('Erro ao salvar áudio:', error);
      return null;
    }
  };

  const loadAudioFromStorage = async (textHash: string) => {
    try {
      if (!user?.id) return null;
      
      const fileName = `${user.id}/audio_${textHash}.mp3`;
      const { data, error } = await supabase.storage
        .from('audio-cache')
        .download(fileName);
      
      if (error) {
        return null;
      }
      
      return URL.createObjectURL(data);
    } catch (error) {
      return null;
    }
  };

  const clearOldAudioCache = () => {
    try {
      const keys = Object.keys(localStorage);
      const audioCacheKeys = keys.filter(key => key.startsWith('audio_cache_'));
      
      // Se temos muitos caches de áudio, remover os mais antigos
      if (audioCacheKeys.length > 5) {
        const cacheData = audioCacheKeys.map(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            return { key, createdAt: data.createdAt || 0 };
          } catch {
            return { key, createdAt: 0 };
          }
        }).sort((a, b) => a.createdAt - b.createdAt);
        
        // Remover os 3 mais antigos
        cacheData.slice(0, 3).forEach(item => {
          localStorage.removeItem(item.key);
        });
      }
    } catch (error) {
      console.log('Erro ao limpar cache antigo:', error);
    }
  };

  const playTextToSpeech = async (id: string, text: string) => {
    try {
      setTtsLoading(true);
      setReadingMsgId(id);
      setReadingProgress(0);

      // Verificar cache primeiro usando hash do texto
      const textToProcess = text.substring(0, 4000);
      // Usar função de hash que funciona com Unicode
      const textHash = textToProcess.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a; // Convert to 32bit integer
      }, 0).toString(36).replace('-', '0').substring(0, 20);
      
      let audioUrl: string;
      let tokensUsed = 0;
      let usedCache = false;
      
      // 1. Primeiro tentar carregar do Supabase Storage
      audioUrl = await loadAudioFromStorage(textHash);
      if (audioUrl) {
        usedCache = true;
        toast({
          title: "Áudio carregado",
          description: "Áudio carregado do armazenamento (sem cobrança de tokens)",
        });
      }
      
      // 2. Se não encontrou no Storage, tentar localStorage
      if (!audioUrl) {
        const cacheKey = `audio_cache_${textHash}_alloy`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            const audioData = JSON.parse(cached);
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - audioData.createdAt < sevenDays && audioData.blobData) {
              // Sempre recriar o blob URL a partir dos dados salvos
              const audioBlob = new Blob([
                Uint8Array.from(atob(audioData.blobData), c => c.charCodeAt(0))
              ], { type: 'audio/mpeg' });
              audioUrl = URL.createObjectURL(audioBlob);
              usedCache = true;
              
              toast({
                title: "Áudio carregado",
                description: "Áudio carregado do cache local (sem cobrança de tokens)",
              });
            } else {
              localStorage.removeItem(cacheKey);
            }
          } catch (e) {
            console.error('Erro ao processar cache de áudio:', e);
            localStorage.removeItem(cacheKey);
          }
        }
      }
      
      // 3. Se não conseguiu usar nenhum cache, gerar novo áudio
      if (!audioUrl) {
        const { data, error } = await supabase.functions.invoke('text-to-speech', {
          body: {
            text: textToProcess,
            voice: 'alloy',
            speed: 1.0
          }
        });

        if (error) {
          console.error('Erro na função text-to-speech:', error);
          throw new Error(error.message || 'Erro ao gerar áudio');
        }

        if (!data?.audioContent) {
          throw new Error('Nenhum conteúdo de áudio retornado');
        }

        // Converter base64 para blob e criar URL
        const audioBlob = new Blob([
          Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
        ], { type: 'audio/mpeg' });
        
        audioUrl = URL.createObjectURL(audioBlob);
        tokensUsed = data.tokensUsed || Math.ceil(textToProcess.length / 4);
        
        // Salvar no Supabase Storage para persistência
        await saveAudioToStorage(textHash, audioBlob);
        
        // Tentar salvar também no localStorage como backup (sem bloquear em caso de quota)
        try {
          clearOldAudioCache();
          
          const audioData = {
            text: textToProcess,
            audioUrl,
            textHash,
            voice: 'alloy',
            createdAt: Date.now()
          };
          
          localStorage.setItem(`audio_cache_${textHash}_alloy`, JSON.stringify(audioData));
        } catch (quotaError) {
          console.log('Não foi possível salvar no localStorage (quota excedida), mas áudio foi salvo no servidor.');
        }
        
        toast({
          title: "Áudio gerado!",
          description: `${tokensUsed} tokens utilizados para síntese de voz.`
        });
      }
      
      // Adicionar o áudio à mensagem correspondente na sessão atual
      setSessions(prev => {
        const updatedSessions = [...prev];
        const sessionIndex = updatedSessions.findIndex(s => s.id === currentSessionId);
        if (sessionIndex >= 0) {
          const updatedMessages = [...updatedSessions[sessionIndex].messages];
          const messageIndex = updatedMessages.findIndex(msg => msg.id === id);
          if (messageIndex >= 0) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              audioUrl: audioUrl
            };
            updatedSessions[sessionIndex].messages = updatedMessages;
          }
        }
        return updatedSessions;
      });
      
      // Adicionar também ao estado de áudios salvos
      setMessageAudios(prev => new Map(prev.set(id, { audioUrl, text: textToProcess })));
    } catch (error: any) {
      console.error('Erro no text-to-speech:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar áudio.",
        variant: "destructive"
      });
    } finally {
      setTtsLoading(false);
    }
  };

  const exportChat = () => {
    if (!currentSession) return;

    const chatContent = currentSession.messages.map(msg => 
      `[${msg.type.toUpperCase()}] ${formatDateInUserTimezone(msg.timestamp, 'dd/MM/yyyy HH:mm:ss')}\n${msg.content}\n\n`
    ).join('');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${currentSession.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalTokens = (profile?.token_balance || 0) + (profile?.plan_tokens || 0);

  // Verificar acesso e mostrar modal apenas se necessário
  const shouldShowAccessDialog = !access.canUseChat && user && profile;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden relative">
      {/* Modal de Acesso Restrito */}
      {shouldShowAccessDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle>Acesso Restrito</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Para usar o Chat, ative sua assinatura.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate('/comprar-creditos?reason=blocked&gate=chat')}
              >
                Ir para Assinatura
              </Button>
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Menu fixo no topo para mobile */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700 p-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-white"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              title="Voltar ao Dashboard"
            >
              <img 
                src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" 
                alt="Oráculo Jurídico"
                className="h-6 w-auto"
              />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-700/60 rounded-lg px-3 py-1.5">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm text-white">{Math.floor(totalTokens).toLocaleString()}</span>
                <span className="text-xs text-slate-300">tokens</span>
              </div>
              <UserMenu hideOptions={["chat"]} />
            </div>
          </div>
        </div>
      )}

      {/* Menu flutuante - apenas desktop */}

      {/* Overlay para mobile quando sidebar está aberta */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Histórico de Conversas */}
      <div className={`${
        isMobile 
          ? `fixed left-0 top-0 h-full w-80 bg-slate-800 border-r border-slate-700 z-50 transform transition-transform duration-300 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`
          : 'w-80 bg-slate-800/50 border-r border-slate-700'
      } flex flex-col`}>
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-slate-700">
          {isMobile && (
            <div className="mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-white"
                aria-label="Fechar histórico"
                title="Fechar histórico"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          )}
          
          <Button 
            onClick={createNewSession}
            className="w-full bg-primary hover:bg-primary/90 mb-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Conversa
          </Button>

          {/* Contador de Tokens */}
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Tokens Disponíveis</span>
              <Badge variant="outline" className="text-primary border-primary/30">
                {Math.floor(totalTokens).toLocaleString()}
              </Badge>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (totalTokens / 100000) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Custo variável por consulta
            </p>
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  Nenhuma conversa ainda.
                  <br />
                  Comece uma nova!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                      currentSessionId === session.id
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-slate-700/30 hover:bg-slate-700/50'
                    }`}
                    onClick={() => {
                      setCurrentSessionId(session.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">
                          {session.title}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {session.lastMessage}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDateInUserTimezone(session.timestamp, 'dd/MM/yyyy')}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`ml-2 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'} h-8 w-8 p-0`}
                        title="Excluir conversa"
                        aria-label="Excluir conversa"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMobile) {
                            const ok = window.confirm('Deseja excluir esta conversa?');
                            if (!ok) return;
                          }
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área Principal do Chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${isMobile ? 'pt-16' : ''}`}>
        {/* Header do Chat - apenas desktop */}
        {!isMobile && (
          <div className="bg-slate-800/50 border-b border-slate-700 p-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Voltar ao Dashboard"
              >
                <img 
                  src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" 
                  alt="Oráculo Jurídico"
                  className="h-8 w-auto"
                />
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-1.5">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm text-white">{Math.floor(totalTokens).toLocaleString()}</span>
                  <span className="text-xs text-slate-300">tokens</span>
                </div>
                <UserMenu hideOptions={["chat"]} />
              </div>
            </div>
          </div>
        )}

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto bg-slate-900/30">
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className={`text-center ${isMobile ? 'py-8 px-4' : 'py-12'}`}>
                    <MessageSquare className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-slate-500 mx-auto mb-4`} />
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white mb-2`}>
                      Bem-vindo ao Oráculo Jurídico
                    </h3>
                    <p className={`text-slate-400 mx-auto ${isMobile ? 'text-xs max-w-xs' : 'text-sm max-w-md'}`}>
                      Faça suas perguntas jurídicas e receba respostas fundamentadas 
                      na legislação brasileira. Você pode anexar documentos para análise.
                    </p>
                    
                    {/* Botão para iniciar consulta - mobile */}
                    {isMobile && (
                      <Button
                        onClick={() => {
                          document.querySelector('textarea')?.focus();
                        }}
                        className="mt-6 bg-primary hover:bg-primary/90 px-8 py-3"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Iniciar Consulta
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-4 ${
                            msg.type === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-slate-800 text-white border border-slate-700'
                          }`}
                        >
                          {/* Arquivos anexados */}
                          {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                            <div className="mb-3 space-y-2">
                              {msg.attachedFiles.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs bg-black/20 rounded p-2">
                                  <Paperclip className="w-3 h-3" />
                                  <span className="truncate">{file.name}</span>
                                  <span className="text-xs opacity-70">
                                    ({(file.size / 1024).toFixed(1)}KB)
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Conteúdo da mensagem */}
                          <div
                            className="relative prose prose-invert max-w-none text-sm leading-7"
                            ref={(el) => {
                              messageContainerRefs.current[msg.id] = el as HTMLDivElement | null;
                            }}
                          >
                            {msg.type === 'assistant' ? (
                              <>
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-3 last:mb-0 break-words">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc ml-4 mb-3">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal ml-4 mb-3">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                    h1: ({ children }) => <h1 className="text-base font-bold mb-3">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-sm font-bold mb-2">{children}</h3>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    code: ({ children }) => <code className="bg-slate-700 px-1 py-0.5 rounded text-xs break-all">{children}</code>,
                                    pre: ({ children }) => <pre className="bg-slate-700 p-3 rounded overflow-x-auto text-xs">{children}</pre>
                                  }}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              </>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                          </div>

                          {/* Player de áudio - exibir se houver áudio salvo ou no cache */}
                          {(msg.audioUrl || messageAudios.has(msg.id)) && (
                            <div className="mt-3 border-t border-current/20 pt-3">
                              <div className="flex items-center gap-2 mb-2 text-xs text-current/70">
                                <Volume2 className="w-3 h-3" />
                                <span>Resposta em áudio</span>
                              </div>
                              <AudioPlayer
                                audioSrc={msg.audioUrl || messageAudios.get(msg.id)?.audioUrl || ''}
                                onProgress={(_, __, percent, isPlaying) => {
                                  if (readingMsgId === msg.id) setReadingProgress(percent);
                                  if (!isPlaying && readingMsgId === msg.id && percent >= 0.99) {
                                    setReadingProgress(1);
                                  }
                                }}
                                onPlayChange={(playing) => {
                                  setIsPlayingAudio(playing);
                                  if (playing) {
                                    setReadingMsgId(msg.id);
                                  } else if (readingMsgId === msg.id) {
                                    setReadingProgress(0);
                                  }
                                }}
                                onLoadingChange={setTtsLoading}
                              />
                            </div>
                          )}

                          {/* Footer da mensagem */}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/20">
                            <span className="text-xs opacity-70">
                              {formatDateInUserTimezone(msg.timestamp, 'HH:mm')}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {msg.tokensConsumed && (
                                <Badge variant="secondary" className="text-xs">
                                  {msg.tokensConsumed.toLocaleString()} tokens
                                </Badge>
                              )}
                              
                              {/* Só mostrar botão se não houver áudio salvo */}
                              {msg.type === 'assistant' && !msg.audioUrl && !messageAudios.has(msg.id) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                  onClick={() => playTextToSpeech(msg.id, msg.content)}
                                  title="Gerar áudio desta resposta"
                                >
                                  {ttsLoading && readingMsgId === msg.id ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Volume2 className="w-3 h-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Indicador de digitação */}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] bg-slate-800 text-white border border-slate-700 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-sm text-slate-300">Oráculo está formulando a resposta...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Área de Input - Fixada na parte inferior */}
        <div className={`bg-slate-800/50 border-t border-slate-700 p-4 flex-shrink-0 ${isMobile ? 'pb-safe' : ''}`}>
          <div className="max-w-4xl mx-auto">
            {/* Arquivos anexados */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-white truncate max-w-32">
                      {file.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({(file.size / 1024).toFixed(1)}KB)
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-slate-400 hover:text-white"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulário de envio */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3 items-end">
                {/* Área de texto com botões secundários dentro */}
                <div className="flex-1 relative">
                  <Textarea
                    ref={audioRecorder.textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={audioRecorder.isRecording ? "Escutando... Fale agora!" : "Digite sua pergunta aqui..."}
                    className={`${
                      isMobile ? 'min-h-[80px] max-h-[200px] pb-12' : 'min-h-[100px] max-h-[200px] pb-14'
                    } bg-slate-700 border-slate-600 focus:border-primary resize-none pr-4 pl-4 pt-4`}
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgb(71 85 105) transparent'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  
                  {/* Botões secundários dentro da textarea */}
                  <div className={`absolute ${isMobile ? 'bottom-2 left-3' : 'bottom-3 left-4'} flex gap-2`}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600/50"
                      title="Anexar arquivo"
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    
                    {/* Botão de microfone */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSpeechToggle}
                      className={`h-8 w-8 p-0 ${
                        audioRecorder.isRecording 
                          ? 'text-red-400 hover:text-red-300 animate-pulse' 
                          : audioRecorder.isPaused
                            ? 'text-orange-400 hover:text-orange-300'
                            : 'text-slate-400 hover:text-white hover:bg-slate-600/50'
                      }`}
                      title={audioRecorder.isRecording ? "Parar gravação" : audioRecorder.isPaused ? "Retomar gravação" : "Falar (reconhecimento de voz)"}
                      disabled={isLoading}
                    >
                      {audioRecorder.isRecording ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Botão de enviar - proeminente */}
                <Button
                  type="submit"
                  disabled={isLoading || (!message.trim() && attachedFiles.length === 0)}
                  className={`bg-primary hover:bg-primary/90 ${
                    isMobile ? 'h-12 w-12 p-0' : 'h-14 w-14 p-0'
                  } flex-shrink-0`}
                  title="Enviar mensagem"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Status da gravação */}
              {(audioRecorder.isRecording || audioRecorder.isPaused) && (
                <div className={`flex items-center gap-2 text-xs ${
                  audioRecorder.isRecording ? 'text-red-400' : 'text-orange-400'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    audioRecorder.isRecording ? 'bg-red-400 animate-pulse' : 'bg-orange-400'
                  }`} />
                  <span>
                    {audioRecorder.isRecording 
                      ? 'Gravando... Fale agora ou clique no microfone para parar'
                      : 'Gravação pausada. Clique no microfone para continuar ou digite com o teclado'
                    }
                  </span>
                  <span className="text-slate-500">(Ctrl+M para alternar)</span>
                </div>
              )}

              {/* Informações de tokens */}
              <div className={`flex items-center justify-between text-xs text-slate-400 ${
                isMobile ? 'flex-col gap-1' : ''
              }`}>
                <div className="flex items-center gap-4">
                  <span>💰 {Math.floor(totalTokens).toLocaleString()} tokens</span>
                  <span>(custo variável por consulta)</span>
                </div>
                {!isMobile && <span>Shift + Enter para nova linha</span>}
              </div>
            </form>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}