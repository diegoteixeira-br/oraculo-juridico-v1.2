import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Lista de emails de administrador
const ADMIN_EMAILS = [
  'admin@oraculojuridico.com.br',
  'marizafonsecademeneses@gmail.com' // Adicione outros emails de admin aqui
];

export default function TestWebhook() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Verificar se o usuário é admin
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Acesso negado",
        description: "Você precisa estar logado para acessar esta página.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!authLoading && user && !isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Esta página é restrita para administradores.",
        variant: "destructive",
      });
      navigate('/dashboard');
      return;
    }
  }, [user, authLoading, isAdmin, navigate, toast]);

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Não mostrar conteúdo se não for admin
  if (!isAdmin) {
    return null;
  }

  const handleTest = async () => {
    if (!email || !plan) {
      toast({
        title: "Erro",
        description: "Email e plano são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-cakto-webhook', {
        body: { email, plan }
      });

      if (error) {
        throw error;
      }

      setResult(data);
      
      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Webhook testado com sucesso! Créditos adicionados.",
        });
      } else {
        toast({
          title: "Erro",
          description: `Erro no webhook: ${data.result}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Erro",
        description: "Erro ao testar webhook",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Teste do Webhook Cakto (Admin)</CardTitle>
            <p className="text-sm text-muted-foreground">
              ⚠️ Esta página é restrita para administradores. Logado como: {user?.email}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email do usuário</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="plan">Plano</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Pacote Básico (50 créditos)</SelectItem>
                  <SelectItem value="premium">Pacote Premium (100 créditos)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleTest} disabled={loading} className="w-full">
              {loading ? 'Testando...' : 'Testar Webhook'}
            </Button>

            {result && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Resultado do Teste</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configuração do Webhook na Cakto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>URL do Webhook:</strong></p>
              <code className="bg-muted p-2 rounded block">
                https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/cakto-webhook
              </code>
              
              <p><strong>Método:</strong> POST</p>
              
              <p><strong>Chave secreta:</strong></p>
              <code className="bg-muted p-2 rounded block">
                8b02ef4d-a6a0-42e6-87f5-7e8e12e7fd17
              </code>
              
              <p className="text-sm text-muted-foreground mt-4">
                Configure esta URL no painel da Cakto para receber notificações de pagamento aprovado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}