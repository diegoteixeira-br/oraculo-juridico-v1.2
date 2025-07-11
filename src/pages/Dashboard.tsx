import { useState, useRef } from "react";
import { MessageCircle, Settings, LogOut, Send, Bot, User, Clock, CreditCard, Paperclip, X, FileText, Image } from "lucide-react";
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

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();

  const userName = profile?.full_name || user?.email || "Usuário";
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // Sistema de créditos
  const userCredits = 150; // Créditos disponíveis
  const costPerSearch = 1; // Custo por pesquisa

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && attachedFiles.length === 0) return;

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

    // Simulate AI response - will be replaced with real n8n webhook
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: attachedFiles.length > 0 
          ? `Analisei os arquivos anexados. Esta é uma resposta simulada da IA que considera os documentos enviados. Em breve, estarei totalmente integrado para analisar PDFs e imagens fornecendo respostas jurídicas precisas baseadas no conteúdo dos seus documentos.`
          : "Esta é uma resposta simulada da IA. Em breve, estarei conectado ao sistema real para fornecer respostas jurídicas precisas baseadas na legislação brasileira.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
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

  const AppSidebar = () => (
    <Sidebar className="w-64 bg-slate-800 border-slate-700">
      <SidebarHeader className="p-6">
        <img 
          src="/lovable-uploads/baf2f459-dae5-46d0-8e62-9d9247ec0b40.png" 
          alt="Oráculo Jurídico" 
          className="w-16 h-16 mx-auto"
        />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="flex items-center gap-3 px-4 py-3 text-primary bg-primary/10 border-r-2 border-primary">
              <MessageCircle className="w-5 h-5" />
              <span>Chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleMyAccount}
              className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Settings className="w-5 h-5" />
              <span>Minha Conta</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-slate-700 bg-slate-800">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-semibold">Oráculo Jurídico</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Credits Display */}
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <Badge variant="default" className="bg-primary">
                  {userCredits} créditos
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({costPerSearch} crédito/pesquisa)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Olá, {userName}!</span>
                <Avatar className="w-8 h-8">
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
            <ScrollArea className="flex-1 p-6">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Como posso te ajudar hoje?</h2>
                    <p className="text-muted-foreground max-w-md">
                      Sou sua IA de assistência jurídica. Faça uma pergunta sobre legislação, jurisprudência ou doutrina. 
                      Por exemplo: "Quais os requisitos da usucapião extraordinária segundo o Código Civil?"
                    </p>
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm text-primary">
                        💡 Você tem {userCredits} créditos disponíveis. Cada pesquisa custa {costPerSearch} crédito.
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
                        className={`max-w-[70%] p-4 rounded-lg ${
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
            <div className="p-6 border-t border-slate-700 bg-slate-800">
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
                          <p className="text-xs font-medium truncate max-w-32">{file.name}</p>
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
                    className="p-2 h-16 border-slate-600 hover:border-primary"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                </div>
                
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta aqui e pressione Enter... (Anexe PDFs ou imagens para análise)"
                  className="flex-1 min-h-[60px] resize-none bg-background border-slate-600 focus:border-primary"
                  disabled={isTyping}
                />
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && attachedFiles.length === 0) || isTyping}
                  className="btn-primary p-4 w-16 h-16 rounded-lg"
                >
                  <Send className="w-5 h-5" />
                </Button>
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