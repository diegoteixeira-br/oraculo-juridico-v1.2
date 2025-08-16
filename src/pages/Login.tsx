import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff, LogIn, Shield, Zap, Users, Award } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar se veio do blog através do estado ou referrer
  const cameFromBlog = location.state?.from === 'blog' || 
    document.referrer.includes('/blog') || 
    document.referrer.includes('blog');

  useSEO({
    title: 'Entrar | Oráculo Jurídico – Teste 7 dias com 15.000 tokens',
    description: 'Faça login para continuar. Novo aqui? Ative o teste de 7 dias com 15.000 tokens (requer cartão). Cobrança no 8º dia se não cancelar.'
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        if (result.error.message.includes('Invalid login credentials')) {
          toast({
            title: "Erro no login",
            description: "Email ou senha incorretos. Verifique suas credenciais.",
            variant: "destructive",
          });
        } else {
          throw result.error;
        }
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta ao Oráculo Jurídico.",
        });
        
        // Redirecionar para o blog se veio de lá, senão para o dashboard
        if (cameFromBlog) {
          navigate('/');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
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
                  <LogIn className="h-5 w-5 text-primary" />
                  Entrar na Conta
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Acesse sua conta e continue suas consultas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de boas-vindas */}
          <Card className="bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/20 rounded-xl">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Bem-vindo de Volta!</h3>
                    <p className="text-sm text-slate-300">
                      Entre na sua conta para continuar usando o Oráculo Jurídico
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-green-400">15.000</div>
                  <div className="text-xs text-slate-400">Tokens no Teste (7 dias)</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">Teste 7 dias</div>
                  <div className="text-xs text-slate-400">Requer Cartão</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">24/7</div>
                  <div className="text-xs text-slate-400">Disponível</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid principal - Formulário e Informações */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Formulário de Login */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <LogIn className="w-5 h-5 text-primary" />
                  Fazer Login
                </CardTitle>
                <CardDescription>
                  Entre com suas credenciais para acessar sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-slate-300">Email</Label>
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
                    <Label htmlFor="password" className="text-sm text-slate-300">Senha</Label>
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

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 py-3" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Entrando...
                      </div>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar na Conta
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 space-y-4">
                  <div className="text-center">
                    <Button
                      asChild
                      variant="link"
                      className="text-primary hover:text-primary/80"
                    >
                      <Link to="/redefinir-senha">
                        Esqueci minha senha
                      </Link>
                    </Button>
                  </div>
                  
                  <Separator className="bg-slate-600" />
                  
                  <div className="text-center">
                    <p className="text-sm text-slate-400 mb-3">
                      Novo por aqui? Ative seu teste de 7 dias.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Link to="/cadastro">
                        Iniciar teste de 7 dias
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações e Benefícios */}
            <div className="space-y-6">
              
              {/* Benefícios do Login */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Award className="w-5 h-5 text-primary" />
                    Ao Fazer Login Você Tem
                  </CardTitle>
                  <CardDescription>
                    Acesso completo a todas as funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-green-600/10 rounded-lg border border-green-500/20">
                      <div className="p-2 bg-green-600/20 rounded-lg">
                        <Zap className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-200">Teste 7 dias — 15.000 tokens</p>
                        <p className="text-xs text-green-300/80">Cobrança no 8º dia se não cancelar</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
                      <div className="p-2 bg-blue-600/20 rounded-lg">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-200">IA Jurídica Especializada</p>
                        <p className="text-xs text-blue-300/80">Treinada em direito brasileiro</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-purple-600/10 rounded-lg border border-purple-500/20">
                      <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Award className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-200">Calculadoras Jurídicas</p>
                        <p className="text-xs text-purple-300/80">Contratos bancários e pensão</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Segurança */}
              <Card className="bg-green-900/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-200 mb-2">Login Seguro</h4>
                      <div className="space-y-1 text-sm text-green-300/80">
                        <p>• Criptografia SSL de ponta a ponta</p>
                        <p>• Dados protegidos conforme LGPD</p>
                        <p>• Sessão segura e autenticada</p>
                        <p>• Backup automático das suas consultas</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suporte */}
              <Card className="bg-blue-900/20 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-200 mb-2">Precisa de Ajuda?</h4>
                      <div className="space-y-1 text-sm text-blue-300/80">
                        <p>• Suporte técnico especializado</p>
                        <p>• Resposta em até 24 horas</p>
                        <p>• WhatsApp para casos urgentes</p>
                        <p>• FAQ completo disponível</p>
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