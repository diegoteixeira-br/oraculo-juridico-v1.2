import { useState, useRef, useEffect } from "react";
import { MessageCircle, Settings, LogOut, Send, Bot, User, Clock, CreditCard, History, Plus, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  messages: Message[];
}

const exampleQuestions = [
  "Quais os requisitos da usucapião extraordinária segundo o Código Civil?",
  "Como calcular o prazo prescricional para cobrança de honorários advocatícios?",
  "Qual a diferença entre danos morais e danos estéticos na jurisprudência do STJ?",
  "Quando é cabível a prisão civil por dívida alimentícia e quais os procedimentos?",
  "Quais os critérios para configuração do abandono de emprego na CLT?",
  "Como funciona a sucessão trabalhista em casos de terceirização?",
  "Qual o procedimento para execução de título extrajudicial no CPC/2015?",
  "Quando é possível a desconsideração da personalidade jurídica?",
  "Quais as hipóteses de rescisão indireta do contrato de trabalho?",
  "Como aplicar o princípio da insignificância no direito penal?",
  "Qual a natureza jurídica do FGTS e como funciona sua cobrança?",
  "Quando é cabível a tutela de urgência no processo civil?"
];

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hasUnsavedMessages, setHasUnsavedMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    if (!inputMessage.trim()) return;

    // Verificar se o usuário tem créditos suficientes
    if (totalCredits < costPerSearch) {
      toast({
        title: "Créditos insuficientes",
        description: "Você não tem créditos suficientes para realizar esta consulta. Acesse 'Minha Conta' para comprar mais créditos.",
        variant: "destructive",
      });
      navigate('/minha-conta');
      return;
    }

    // Criar nova sessão se não existir
    let sessionId = currentSessionId;
    if (!sessionId) {
      // Usar crypto.randomUUID() para gerar um UUID válido
      sessionId = crypto.randomUUID();
      setCurrentSessionId(sessionId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setHasUnsavedMessages(true);

    try {
      // Salvar a mensagem do usuário no histórico
      try {
        await supabase
          .from('query_history')
          .insert({
            user_id: user?.id,
            session_id: sessionId,
            prompt_text: userMessage.text,
            response_text: null,
            message_type: 'user_query',
            credits_consumed: 0
          });
      } catch (historyError) {
        console.error('Erro ao salvar mensagem do usuário no histórico:', historyError);
      }

      // Chamar o edge function que se conecta ao seu webhook
      const { data, error } = await supabase.functions.invoke('legal-ai-chat', {
        body: {
          message: userMessage.text,
          userId: user?.id
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

      // Salvar a resposta da IA no histórico
      try {
        await supabase
          .from('query_history')
          .insert({
            user_id: user?.id,
            session_id: sessionId,
            prompt_text: userMessage.text, // Manter a pergunta para referência
            response_text: aiResponse.text,
            message_type: 'ai_response',
            credits_consumed: costPerSearch
          });
        
        console.log('Resposta da IA salva no histórico:', {
          sessionId,
          responseLength: aiResponse.text.length
        });
      } catch (historyError) {
        console.error('Erro ao salvar resposta da IA no histórico:', historyError);
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

  const handleExampleClick = (question: string) => {
    setInputMessage(question);
  };

  // Função para rolar para o final do chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar histórico de conversas
  useEffect(() => {
    loadChatHistory();
  }, [user]);

  // Rolar para o final quando mensagens mudarem ou quando estiver digitando
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('query_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Agrupar mensagens por session_id
      const sessionsMap = new Map<string, ChatSession>();
      
      data?.forEach((query) => {
        const sessionKey = query.session_id;
        
        if (!sessionsMap.has(sessionKey)) {
          sessionsMap.set(sessionKey, {
            id: sessionKey,
            title: 'Nova conversa',
            preview: '',
            timestamp: new Date(query.created_at),
            messages: []
          });
        }

        const session = sessionsMap.get(sessionKey)!;
        
        // Adicionar mensagem do usuário
        if (query.message_type === 'user_query' && query.prompt_text) {
          session.messages.push({
            id: `user-${query.id}`,
            text: query.prompt_text,
            sender: 'user',
            timestamp: new Date(query.created_at)
          });
          
          // Usar primeira pergunta como título da sessão
          if (session.title === 'Nova conversa') {
            session.title = query.prompt_text.length > 50 ? 
              query.prompt_text.substring(0, 50) + '...' : 
              query.prompt_text;
          }
        }
        
        // Adicionar resposta da IA
        if (query.message_type === 'ai_response' && query.response_text) {
          session.messages.push({
            id: `ai-${query.id}`,
            text: query.response_text,
            sender: 'ai',
            timestamp: new Date(query.created_at)
          });
          
          // Usar parte da resposta como preview se ainda não tiver
          if (!session.preview) {
            session.preview = query.response_text.substring(0, 80) + '...';
          }
        }
      });

      // Ordenar mensagens dentro de cada sessão por timestamp
      sessionsMap.forEach(session => {
        session.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        // Atualizar timestamp da sessão para a última mensagem
        if (session.messages.length > 0) {
          session.timestamp = session.messages[session.messages.length - 1].timestamp;
        }
      });

      // Converter para array e ordenar por timestamp (mais recente primeiro)
      const sessions = Array.from(sessionsMap.values())
        .filter(session => session.messages.length > 0) // Apenas sessões com mensagens
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setChatSessions(sessions);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const createNewChat = () => {
    // Salvar conversa atual se existir e tiver mensagens não salvas
    if (hasUnsavedMessages && messages.length > 0) {
      // As mensagens já foram salvas individualmente no handleSendMessage
      // Então só precisamos resetar o estado
    }
    
    setMessages([]);
    setCurrentSessionId(null);
    setHasUnsavedMessages(false);
    
    // Recarregar histórico para mostrar a conversa recém-salva
    loadChatHistory();
  };

  const loadChatSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
  };

  // Função para excluir uma conversa específica (sem confirmação)
  const deleteConversation = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('query_history')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Atualizar estado local
      setChatSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Se a conversa excluída era a atual, limpar o chat
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }

      toast({
        title: "Conversa excluída",
        description: "A conversa foi excluída com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir conversa:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a conversa. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para limpar todo o histórico
  const clearAllHistory = async () => {
    try {
      const { error } = await supabase
        .from('query_history')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;

      // Limpar estado local
      setChatSessions([]);
      setMessages([]);
      setCurrentSessionId(null);

      toast({
        title: "Histórico limpo",
        description: "Todo o histórico foi excluído com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast({
        title: "Erro ao limpar histórico",
        description: "Não foi possível limpar o histórico. Tente novamente.",
        variant: "destructive",
      });
    }
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
                  <div
                    key={session.id}
                    className={`relative group p-2 rounded-lg hover:bg-primary/10 ${
                      currentSessionId === session.id ? 'bg-primary/10' : ''
                    }`}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-auto p-1 flex flex-col items-start text-left justify-start"
                        >
                          <div className="text-xs font-medium truncate w-full text-left">
                            {session.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 text-left">
                            {session.timestamp.toLocaleDateString('pt-BR')}
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuItem onClick={() => loadChatSession(session)}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Carregar conversa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteConversation(session.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir conversa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
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
          <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger className="lg:hidden" />
              <h1 className="text-base md:text-lg font-semibold truncate">Oráculo Jurídico</h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-1 md:gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">Olá, {userName}!</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-0 h-auto">
                      <Avatar className="w-6 h-6 md:w-7 md:h-7 cursor-pointer">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleMyAccount}>
                      <Settings className="w-4 h-4 mr-2" />
                      Minha Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-2 md:p-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 max-w-6xl mx-auto px-2">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-base md:text-lg font-semibold">Como posso te ajudar hoje?</h2>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Sou sua IA de assistência jurídica. Faça uma pergunta sobre legislação, jurisprudência ou doutrina.
                      </p>
                    </div>
                  </div>
                  
                  {/* Credits Display - Mais compacto */}
                  <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg max-w-md mx-auto">
                    <p className="text-xs text-primary text-center">
                      💡 Você tem {totalCredits} créditos disponíveis 
                      {dailyCredits > 0 && ` (${dailyCredits} diários + ${userCredits} comprados)`}. 
                      Cada pesquisa custa {costPerSearch} crédito.
                    </p>
                  </div>
                  
                  {/* Exemplos de Perguntas - Mais compacto */}
                  <div className="w-full max-w-5xl">
                    <h3 className="text-sm font-medium mb-2 text-center">Exemplos de perguntas:</h3>
                    <TooltipProvider>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                        {exampleQuestions.map((question, index) => (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                className="text-left justify-start h-auto p-2 text-xs bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-primary/50 transition-colors min-h-[50px]"
                                onClick={() => handleExampleClick(question)}
                              >
                                <span className="line-clamp-2 leading-tight">{question}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs p-2">
                              <p className="text-xs">{question}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </TooltipProvider>
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
                  
                  {/* Invisible div to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area - Mais compacto */}
            <div className="p-2 md:p-4 border-t border-slate-700 bg-slate-800">
              <div className="flex gap-2">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta aqui e pressione Enter..."
                  className="flex-1 min-h-[40px] md:min-h-[50px] text-sm resize-none bg-background border-slate-600 focus:border-primary"
                  disabled={isTyping}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="btn-primary p-2 md:p-3 w-10 h-10 md:w-12 md:h-12 rounded-lg"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Credits Display - Mais compacto */}
              <div className="flex items-center justify-between mt-2 p-2 bg-slate-700 rounded-lg">
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
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
