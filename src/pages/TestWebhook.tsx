import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function TestWebhook() {
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

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
            <CardTitle>Teste do Webhook Cakto</CardTitle>
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