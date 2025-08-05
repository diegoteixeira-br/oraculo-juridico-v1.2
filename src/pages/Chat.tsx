import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Paperclip, Trash2, MessageSquare, Plus, X, Download, Volume2, VolumeX, Menu, ArrowLeft } from "lucide-react";
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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { visible: menuVisible } = useScrollDirection();
  const isMobile = useIsMobile();

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Verificar se deve criar nova conversa ou mostrar histórico
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showHistory = urlParams.get('show-history');
    const newChat = urlParams.get('new');
    
    if (newChat === 'true') {
      // Criar nova conversa
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
      
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', '/chat');
    } else if (showHistory === 'true' && isMobile) {
      setSidebarOpen(true);
      // Limpar o parâmetro da URL
      window.history.replaceState({}, '', '/chat');
    }
  }, [isMobile]);
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Agrupar mensagens por session_id e evitar duplicação
      const sessionMap = new Map<string, ChatSession>();
      
      data?.forEach((query) => {
        const sessionId = query.session_id || query.id;
        
        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            id: sessionId,
            title: query.prompt_text.substring(0, 50) + (query.prompt_text.length > 50 ? "..." : ""),
            lastMessage: query.response_text || query.prompt_text,
            timestamp: new Date(query.created_at),
            messages: []
          });
        }

        const session = sessionMap.get(sessionId)!;
        
        // Verificar se já existe uma mensagem do usuário para evitar duplicação
        const userMessageExists = session.messages.some(msg => 
          msg.type === 'user' && msg.content === query.prompt_text
        );
        
        if (!userMessageExists) {
          // Adicionar mensagem do usuário
          session.messages.push({
            id: `${query.id}-user`,
            type: 'user',
            content: query.prompt_text,
            timestamp: new Date(query.created_at),
            attachedFiles: Array.isArray(query.attached_files) ? (query.attached_files as unknown as AttachedFile[]) : []
          });

          // Adicionar resposta da IA se existir
          if (query.response_text) {
            session.messages.push({
              id: `${query.id}-assistant`,
              type: 'assistant',
              content: query.response_text,
              timestamp: new Date(query.created_at),
              tokensConsumed: query.credits_consumed ? query.credits_consumed * 1000 : undefined
            });
          }
        }
      });

      const sessionsArray = Array.from(sessionMap.values())
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setSessions(sessionsArray);
      
      // Se não há sessão atual, selecionar a primeira
      if (!currentSessionId && sessionsArray.length > 0) {
        setCurrentSessionId(sessionsArray[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
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
    
    // Fechar sidebar no mobile após criar nova sessão
    if (isMobile) {
      setSidebarOpen(false);
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
    const totalTokens = (profile?.daily_tokens || 0) + (profile?.plan_tokens || 0);
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
      // Criar nova sessão se necessário
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        setCurrentSessionId(sessionId);
      }

      // Adicionar mensagem do usuário imediatamente
      const userMessage: Message = {
        id: crypto.randomUUID(),
        type: 'user',
        content: message,
        timestamp: new Date(),
        attachedFiles: attachedFiles.length > 0 ? [...attachedFiles] : undefined
      };

      // Atualizar sessão atual ou criar nova
      setSessions(prev => {
        const existingSessionIndex = prev.findIndex(s => s.id === sessionId);
        if (existingSessionIndex >= 0) {
          const updatedSessions = [...prev];
          updatedSessions[existingSessionIndex].messages.push(userMessage);
          updatedSessions[existingSessionIndex].lastMessage = message;
          updatedSessions[existingSessionIndex].timestamp = new Date();
          // Atualizar título se for a primeira mensagem
          if (updatedSessions[existingSessionIndex].title === "Nova Conversa") {
            updatedSessions[existingSessionIndex].title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
          }
          return updatedSessions;
        } else {
          const newSession: ChatSession = {
            id: sessionId!,
            title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
            lastMessage: message,
            timestamp: new Date(),
            messages: [userMessage]
          };
          return [newSession, ...prev];
        }
      });

      // Chamar a API
      const { data, error } = await supabase.functions.invoke('legal-ai-chat', {
        body: {
          message,
          userId: user.id,
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

  const playTextToSpeech = async (text: string) => {
    if (isPlayingAudio) {
      currentAudio?.pause();
      setCurrentAudio(null);
      setIsPlayingAudio(false);
      return;
    }

    try {
      setIsPlayingAudio(true);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: text.substring(0, 4000), // Limitar texto para evitar arquivos muito grandes
          voice: 'alloy',
          speed: 1.0
        }
      });

      if (error) throw error;

      // Converter base64 para blob e criar URL
      const audioBlob = new Blob([
        Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))
      ], { type: 'audio/mpeg' });
      
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Adicionar o áudio à última mensagem do assistente na sessão atual
      if (currentSession && messages.length > 0 && messages[messages.length - 1].type === 'assistant') {
        setSessions(prev => {
          const updatedSessions = [...prev];
          const sessionIndex = updatedSessions.findIndex(s => s.id === currentSessionId);
          if (sessionIndex >= 0) {
            const updatedMessages = [...updatedSessions[sessionIndex].messages];
            const lastMessageIndex = updatedMessages.length - 1;
            if (lastMessageIndex >= 0 && updatedMessages[lastMessageIndex].type === 'assistant') {
              updatedMessages[lastMessageIndex] = {
                ...updatedMessages[lastMessageIndex],
                audioUrl: audioUrl
              };
              updatedSessions[sessionIndex].messages = updatedMessages;
            }
          }
          return updatedSessions;
        });
      }
      
      toast({
        title: "Áudio gerado!",
        description: `${data.tokensUsed} tokens utilizados para síntese de voz.`
      });
      
    } catch (error: any) {
      console.error('Erro no text-to-speech:', error);
      setIsPlayingAudio(false);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar áudio.",
        variant: "destructive"
      });
    }
  };

  const exportChat = () => {
    if (!currentSession) return;

    const chatContent = currentSession.messages.map(msg => 
      `[${msg.type.toUpperCase()}] ${msg.timestamp.toLocaleString()}\n${msg.content}\n\n`
    ).join('');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${currentSession.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalTokens = (profile?.daily_tokens || 0) + (profile?.plan_tokens || 0);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex overflow-hidden relative">
      {/* Menu flutuante - apenas desktop */}
      {!isMobile && (
        <div className={`fixed top-0 right-0 z-50 p-4 transition-transform duration-300 ${
          menuVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <UserMenu hideOptions={["chat"]} />
        </div>
      )}

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
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <UserMenu hideOptions={["chat"]} />
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
                          {session.timestamp.toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header do Chat */}
        <div className="bg-slate-800/50 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-white"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              
              {/* Logo centralizada */}
              <div className="flex-1 flex justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="Voltar ao Dashboard"
                >
                  <img 
                    src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                    alt="Oráculo Jurídico" 
                    className="h-8 w-auto"
                  />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isMobile && <UserMenu hideOptions={["chat"]} />}
            </div>
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto bg-slate-900/30">
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Bem-vindo ao Oráculo Jurídico
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto text-sm">
                      Faça suas perguntas jurídicas e receba respostas fundamentadas 
                      na legislação brasileira. Você pode anexar documentos para análise.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
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
                        <div className="prose prose-invert max-w-none text-sm">
                          {msg.type === 'assistant' ? (
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
                          ) : (
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          )}
                        </div>

                        {/* Player de áudio se houver audioUrl */}
                        {msg.audioUrl && (
                          <div className="mt-3">
                            <AudioPlayer audioSrc={msg.audioUrl} />
                          </div>
                        )}

                        {/* Footer da mensagem */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-current/20">
                          <span className="text-xs opacity-70">
                            {msg.timestamp.toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {msg.tokensConsumed && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.tokensConsumed.toLocaleString()} tokens
                              </Badge>
                            )}
                            
                            {msg.type === 'assistant' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                                onClick={() => playTextToSpeech(msg.content)}
                              >
                                {isPlayingAudio ? (
                                  <VolumeX className="w-3 h-3" />
                                ) : (
                                  <Volume2 className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Área de Input - Fixada na parte inferior */}
        <div className="bg-slate-800/50 border-t border-slate-700 p-4 flex-shrink-0">
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
              <div className="flex gap-3">
                <div className="flex-1">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua pergunta aqui e pressione Enter..."
                    className={`${
                      isMobile ? 'min-h-[50px] max-h-24' : 'min-h-[60px] max-h-32'
                    } bg-slate-700 border-slate-600 focus:border-primary resize-none`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isLoading || (!message.trim() && attachedFiles.length === 0)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

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