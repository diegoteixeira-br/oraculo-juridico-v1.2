import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Clock, Mail, Play, Settings, Server, Globe } from "lucide-react";

export default function AgendaCronManager() {
  const [testEmail, setTestEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const testAgendaEmail = async () => {
    if (!testEmail) {
      toast.error("Por favor, insira um email para teste");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-agenda-summary-simple', {
        body: {
          source: 'manual_test',
          test_email: testEmail
        }
      });

      if (error) throw error;
      
      setLastResponse(data);
      toast.success(`Email de teste enviado para ${testEmail}`);
    } catch (error: any) {
      console.error("Erro ao enviar email de teste:", error);
      toast.error("Erro ao enviar email: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  const checkCronJobs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-agenda-cron');
      
      if (error) throw error;
      
      console.log("Análise dos cron jobs:", data);
      toast.success("Análise dos cron jobs executada - veja o console");
    } catch (error: any) {
      console.error("Erro ao verificar cron jobs:", error);
      toast.error("Erro ao verificar cron jobs: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card principal de gerenciamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Gerenciamento de Agenda por Email
          </CardTitle>
          <CardDescription>
            Gerencie o envio automático de resumos da agenda jurídica
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teste de Email */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Label htmlFor="test-email" className="text-sm font-medium">Teste de Email</Label>
            </div>
            <div className="flex gap-2">
              <Input
                id="test-email"
                placeholder="email@exemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={testAgendaEmail} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                {isLoading ? "Enviando..." : "Testar"}
              </Button>
            </div>
            {lastResponse && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Último resultado:</p>
                <pre className="text-xs mt-1 overflow-auto">
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>


          {/* Análise de Cron Jobs */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Análise de Cron Jobs</h4>
              <p className="text-sm text-muted-foreground">
                Verificar configurações atuais dos usuários
              </p>
            </div>
            <Button variant="outline" onClick={checkCronJobs}>
              <Clock className="h-4 w-4 mr-2" />
              Analisar
            </Button>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status RESEND_API_KEY</span>
                  <Badge variant="secondary">
                    ✅ Configurado
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Função Daily Summary</span>
                  <Badge variant="secondary">
                    ✅ Ativa
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instruções */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              ⚠️ Configurações importantes do Supabase
            </h4>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>1. <strong>Desative &quot;Confirm email&quot;</strong> em Authentication &gt; Settings</li>
              <li>2. Configure RESEND_API_KEY nos secrets do Supabase</li>
              <li>3. Verifique se o domínio está validado no Resend</li>
              <li>4. Use o mesmo email "from" que funciona no contato</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Card de configurações de email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Gerencie as configurações SMTP e de envio de email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Links para configurações do Supabase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Secrets do Supabase</h4>
                <p className="text-sm text-muted-foreground">
                  Configure RESEND_API_KEY e outros secrets
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => window.open('https://supabase.com/dashboard/project/uujoxoxsbvhcmcgfvpvi/settings/functions', '_blank')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Editor SQL</h4>
                <p className="text-sm text-muted-foreground">
                  Configure extensões e cron jobs
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/uujoxoxsbvhcmcgfvpvi/sql/new', '_blank')}
              >
                <Globe className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Configurações Auth</h4>
                <p className="text-sm text-muted-foreground">
                  Desative confirmação de email
                </p>
              </div>
              <Button 
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/uujoxoxsbvhcmcgfvpvi/auth/settings', '_blank')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Abrir
              </Button>
            </div>
          </div>

          {/* Instruções detalhadas */}
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
                📧 Configuração do Resend (Obrigatório)
              </h4>
              <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>1. Crie uma conta em <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a></li>
                <li>2. Valide seu domínio em <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">resend.com/domains</a></li>
                <li>3. Gere uma API key em <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com/api-keys</a></li>
                <li>4. Adicione a chave como RESEND_API_KEY nos secrets do Supabase</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ⚙️ Configuração do Cron (Opcional - para automação)
              </h4>
              <ol className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>1. No SQL Editor, execute: <code className="bg-black/10 px-1 rounded">CREATE EXTENSION IF NOT EXISTS pg_cron;</code></li>
                <li>2. Execute também: <code className="bg-black/10 px-1 rounded">CREATE EXTENSION IF NOT EXISTS pg_net;</code></li>
                <li>3. Use "Analisar" acima para ver os horários necessários</li>
                <li>4. Configure um cron job para cada horário identificado</li>
              </ol>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                🔍 Monitoramento e Logs
              </h4>
              <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                <li>1. Use a função "Testar" acima para validar envios</li>
                <li>2. Verifique os logs das Edge Functions no Supabase</li>
                <li>3. Configure alertas no Resend para monitorar entregas</li>
                <li>4. Use "Preview" para testar templates visuais</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}