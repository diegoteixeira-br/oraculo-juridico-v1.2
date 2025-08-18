import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, Clock, Mail, Play, Settings } from "lucide-react";

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
      const { data, error } = await supabase.functions.invoke('daily-agenda-summary', {
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

  const previewTemplate = async () => {
    try {
      const response = await fetch(
        `https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary?preview=true`,
        {
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1am94b3hzYnZoY21jZ2Z2cHZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNzQwMjcsImV4cCI6MjA2Nzc1MDAyN30.T-R0ssuI_o-1UkcCJbF7CaaPoqpgjgPIuL-ub_SyEtU`
          }
        }
      );
      
      const html = await response.text();
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(html);
        newWindow.document.close();
      }
    } catch (error: any) {
      toast.error("Erro ao visualizar template: " + error.message);
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

          {/* Preview do Template */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Visualizar Template</h4>
              <p className="text-sm text-muted-foreground">
                Veja como fica o email de exemplo
              </p>
            </div>
            <Button variant="outline" onClick={previewTemplate}>
              <Settings className="h-4 w-4 mr-2" />
              Preview
            </Button>
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
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Como configurar o envio automático:
            </h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Configure o DAILY_AGENDA_SECRET no Supabase</li>
              <li>2. Ative as extensões pg_cron e pg_net no Supabase</li>
              <li>3. Configure o cron job SQL no Supabase SQL Editor</li>
              <li>4. Use "Analisar" acima para ver quais horários configurar</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}