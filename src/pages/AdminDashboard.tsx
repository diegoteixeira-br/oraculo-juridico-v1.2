import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UserManager from "@/components/admin/UserManager";
import DocumentUploader from "@/components/admin/DocumentUploader";
import DocumentManager from "@/components/admin/DocumentManager";
import RefundManager from "@/components/admin/RefundManager";
import TokenManager from "@/components/admin/TokenManager";
import TestAgendaEmail from "@/components/TestAgendaEmail";
import { Users, FileText, Upload, Undo2, ArrowLeft, Coins, TestTube } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const navigate = useNavigate();
  
  usePageTitle();
  useSEO({
    title: "Painel Administrativo - Cakto",
    description: "Gerencie usuários, documentos e estornos no painel administrativo do Cakto"
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground">
                Gerencie usuários, documentos e processamentos do sistema
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-2">
              <Undo2 className="h-4 w-4" />
              Estornos
            </TabsTrigger>
            <TabsTrigger value="teste-agenda" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Teste Agenda
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentManager />
          </TabsContent>

          <TabsContent value="upload">
            <DocumentUploader />
          </TabsContent>

          <TabsContent value="tokens">
            <TokenManager />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundManager />
          </TabsContent>

          <TabsContent value="teste-agenda">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Teste de Notificações da Agenda</h2>
                <p className="text-muted-foreground">
                  Teste o sistema de envio automático de emails da agenda jurídica
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <TestAgendaEmail />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Como funciona:</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Busca compromissos das próximas 24 horas</li>
                      <li>• Filtra usuários com notificações ativas</li>
                      <li>• Aplica timezone correto para cada usuário</li>
                      <li>• Envia via Resend (mesmo sistema do app)</li>
                      <li>• Executa automaticamente no horário configurado</li>
                    </ul>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Configuração automática:</h3>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Cron jobs individuais por usuário</li>
                      <li>• Triggers automáticos para mudanças</li>
                      <li>• Horário personalizado por usuário</li>
                      <li>• Timezone respeitado nos emails</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}