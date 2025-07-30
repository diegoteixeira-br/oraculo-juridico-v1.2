
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff, UserPlus, Shield } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import ReCaptchaProvider, { useReCaptcha } from "@/components/ReCaptchaProvider";

function CadastroForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Campo honeypot para detectar bots
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plano');
  const { siteKey } = useReCaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificação honeypot - se preenchido, é um bot
      if (honeypot.trim() !== '') {
        toast({
          title: "Erro de validação",
          description: "Falha na verificação de segurança.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificação reCAPTCHA
      if (!recaptchaToken) {
        toast({
          title: "Verificação necessária",
          description: "Por favor, complete a verificação reCAPTCHA.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await signUp(email, password, fullName);
      if (result.error) {
        if (result.error.message.includes('already registered')) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Faça login ou use outro email.",
            variant: "destructive",
          });
        } else if (result.error.message.includes('rate limit') || result.error.message.includes('429')) {
          toast({
            title: "Muitas tentativas de cadastro",
            description: "Aguarde alguns minutos antes de tentar novamente. O limite de envio de emails foi excedido temporariamente.",
            variant: "destructive",
          });
        } else {
          throw result.error;
        }
      } else {
        toast({
          title: "Conta criada!",
          description: "Sua conta foi criada com sucesso! Verifique seu email para confirmar.",
        });
        
        // Redirecionar para página de confirmação de email
        navigate(`/confirmar-email?email=${encodeURIComponent(email)}${selectedPlan ? `&plano=${selectedPlan}` : ''}`);
      }
    } catch (error: any) {
      if (error.message && (error.message.includes('rate limit') || error.message.includes('429'))) {
        toast({
          title: "Limite de emails excedido",
          description: "Muitas tentativas de cadastro foram feitas. Aguarde 15 minutos e tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Link>
        </div>

        <div className="text-center space-y-2">
          <img 
            src="/lovable-uploads/8fc8748b-d056-4136-b669-07bbd1bc2327.png" 
            alt="Oráculo Jurídico" 
            className="w-12 h-12 mx-auto mb-2 rounded-lg"
          />
          <h1 className="text-xl font-bold">Oráculo Jurídico</h1>
          <p className="text-sm text-muted-foreground">
            Crie sua conta gratuita
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Criar Conta</CardTitle>
            <CardDescription className="text-sm">
              Comece agora e ganhe créditos para usar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Campo honeypot - invisível para usuários, usado para detectar bots */}
              <input
                type="text"
                name="website_url"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Verificação de segurança</span>
                </div>
                
                <div className="flex justify-center">
                  <div className="scale-90 transform-gpu">
                    <ReCAPTCHA
                      sitekey={siteKey}
                      onChange={(token) => setRecaptchaToken(token || '')}
                      onExpired={() => setRecaptchaToken('')}
                      hl="pt-BR"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  "Criando conta..."
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar Conta
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Separator />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?
                </p>
                <Button
                  asChild
                  variant="link"
                  className="mt-1"
                >
                  <Link to="/login">
                    Fazer login
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>✨ Sistema de créditos flexível</p>
          <p>🔒 Sem compromisso mensal</p>
          <p>📞 Suporte completo incluído</p>
        </div>
      </div>
    </div>
  );
}

export default function Cadastro() {
  return (
    <ReCaptchaProvider>
      <CadastroForm />
    </ReCaptchaProvider>
  );
}
