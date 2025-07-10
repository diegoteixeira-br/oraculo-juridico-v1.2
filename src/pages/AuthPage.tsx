import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      
      if (isLogin) {
        result = await signIn(email, password);
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
          navigate('/dashboard');
        }
      } else {
        result = await signUp(email, password, fullName);
        if (result.error) {
          if (result.error.message.includes('already registered')) {
            toast({
              title: "Email já cadastrado",
              description: "Este email já possui uma conta. Faça login ou use outro email.",
              variant: "destructive",
            });
          } else {
            throw result.error;
          }
        } else {
          toast({
            title: "Conta criada!",
            description: "Sua conta foi criada com sucesso. Agora finalize o pagamento para ter acesso completo!",
          });
          navigate('/pagamento');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-4 mb-8">
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
            src="/src/assets/cakto-logo.png" 
            alt="Cakto" 
            className="w-16 h-16 mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold">Oráculo Jurídico</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta gratuita'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Login' : 'Criar Conta'}</CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Entre com suas credenciais para acessar a plataforma'
                : 'Comece seu período gratuito de 7 dias'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  "Processando..."
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Entrar
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Criar Conta
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <Separator />
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                </p>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setEmail('');
                    setPassword('');
                    setFullName('');
                  }}
                  className="mt-1"
                >
                  {isLogin ? 'Criar conta gratuita' : 'Fazer login'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isLogin && (
          <div className="text-center text-sm text-muted-foreground">
            <p>✨ Período gratuito de 7 dias</p>
            <p>🔒 Sem cobrança no cartão</p>
            <p>📞 Suporte completo incluído</p>
          </div>
        )}
      </div>
    </div>
  );
}