import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Send, Shield, MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import ReCaptchaProvider, { useReCaptcha } from "@/components/ReCaptchaProvider";

const ContatoForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
    honeypot: "" // Campo honeypot para detectar bots
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const { toast } = useToast();
  const { siteKey } = useReCaptcha();

  const handleGoBack = () => {
    // Verificar se há histórico de navegação
    if (window.history.length > 1) {
      navigate(-1); // Volta para a página anterior
    } else {
      navigate('/'); // Se não há histórico, vai para a home
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Verificação honeypot - se preenchido, é um bot
      if (formData.honeypot) {
        toast({
          title: "Erro de validação",
          description: "Falha na verificação de segurança.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Verificação reCAPTCHA
      if (!recaptchaToken) {
        toast({
          title: "Verificação necessária",
          description: "Por favor, complete a verificação reCAPTCHA.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Enviar dados incluindo o token reCAPTCHA
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          ...formData,
          recaptchaToken
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem enviada!",
        description: "Recebemos sua mensagem e responderemos em breve.",
      });

      setFormData({
        nome: "",
        email: "",
        assunto: "",
        mensagem: "",
        honeypot: ""
      });
      setRecaptchaToken('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente ou entre em contato por email: contato@oraculojuridico.com.br",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-slate-700"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <img 
                src="/lovable-uploads/8fc8748b-d056-4136-b669-07bbd1bc2327.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Entre em Contato
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Nossa equipe está pronta para ajudar você
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de informações sobre contato */}
          <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 rounded-xl">
                    <MessageCircle className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Fale Conosco</h3>
                    <p className="text-sm text-slate-300">
                      Estamos aqui para esclarecer suas dúvidas
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-blue-400">24h</div>
                  <div className="text-xs text-slate-400">Resposta em até</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Mail className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-green-400">Email</div>
                  <div className="text-xs text-slate-400">Suporte completo</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-purple-400">Seguro</div>
                  <div className="text-xs text-slate-400">Dados protegidos</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid principal - Formulário e Informações */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Formulário de Contato */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Send className="w-5 h-5 text-primary" />
                  Enviar Mensagem
                </CardTitle>
                <CardDescription>
                  Preencha o formulário abaixo e nossa equipe responderá em breve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome" className="text-sm text-slate-300">Nome completo *</Label>
                      <Input
                        id="nome"
                        name="nome"
                        type="text"
                        value={formData.nome}
                        onChange={handleInputChange}
                        required
                        placeholder="Seu nome"
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm text-slate-300">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="seu@email.com"
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assunto" className="text-sm text-slate-300">Assunto *</Label>
                    <Input
                      id="assunto"
                      name="assunto"
                      type="text"
                      value={formData.assunto}
                      onChange={handleInputChange}
                      required
                      placeholder="Sobre o que você gostaria de falar?"
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensagem" className="text-sm text-slate-300">Mensagem *</Label>
                    <Textarea
                      id="mensagem"
                      name="mensagem"
                      value={formData.mensagem}
                      onChange={handleInputChange}
                      required
                      placeholder="Escreva sua mensagem aqui..."
                      className="min-h-[120px] bg-slate-700 border-slate-600 focus:border-primary text-white resize-none"
                    />
                  </div>

                  {/* Campo honeypot - invisível para usuários, usado para detectar bots */}
                  <input
                    type="text"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleInputChange}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                      <Shield className="h-4 w-4" />
                      <span>Verificação de segurança</span>
                    </div>
                    
                    <div className="flex justify-center">
                      <ReCAPTCHA
                        sitekey={siteKey}
                        onChange={(token) => setRecaptchaToken(token || '')}
                        onExpired={() => setRecaptchaToken('')}
                        hl="pt-BR"
                      />
                    </div>
                  </div>

                 <Button
                   type="submit"
                   disabled={isLoading || !recaptchaToken}
                   className="w-full bg-primary hover:bg-primary/90 text-white"
                 >
                   {isLoading ? (
                     <div className="flex items-center">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                       Enviando...
                     </div>
                   ) : (
                     <>
                       <Send className="h-5 w-5 mr-2" />
                       Enviar Mensagem
                     </>
                   )}
                 </Button>
                </form>
              </CardContent>
            </Card>

            {/* Informações de Contato */}
            <div className="space-y-6">
              
              {/* Informações Diretas */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Phone className="w-5 h-5 text-primary" />
                    Outras Formas de Contato
                  </CardTitle>
                  <CardDescription>
                    Você também pode nos contatar diretamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Email</p>
                      <a 
                        href="mailto:contato@oraculojuridico.com.br" 
                        className="text-sm text-primary hover:underline"
                      >
                        contato@oraculojuridico.com.br
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <Clock className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Horário de Atendimento</p>
                      <p className="text-sm text-slate-300">Segunda a Sexta, 9h às 18h</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Tempo de Resposta</p>
                      <p className="text-sm text-slate-300">Até 24 horas úteis</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Rápido */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Dúvidas Frequentes</CardTitle>
                  <CardDescription>
                    Respostas para as perguntas mais comuns
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-1">
                        Como funciona o sistema de tokens?
                      </h4>
                      <p className="text-xs text-slate-400">
                        Cada consulta consome tokens baseado no tamanho da pergunta e resposta. 
                        Você tem acesso a tokens através de pacotes ou assinatura mensal.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-1">
                        Posso cancelar minha assinatura?
                      </h4>
                      <p className="text-xs text-slate-400">
                        Sim, você pode cancelar a qualquer momento. 
                        Os tokens já adquiridos não expiram.
                      </p>
                    </div>

                    <div className="p-3 bg-slate-700/30 rounded-lg">
                      <h4 className="text-sm font-medium text-white mb-1">
                        As informações são confiáveis?
                      </h4>
                      <p className="text-xs text-slate-400">
                        Sim! Nossa IA integra-se com a LexML, base oficial 
                        de jurisprudência do governo brasileiro.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações de Segurança */}
              <Card className="bg-green-900/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-200 mb-2">Seus Dados Estão Seguros</h4>
                      <div className="space-y-1 text-sm text-green-300/80">
                        <p>• Todas as comunicações são criptografadas</p>
                        <p>• Não compartilhamos seus dados com terceiros</p>
                        <p>• Conformidade com a LGPD</p>
                        <p>• Verificação anti-spam com reCAPTCHA</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContatoPage = () => {
  return (
    <ReCaptchaProvider>
      <ContatoForm />
    </ReCaptchaProvider>
  );
};

export default ContatoPage;