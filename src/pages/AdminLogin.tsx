import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(credentials.email, credentials.password);
      if (error) {
        toast({
          title: "Erro ao entrar",
          description: error.message || "Verifique suas credenciais.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se o usuário autenticado é admin
      const { data: isAdmin, error: adminErr } = await supabase.rpc('is_current_user_admin');
      if (adminErr) throw adminErr;

      if (isAdmin) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo à área administrativa",
        });
        navigate("/admin/documentos", { replace: true });
      } else {
        toast({
          title: "Acesso restrito",
          description: "Sua conta não possui permissão de administrador.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      toast({
        title: "Erro inesperado",
        description: err?.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-primary mb-2">Área Administrativa</h1>
          <p className="text-muted-foreground">Acesso restrito para administradores</p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Login Administrativo
            </CardTitle>
            <CardDescription>
              Entre com e-mail e senha da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seuemail@exemplo.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite sua senha"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                <Lock className="w-4 h-4 mr-2" />
                {loading ? "Verificando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-600">
              <Button 
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="w-full border-slate-600 hover:bg-slate-700"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Lock className="w-4 h-4" />
            <span className="font-semibold">Área Protegida</span>
          </div>
          <p className="text-amber-300/80 text-xs mt-1">
            Este painel é destinado apenas para administradores do sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
