import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import UserManager from "@/components/admin/UserManager";
import DocumentUploader from "@/components/admin/DocumentUploader";
import DocumentManager from "@/components/admin/DocumentManager";
import RefundManager from "@/components/admin/RefundManager";
import TokenManager from "@/components/admin/TokenManager";
import TestAgendaEmail from "@/components/TestAgendaEmail";
import { Users, FileText, Upload, Undo2, ArrowLeft, Coins, Mail } from "lucide-react";
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
      <div className="container mx-auto py-4 px-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Gerencie usuários, documentos e processamentos do sistema
              </p>
            </div>
            <Button 
              variant="default" 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
            <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documentos</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="tokens" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Tokens</span>
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Estornos</span>
            </TabsTrigger>
            <TabsTrigger value="teste-agenda" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Templates Email</span>
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
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Templates de Email Agenda</h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Teste o sistema de envio automático de emails da agenda jurídica
                </p>
              </div>
              
              <TestAgendaEmail />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}