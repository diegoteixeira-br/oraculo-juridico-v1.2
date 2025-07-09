import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular login/recuperação de senha
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (isLogin) {
      // Simular login bem-sucedido
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o dashboard...",
      });
      setTimeout(() => navigate("/dashboard"), 1000);
    } else {
      // Simular envio de email de recuperação
      toast({
        title: "Email de recuperação enviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
      setIsLogin(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Back to Home Button */}
        <div className="text-center">
          <Link to="/">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Home
            </Button>
          </Link>
        </div>
        {/* Logo */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/b02b19a1-02c8-487d-9d6a-7ae0ee4435f9.png" 
            alt="Oráculo Jurídico" 
            className="w-48 h-48 mx-auto mb-4"
          />
        </div>

        {/* Form Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "Entrar na sua conta" : "Recuperar senha"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin 
                ? "Entre com suas credenciais para acessar o sistema"
                : "Digite seu email para receber instruções de recuperação"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-slate-700 border-slate-600 focus:border-primary"
                  required
                />
              </div>

              {/* Password (only for login) */}
              {isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="bg-slate-700 border-slate-600 focus:border-primary pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLogin ? "Entrar" : "Enviar email"}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            {/* Toggle between login and recovery */}
            <div className="text-center">
              <Separator className="my-4" />
              <Button
                variant="link"
                className="text-primary hover:text-primary/80"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Esqueceu sua senha?" : "Voltar para login"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Não tem uma conta?{" "}
            <Link to="/cadastro" className="text-primary hover:text-primary/80">
              Conheça o Oráculo Jurídico
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}