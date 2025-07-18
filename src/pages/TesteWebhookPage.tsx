import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function TesteWebhookPage() {
  usePageTitle();
  
  const [email, setEmail] = useState("");
  const [produto, setProduto] = useState("basic");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testarWebhook = async () => {
    setIsLoading(true);
    
    try {
      // Simular dados do webhook do Cakto
      const webhookData = {
        webhook_secret: "8b02ef4d-a6a0-42e6-87f5-7e8e12e7fd17",
        status: "approved",
        customer_email: email,
        product_id: produto === "basic" ? "qx2hqko_472740" : "qnjypg7_472753",
        product_name: produto === "basic" ? "Pacote Básico" : "Pacote Premium",
        amount: produto === "basic" ? 59.90 : 97.00,
        transaction_id: `test_${Date.now()}`,
        utm_source: "oraculo_juridico",
        utm_campaign: produto,
        utm_medium: "website"
      };

      const response = await fetch('https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/cakto-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData)
      });

      const result = await response.text();
      
      if (response.ok) {
        toast({
          title: "Webhook testado com sucesso!",
          description: "Verifique os logs da edge function para mais detalhes.",
        });
      } else {
        toast({
          title: "Erro no webhook",
          description: `Status: ${response.status} - ${result}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao testar webhook",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">Teste do Webhook Cakto</h1>
          <p className="text-muted-foreground">
            Use esta página para testar se o webhook está funcionando corretamente
          </p>
        </div>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-primary">Dados do Teste</CardTitle>
            <CardDescription>
              Preencha os dados para simular um pagamento aprovado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email do usuário (deve existir no sistema)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@exemplo.com"
                className="bg-slate-700 border-slate-600"
              />
            </div>

            <div>
              <Label htmlFor="produto">Produto</Label>
              <select
                id="produto"
                value={produto}
                onChange={(e) => setProduto(e.target.value)}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="basic">Pacote Básico (50 créditos)</option>
                <option value="premium">Pacote Premium (100 créditos)</option>
              </select>
            </div>

            <Button
              onClick={testarWebhook}
              disabled={isLoading || !email}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isLoading ? "Testando..." : "Testar Webhook"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-primary">Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• O email deve ser de um usuário que já existe no sistema</p>
            <p>• O teste simulará um pagamento aprovado</p>
            <p>• Verifique os logs da edge function para debug</p>
            <p>• URL do webhook: https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/cakto-webhook</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}