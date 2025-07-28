import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Send, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import ReCaptcha from "react-google-recaptcha";
import ReCaptchaProvider, { useReCaptcha } from "@/components/ReCaptchaProvider";

const ContatoForm = () => {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/8fc8748b-d056-4136-b669-07bbd1bc2327.png" 
                alt="Oráculo Jurídico" 
                className="h-8"
              />
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Entre em Contato</h1>
            <p className="text-muted-foreground">
              Envie sua mensagem e nossa equipe responderá o mais breve possível.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Formulário de Contato</CardTitle>
              <CardDescription>
                Preencha os campos abaixo com suas informações e sua mensagem.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input
                      id="nome"
                      name="nome"
                      type="text"
                      value={formData.nome}
                      onChange={handleInputChange}
                      required
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input
                    id="assunto"
                    name="assunto"
                    type="text"
                    value={formData.assunto}
                    onChange={handleInputChange}
                    required
                    placeholder="Sobre o que você gostaria de falar?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    name="mensagem"
                    value={formData.mensagem}
                    onChange={handleInputChange}
                    required
                    placeholder="Escreva sua mensagem aqui..."
                    className="min-h-[120px]"
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
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Verificação de segurança</span>
                  </div>
                  
                  <div className="flex justify-center">
                    <ReCaptcha
                      sitekey={siteKey}
                      onChange={(token) => setRecaptchaToken(token || '')}
                      onExpired={() => setRecaptchaToken('')}
                      hl="pt-BR"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Ou envie um email diretamente para:{" "}
              <a 
                href="mailto:contato@oraculojuridico.com.br" 
                className="text-primary hover:underline"
              >
                contato@oraculojuridico.com.br
              </a>
            </p>
          </div>
        </div>
      </main>
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