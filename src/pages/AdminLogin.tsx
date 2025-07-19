import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield } from "lucide-react";

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Credenciais de administrador
    const adminUsername = "admin";
    const adminPassword = "OurLegal2024Admin#";

    if (credentials.username === adminUsername && credentials.password === adminPassword) {
      // Salvar sessão administrativa
      sessionStorage.setItem("admin_authenticated", "true");
      sessionStorage.setItem("admin_login_time", Date.now().toString());
      
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo à área administrativa"
      });
      
      navigate("/admin/documentos");
    } else {
      toast({
        title: "Credenciais inválidas",
        description: "Usuário ou senha incorretos",
        variant: "destructive"
      });
    }
    
    setLoading(false);
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
              Insira suas credenciais para acessar o painel de administração
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Digite o usuário"
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
                  placeholder="Digite a senha"
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