import { useState, useRef, useEffect } from "react";
import { MessageCircle, Settings, LogOut, Send, Bot, User, Clock, CreditCard, Paperclip, X, FileText, Image, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  attachedFiles?: AttachedFile[];
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
}

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, profile, signOut, useCredits, refreshProfile } = useAuth();
  const { toast } = useToast();

  const userName = profile?.full_name || user?.email || "Usuário";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Sistema de créditos
  const userCredits = profile?.credits || 0; // Créditos comprados
  const dailyCredits = profile?.daily_credits || 0; // Créditos diários
  const totalCredits = userCredits + dailyCredits; // Total disponível
  const costPerSearch = 1; // Custo por pesquisa

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;

    // Verificar se o usuário tem créditos suficientes
    if (totalCredits < costPerSearch) {
      toast({
        title: "Créditos insuficientes",
        description: "Você não tem créditos suficientes para realizar esta consulta. Compre mais créditos para continuar.",
        variant: "destructive",
      });
      navigate('/comprar-creditos');
      return;
    }

    // Criar nova sessão se não existir
    if (!currentSessionId) {
      const newSessionId = `session-${Date.now()}`;
      setCurrentSessionId(newSessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      attachedFiles: attachedFiles.length > 0 ? [...attachedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setAttachedFiles([]);
    setIsTyping(true);

    try {
      // Chamar o edge function que se conecta ao seu webhook
      const { data, error } = await supabase.functions.invoke('legal-ai-chat', {
        body: {
          message: userMessage.text,
          userId: user?.id,
          attachedFiles: userMessage.attachedFiles
        }
      });

      if (error) {
        console.error('Error calling legal AI:', error);
        throw new Error(error.message || 'Erro na comunicação com a IA');
      }

      // Verificar se há erro retornado pelo webhook
      if (data.error) {
        console.error('Webhook error details:', data);
        
        // Mensagens de erro mais específicas
        let errorDescription = data.error;
        
        if (data.webhookStatus === 401 || data.webhookStatus === 403) {
          errorDescription = "Erro de autorização com o servidor de IA. Entre em contato com o suporte.";
        } else if (data.webhookStatus === 404) {
          errorDescription = "Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.";
        } else if (data.webhookStatus >= 500) {
          errorDescription = "Erro interno do servidor de IA. Nossa equipe foi notificada.";
        } else if (data.error.includes('Authorization data is wrong')) {
          errorDescription = "Problema na configuração de acesso à IA. Entre em contato com o suporte.";
        }

        throw new Error(errorDescription);
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Resposta recebida da IA',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);

      // Salvar a conversa no histórico
      try {
        await supabase
          .from('query_history')
          .insert({
            user_id: user?.id,
            prompt_text: userMessage.text,
            response_text: aiResponse.text,
            credits_consumed: costPerSearch
          });
      } catch (historyError) {
        console.error('Erro ao salvar no histórico:', historyError);
      }

      // Atualizar o histórico local
      await loadChatHistory();

      // Atualizar os créditos após resposta bem-sucedida
      await refreshProfile();

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remover a mensagem do usuário em caso de erro
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
      
      toast({
        title: "Erro na consulta",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar sua consulta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleMyAccount = () => {
    navigate('/minha-conta');
  };

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Validar tipo de arquivo (PDFs e imagens)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Apenas PDFs e imagens (JPG, PNG, WEBP) são permitidos.",
          variant: "destructive",
        });
        return;
      }

      // Validar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 10MB.",
          variant: "destructive",
        });
        return;
      }

      const newFile: AttachedFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };

      setAttachedFiles(prev => [...prev, newFile]);
    });

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedFile = (fileId: string) => {
    setAttachedFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Carregar histórico de conversas
  useEffect(() => {
    loadChatHistory();
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('query_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Agrupar conversas por data e sessão
      const sessionsMap = new Map<string, ChatSession>();
      
      data?.forEach((query) => {
        const date = new Date(query.created_at);
        const dateStr = date.toLocaleDateString('pt-BR');
        const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        // Criar uma chave única para cada consulta individual
        const sessionKey = `${query.id}`;
        
        if (!sessionsMap.has(sessionKey)) {
          sessionsMap.set(sessionKey, {
            id: sessionKey,
            title: query.prompt_text.length > 40 ? 
              query.prompt_text.substring(0, 40) + '...' : 
              query.prompt_text,
            preview: query.response_text?.substring(0, 80) + '...' || 'Sem resposta',
            timestamp: date,
            messages: [
              {
                id: `user-${query.id}`,
                text: query.prompt_text,
                sender: 'user',
                timestamp: date
              },
              {
                id: `ai-${query.id}`,
                text: query.response_text || 'Sem resposta',
                sender: 'ai',
                timestamp: date
              }
            ]
          });
        }
      });

      // Ordenar sessões por timestamp (mais recente primeiro)
      const sessions = Array.from(sessionsMap.values()).sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
      );
      
      setChatSessions(sessions);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const createNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const loadChatSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
  };

  const AppSidebar = () => (
    <Sidebar className="w-64 md:w-64 w-full bg-slate-800 border-slate-700 flex flex-col">
      <SidebarHeader className="p-4">
        <img 
          src="/lovable-uploads/baf2f459-dae5-46d0-8e62-9d9247ec0b40.png" 
          alt="Oráculo Jurídico" 
          className="w-12 h-12 mx-auto"
        />
        
        {/* Novo Chat Button */}
        <Button
          onClick={createNewChat}
          className="w-full mt-4 flex items-center gap-2 bg-primary hover:bg-primary/90 text-sm"
        >
          <Plus className="w-4 h-4" />
          Nova Conversa
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="px-2 flex-1 flex flex-col">
        {/* Histórico de Conversas */}
        <div className="flex-1">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground">
            <History className="w-4 h-4" />
            Histórico
          </div>
          
          <ScrollArea className="h-full max-h-[calc(100vh-280px)]">
            <div className="space-y-1">
              {chatSessions.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Nenhuma conversa ainda
                </p>
              ) : (
                chatSessions.map((session) => (
                  <Button
                    key={session.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => loadChatSession(session)}
                    className={`w-full p-2 h-auto flex flex-col items-start text-left hover:bg-primary/10 ${
                      currentSessionId === session.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className="text-xs font-medium truncate w-full">
                      {session.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {session.timestamp.toLocaleDateString('pt-BR')}
                    </div>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Menu Principal - Fixo na parte inferior */}
        <div className="border-t border-slate-700 pt-2 mt-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleMyAccount}
                className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-primary hover:bg-primary/10 text-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Minha Conta</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-primary hover:bg-primary/10 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-lg md:text-xl font-semibold truncate">Oráculo Jurídico</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">Olá, {userName}!</span>
                <Avatar className="w-7 h-7 md:w-8 md:h-8">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-3 md:p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 max-w-2xl mx-auto px-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-semibold">Como posso te ajudar hoje?</h2>
                    <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
                      Sou sua IA de assistência jurídica. Faça uma pergunta sobre legislação, jurisprudência ou doutrina. 
                      Por exemplo: "Quais os requisitos da usucapião extraordinária segundo o Código Civil?"
                    </p>
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg max-w-md mx-auto">
                      <p className="text-xs md:text-sm text-primary">
                        💡 Você tem {totalCredits} créditos disponíveis 
                        {dailyCredits > 0 && `(${dailyCredits} diários + ${userCredits} comprados)`}. 
                        Cada pesquisa custa {costPerSearch} crédito.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] p-3 md:p-4 rounded-lg text-sm md:text-base ${
                          message.sender === 'user'
                            ? 'bg-secondary text-secondary-foreground'
                            : 'bg-slate-800 text-foreground'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.sender === 'ai' && (
                            <Bot className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                          )}
                           <div className="flex-1">
                             <p className="text-sm leading-relaxed">{message.text}</p>
                             
                             {/* Show attached files */}
                             {message.attachedFiles && message.attachedFiles.length > 0 && (
                               <div className="mt-2 space-y-2">
                                 {message.attachedFiles.map((file) => (
                                   <div key={file.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                                     {file.type.startsWith('image/') ? (
                                       <Image className="w-4 h-4 text-primary flex-shrink-0" />
                                     ) : (
                                       <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                                     )}
                                     <div className="flex-1 min-w-0">
                                       <p className="text-xs font-medium truncate">{file.name}</p>
                                       <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                             
                             <span className="text-xs text-muted-foreground mt-1 block">
                               {message.timestamp.toLocaleTimeString('pt-BR', {
                                 hour: '2-digit',
                                 minute: '2-digit'
                               })}
                             </span>
                           </div>
                          {message.sender === 'user' && (
                            <User className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="max-w-[70%] p-4 rounded-lg bg-slate-800 text-foreground">
                        <div className="flex items-start gap-2">
                          <Bot className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 md:p-6 border-t border-slate-700 bg-slate-800">
              {/* Attached Files Preview */}
              {attachedFiles.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-muted-foreground">Arquivos anexados:</p>
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file) => (
                      <div key={file.id} className="flex items-center gap-2 p-2 bg-background/50 rounded-md">
                        {file.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate max-w-24 md:max-w-32">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAttachedFile(file.id)}
                          className="h-6 w-6 p-0 hover:bg-destructive/20"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleFileAttachment}
                    disabled={isTyping}
                    className="p-2 h-12 md:h-16 border-slate-600 hover:border-primary"
                  >
                    <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
                
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta aqui e pressione Enter..."
                  className="flex-1 min-h-[48px] md:min-h-[60px] text-sm md:text-base resize-none bg-background border-slate-600 focus:border-primary"
                  disabled={isTyping}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isTyping}
                  className="btn-primary p-3 md:p-4 w-12 h-12 md:w-16 md:h-16 rounded-lg"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>

              {/* Credits Display - moved below text area */}
              <div className="flex items-center justify-between mt-4 p-2 md:p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-1 md:gap-2">
                  <CreditCard className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                  <Badge 
                    variant="default" 
                    className={`text-xs ${totalCredits > 10 ? 'bg-primary' : totalCredits > 0 ? 'bg-yellow-600' : 'bg-red-600'}`}
                  >
                    {totalCredits} créditos
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({costPerSearch} crédito/pesquisa)
                  </span>
                  {dailyCredits > 0 && (
                    <span className="text-xs text-green-400">
                      | {dailyCredits} diários
                    </span>
                  )}
                </div>
                {totalCredits < 10 && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate('/comprar-creditos')}
                    className="text-xs"
                  >
                    Comprar
                  </Button>
                )}
              </div>
              
              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,image/*"
                multiple
                className="hidden"
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
