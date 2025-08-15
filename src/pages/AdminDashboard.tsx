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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto py-4 px-2 sm:px-4 sm:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 w-full">
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <TabsList className="grid w-full grid-cols-6 h-auto min-w-max sm:min-w-0">
              <TabsTrigger value="users" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline lg:inline truncate">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline lg:inline truncate">Documentos</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline lg:inline truncate">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="tokens" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Coins className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline lg:inline truncate">Tokens</span>
              </TabsTrigger>
              <TabsTrigger value="refunds" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Undo2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline lg:inline truncate">Estornos</span>
              </TabsTrigger>
              <TabsTrigger value="teste-agenda" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden md:inline truncate">Email</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Templates de Email Agenda</h2>
                <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
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