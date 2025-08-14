import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, CheckCircle, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TestAgendaEmail = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');

  const testEmailNotification = async (specificEmail?: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      const body = specificEmail 
        ? { source: 'manual_test', test_email: specificEmail }
        : { source: 'manual_test' };
        
      const { data, error } = await supabase.functions.invoke('daily-agenda-summary', {
        body
      });

      if (error) throw error;

      setResult(data);
      
      if (data.sent > 0) {
        const target = specificEmail ? `para ${specificEmail}` : '';
        toast.success(`✅ ${data.sent} email(s) enviado(s) ${target} com sucesso!`);
      } else {
        toast.info("ℹ️ Nenhum email enviado (sem compromissos ou usuário sem notificação ativa)");
      }
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
      toast.error("❌ Erro ao enviar teste de notificação");
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSpecificEmail = () => {
    if (!testEmail.trim()) {
      toast.error("Digite um email válido");
      return;
    }
    testEmailNotification(testEmail.trim());
  };

  const openPreview = () => {
    const previewUrl = 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary?preview=true';
    window.open(previewUrl, '_blank');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary" />
          Teste de Email da Agenda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Teste para email específico */}
        <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-primary" />
            <Label className="font-medium">Teste para usuário específico</Label>
          </div>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Digite o email do usuário"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={handleTestSpecificEmail} 
              disabled={loading}
              className="w-full"
              variant="default"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Testar para Este Email
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Teste para todos os usuários */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <Label className="font-medium">Teste para todos os usuários</Label>
          </div>
          <Button 
            onClick={() => testEmailNotification()} 
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Enviando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Enviar para Todos
              </div>
            )}
          </Button>
        </div>

        <Button 
          onClick={openPreview} 
          variant="secondary"
          className="w-full"
        >
          <Mail className="w-4 h-4 mr-2" />
          Ver Preview do Email
        </Button>

        {result && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              {result.error ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              Resultado do Teste:
            </h4>
            
            {result.error ? (
              <p className="text-red-600 text-sm">{result.error}</p>
            ) : (
              <div className="text-sm space-y-1">
                <p><strong>Usuários processados:</strong> {result.processed_users || 0}</p>
                <p><strong>Emails enviados:</strong> {result.sent || 0}</p>
                <p><strong>Mensagem:</strong> {result.message || 'Teste concluído'}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500">
          <p><strong>Como funciona:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Busca compromissos das próximas 24h</li>
            <li>Envia apenas para usuários com notificação ativa</li>
            <li>Usa o timezone configurado no perfil</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TestAgendaEmail;