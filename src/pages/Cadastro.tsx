import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff, UserPlus, Shield, Gift, Zap, Users, Award, CheckCircle } from 'lucide-react';
import ReCAPTCHA from "react-google-recaptcha";
import ReCaptchaProvider, { useReCaptcha } from "@/components/ReCaptchaProvider";
import { useSEO } from "@/hooks/useSEO";

function CadastroForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [honeypot, setHoneypot] = useState(''); // Campo honeypot para detectar bots
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plano');
  const { siteKey } = useReCaptcha();

  // SEO
  useSEO({
    title: "Criar Conta Grátis | IA Jurídica — Oráculo Jurídico",
    description: "Crie sua conta e aproveite 7 dias grátis com 15.000 tokens. Plano Mensal Essencial com 30.000 tokens/mês.",
  });
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

      // Verificar se as senhas coincidem
      if (password !== confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "A senha e a confirmação devem ser iguais.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const result = await signUp(email, password, fullName, cpf);
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
          description: "Sua conta foi criada com sucesso! Redirecionando...",
        });
        
        // Redirecionar para página de finalizar cadastro
        navigate(`/finalizar-cadastro?email=${encodeURIComponent(email)}`);
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
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Criar Conta Gratuita
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  7 dias grátis com 15.000 tokens para começar
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de oferta gratuita */}
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 rounded-xl">
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Plano Essencial - 8 Dias Grátis!</h3>
                    <p className="text-sm text-slate-300">
                      Comece agora com 30.000 tokens/mês
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4 p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-yellow-200">Importante sobre o teste gratuito:</span>
                </div>
                <ul className="text-xs text-yellow-100 space-y-1">
                  <li>• Para finalizar o cadastro, é necessário adicionar um cartão</li>
                  <li>• <strong>Você não será cobrado nos primeiros 8 dias</strong></li>
                  <li>• Cancele a qualquer momento sem cobrança</li>
                  <li>• Acesso completo a todos os recursos durante o teste</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">30.000</div>
                  <div className="text-xs text-slate-400">Tokens/mês</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-green-400">R$ 37,90</div>
                  <div className="text-xs text-slate-400">Por mês</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">8 Dias</div>
                  <div className="text-xs text-slate-400">Teste Grátis</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-orange-400">Suporte</div>
                  <div className="text-xs text-slate-400">Prioritário</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid principal - Formulário e Informações */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Formulário de Cadastro */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Criar Sua Conta
                </CardTitle>
                <CardDescription>
                  Preencha os dados abaixo para começar gratuitamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm text-slate-300">Nome Completo *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="text-sm text-slate-300">CPF *</Label>
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                        setCpf(formatted);
                      }}
                      maxLength={14}
                      required
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-slate-300">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm text-slate-300">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm text-slate-300">Confirmar Senha *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirme sua senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-slate-400 hover:text-white"
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
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
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
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Criando conta e redirecionando...
                      </div>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Começar Teste de 8 Dias Grátis
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6">
                  <Separator className="bg-slate-600" />
                  <div className="mt-4 text-center">
                    <p className="text-sm text-slate-400 mb-3">
                      Já tem uma conta?
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Link to="/login">
                        Fazer Login
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações e Benefícios */}
            <div className="space-y-6">
              
              {/* O que você ganha */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Gift className="w-5 h-5 text-primary" />
                    O Que Você Ganha Gratuitamente
                  </CardTitle>
                  <CardDescription>
                    Acesso completo sem compromisso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-600/10 rounded-lg border border-green-500/20">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-200">15.000 tokens no teste de 7 dias</p>
                        <p className="text-xs text-green-300/80">Use durante os primeiros 7 dias</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
                      <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-200">IA Jurídica Completa</p>
                        <p className="text-xs text-blue-300/80">Acesso total à inteligência artificial</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-600/10 rounded-lg border border-purple-500/20">
                      <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-purple-200">Calculadoras Jurídicas</p>
                        <p className="text-xs text-purple-300/80">Contratos bancários e pensão alimentícia</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-orange-600/10 rounded-lg border border-orange-500/20">
                      <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-200">Histórico Completo</p>
                        <p className="text-xs text-orange-300/80">Todas suas consultas salvas</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Planos Disponíveis */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5 text-primary" />
                    Planos Disponíveis
                  </CardTitle>
                  <CardDescription>
                    Comece no Plano Grátis e evolua para o Plano Mensal (Essencial)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-600/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-green-200">Plano Grátis</h4>
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300">7 dias</span>
                    </div>
                    <p className="text-xs text-green-300/80 mb-2">15.000 tokens no período de teste</p>
                    <div className="text-xs text-slate-400">
                      IA jurídica completa, calculadoras e histórico
                    </div>
                  </div>

                  <div className="p-3 bg-purple-600/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-purple-200">Plano Mensal (Essencial)</h4>
                      <span className="text-lg font-bold text-purple-400">R$ 37,90/mês</span>
                    </div>
                    <p className="text-xs text-purple-300/80 mb-2">30.000 tokens por mês</p>
                    <div className="text-xs text-slate-400">
                      Renovação automática • Cancele quando quiser • 7 dias grátis com 15.000 tokens
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card className="bg-amber-900/20 border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                      <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-200 mb-2">Segurança Garantida</h4>
                      <div className="space-y-1 text-sm text-amber-300/80">
                        <p>• Teste de 7 dias requer cartão (sem cobrança até o 8º dia se não cancelar)</p>
                        <p>• Dados protegidos com SSL</p>
                        <p>• Conformidade total com LGPD</p>
                        <p>• Verificação anti-spam reCAPTCHA</p>
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
}

export default function Cadastro() {
  return (
    <ReCaptchaProvider>
      <CadastroForm />
    </ReCaptchaProvider>
  );
}