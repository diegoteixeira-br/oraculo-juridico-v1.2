import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserManager from "@/components/admin/UserManager";
import DocumentUploader from "@/components/admin/DocumentUploader";
import DocumentManager from "@/components/admin/DocumentManager";
import RefundManager from "@/components/admin/RefundManager";
import TokenManager from "@/components/admin/TokenManager";
import TestAgendaEmail from "@/components/TestAgendaEmail";
import AgendaCronManager from "@/components/admin/AgendaCronManager";
import BlogManager from "@/components/admin/BlogManager";
import BlogSettings from "@/components/admin/BlogSettings";
import AdsManager from "@/components/admin/AdsManager";
import LandingPageSettings from "@/components/admin/LandingPageSettings";
import { Users, FileText, Upload, Undo2, ArrowLeft, Coins, Mail, BookOpen, Settings2, Wrench, Globe, Cog } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("system");
  const [activeTab, setActiveTab] = useState("users");
  const [activeBlogTab, setActiveBlogTab] = useState("articles");
  
  const navigate = useNavigate();
  
  usePageTitle();
  useSEO({
    title: "Painel Administrativo - Oráculo Jurídico",
    description: "Gerencie usuários, documentos e estornos no painel administrativo do Oráculo Jurídico"
  });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto py-4 px-2 sm:px-4 sm:py-8 max-w-7xl">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Painel Administrativo</h1>
              <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                Gerencie o sistema e o blog jurídico
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        {/* Menu Principal - Sistema vs Blog */}
        <div className="mb-6">
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={activeSection === "system" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection("system")}
              className="flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              Sistema
            </Button>
            <Button
              variant={activeSection === "blog" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveSection("blog")}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Blog
            </Button>
          </div>
        </div>

        {/* Seção Sistema */}
        {activeSection === "system" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Administração do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-7 h-auto">
                  <TabsTrigger value="users" className="flex items-center gap-2 p-3">
                    <Users className="h-4 w-4" />
                    <span className="hidden lg:inline">Usuários</span>
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center gap-2 p-3">
                    <FileText className="h-4 w-4" />
                    <span className="hidden lg:inline">Documentos</span>
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2 p-3">
                    <Upload className="h-4 w-4" />
                    <span className="hidden lg:inline">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="tokens" className="flex items-center gap-2 p-3">
                    <Coins className="h-4 w-4" />
                    <span className="hidden lg:inline">Tokens</span>
                  </TabsTrigger>
                  <TabsTrigger value="refunds" className="flex items-center gap-2 p-3">
                    <Undo2 className="h-4 w-4" />
                    <span className="hidden lg:inline">Estornos</span>
                  </TabsTrigger>
                  <TabsTrigger value="teste-agenda" className="flex items-center gap-2 p-3">
                    <Mail className="h-4 w-4" />
                    <span className="hidden lg:inline">Agenda Email</span>
                  </TabsTrigger>
                  <TabsTrigger value="landing-page" className="flex items-center gap-2 p-3">
                    <Globe className="h-4 w-4" />
                    <span className="hidden lg:inline">Página Venda</span>
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
                    <div className="text-center">
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Gerenciamento de Agenda por Email</h2>
                      <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                        Configure, teste e monitore o sistema de envio automático de emails da agenda jurídica
                      </p>
                    </div>
                    
                    <div className="max-w-4xl mx-auto">
                      <AgendaCronManager />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="landing-page">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Configurações da Página de Venda</h2>
                      <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                        Configure o vídeo explicativo exibido na página de venda
                      </p>
                    </div>
                    
                    <LandingPageSettings />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Seção Blog */}
        {activeSection === "blog" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Administração do Blog
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeBlogTab} onValueChange={setActiveBlogTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto">
                  <TabsTrigger value="articles" className="flex items-center gap-2 p-3">
                    <FileText className="w-4 h-4" />
                    <span>Artigos</span>
                  </TabsTrigger>
                  <TabsTrigger value="ads" className="flex items-center gap-2 p-3">
                    <Settings2 className="w-4 h-4" />
                    <span>Anúncios</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2 p-3">
                    <Settings2 className="w-4 h-4" />
                    <span>Configurações</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="articles">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Gerenciamento de Artigos</h2>
                      <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                        Crie, edite e gerencie artigos do blog jurídico para SEO e engajamento
                      </p>
                    </div>
                    
                    <BlogManager />
                  </div>
                </TabsContent>

                <TabsContent value="ads">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Gerenciamento de Anúncios</h2>
                      <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                        Adicione seus próprios anúncios ou de terceiros nas diferentes posições do blog
                      </p>
                    </div>
                    
                    <AdsManager />
                  </div>
                </TabsContent>

                <TabsContent value="settings">
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2">Configurações do Blog</h2>
                      <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
                        Configure SEO, monetização e configurações avançadas do blog
                      </p>
                    </div>
                    
                    <BlogSettings />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}