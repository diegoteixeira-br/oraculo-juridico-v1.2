import { useState, useEffect } from "react";
import { CreditCard, History, Plus, MessageSquare, FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";
import DocumentViewer from "@/components/DocumentViewer";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userCredits, setUserCredits] = useState(0);
  const [dailyCredits, setDailyCredits] = useState(0);
  const [totalCreditsPurchased, setTotalCreditsPurchased] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [legalDocuments, setLegalDocuments] = useState<any[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  const totalAvailableCredits = userCredits + dailyCredits;

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, daily_credits, total_credits_purchased')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setUserCredits(profile.credits || 0);
          setDailyCredits(profile.daily_credits || 0);
          setTotalCreditsPurchased(profile.total_credits_purchased || 0);
          
          // Calcular créditos usados: total comprado - total disponível
          const totalUsed = (profile.total_credits_purchased || 0) - (profile.credits || 0);
          setCreditsUsed(Math.max(0, totalUsed));
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    loadUserData();
    loadLegalDocuments();
  }, [user?.id]);

  const loadLegalDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('is_active', true)
        .order('title');

      if (error) throw error;
      setLegalDocuments(data || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const handleViewDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsDocumentViewerOpen(true);
  };

  const handleDownloadDocument = (documentId: string) => {
    // Abrir o visualizador em modo download
    handleViewDocument(documentId);
  };

  const chartData = [
    { name: 'Créditos Disponíveis', value: totalAvailableCredits, color: '#10b981' },
    { name: 'Créditos Usados', value: creditsUsed, color: '#ef4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header com Menu */}
        <div className="flex justify-end mb-6">
          <UserMenu hideOptions={["dashboard"]} />
        </div>

        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-16 w-auto mx-auto mb-4"
          />
          
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Controle seus créditos e informações
          </p>
        </div>

        {/* Credit Overview Banner */}
        <div className="mt-4 p-6 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl">
          <div className="flex items-center gap-3 justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold text-primary">
              {totalAvailableCredits} créditos disponíveis
            </span>
          </div>
          <p className="text-center text-primary/80 mt-2">
            {dailyCredits > 0 && (
              <span>{dailyCredits} créditos diários + </span>
            )}
            {userCredits} créditos comprados
          </p>
        </div>

        {/* Como usar o Chat */}
        <Card className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <MessageSquare className="w-5 h-5" />
              Como usar o Chat Jurídico
            </CardTitle>
            <CardDescription className="text-primary/80">
              Tire suas dúvidas jurídicas com nossa IA especializada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 space-y-2">
                <p className="text-primary/90">
                  • Cada consulta consome apenas <strong>1 crédito</strong>
                </p>
                <p className="text-primary/90">
                  • Respostas baseadas na legislação brasileira
                </p>
                <p className="text-primary/90">
                  • Análise de contratos, petições e documentos jurídicos
                </p>
              </div>
              <Button 
                onClick={() => navigate("/chat")}
                className="bg-primary hover:bg-primary/90 px-8 py-3"
                size="lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Iniciar Chat
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documentos Pré-feitos - só aparece se tem mais de 3 créditos */}
        {totalAvailableCredits > 3 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documentos Jurídicos Pré-feitos
              </CardTitle>
              <CardDescription>
                Documentos prontos para usar - clique para editar e baixar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Scroll horizontal container */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex gap-3 w-max">
                    {legalDocuments.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="bg-slate-700 border border-slate-600 rounded-lg p-3 hover:border-primary/50 transition-all cursor-pointer hover:scale-105 flex-shrink-0 w-48"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        {/* Preview miniatura */}
                        <div className="mb-2">
                          <div className="bg-white p-2 rounded shadow-sm text-[8px] leading-tight h-16 overflow-hidden">
                            <div className="font-bold text-center border-b border-slate-300 pb-0.5 mb-1 text-slate-800">
                              {doc.category === 'contrato' && 'CONTRATO'}
                              {doc.category === 'peticao' && 'PETIÇÃO'}
                              {doc.category === 'procuracao' && 'PROCURAÇÃO'}
                              {doc.category === 'documento' && 'DOCUMENTO'}
                            </div>
                            <div className="text-slate-600 space-y-0.5">
                              {doc.category === 'contrato' && (
                                <>
                                  <div className="border-b border-slate-200">Partes: _________</div>
                                  <div>1. OBJETO</div>
                                  <div>2. PAGAMENTO</div>
                                </>
                              )}
                              {doc.category === 'peticao' && (
                                <>
                                  <div>Exmo. Sr. Juiz</div>
                                  <div>FATOS:</div>
                                  <div>PEDIDOS:</div>
                                </>
                              )}
                              {doc.category === 'procuracao' && (
                                <>
                                  <div>Outorgante: ____</div>
                                  <div>PODERES:</div>
                                  <div>□ Representar</div>
                                </>
                              )}
                              {doc.category === 'documento' && (
                                <>
                                  <div>Declaro que...</div>
                                  <div>_____________</div>
                                  <div>Assinatura</div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Título e descrição */}
                        <h3 className="font-semibold text-xs mb-1 line-clamp-2">{doc.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{doc.description}</p>
                        
                        {/* Badge categoria */}
                        <div className="flex justify-between items-center">
                          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                            {doc.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {doc.min_credits_required} créd.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Indicador de scroll */}
                <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-slate-800 to-transparent pointer-events-none"></div>
              </div>
              
              {/* Instruções */}
              <div className="mt-4 p-3 bg-slate-900/50 rounded border border-slate-600">
                <p className="text-xs text-muted-foreground text-center">
                  💡 <strong>Dica:</strong> Clique em qualquer documento para editar os campos e baixar personalizado
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credits Details Cards */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Credits Stats */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Seus Créditos
              </CardTitle>
              <CardDescription>
                Informações sobre seus créditos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="text-3xl font-bold text-primary">{totalAvailableCredits}</div>
                  <div className="text-sm text-muted-foreground">Total Disponíveis</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-600/10 rounded-lg border border-green-600/20">
                    <div className="text-2xl font-bold text-green-400">{dailyCredits}</div>
                    <div className="text-xs text-muted-foreground">Créditos Diários</div>
                  </div>
                  <div className="text-center p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <div className="text-2xl font-bold text-blue-400">{userCredits}</div>
                    <div className="text-xs text-muted-foreground">Créditos Comprados</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4 border-t border-slate-600">
                <span className="font-medium">Custo por pesquisa:</span>
                <span className="text-primary font-bold">1 crédito</span>
              </div>
              
              <div className="flex flex-col gap-4">
                <Button 
                  onClick={() => navigate("/comprar-creditos")}
                  className="w-full bg-primary hover:bg-primary/90 py-3"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Comprar Mais Créditos
                </Button>
                <Button 
                  onClick={() => navigate("/historico-transacoes")}
                  variant="outline"
                  className="w-full border-primary/20 hover:bg-primary/10 py-3"
                  size="lg"
                >
                  <History className="w-5 h-5 mr-2" />
                  Ver Histórico
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Credits Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Distribuição de Créditos</CardTitle>
              <CardDescription>
                Análise completa do uso dos seus créditos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [
                        `${value} crédito${value !== 1 ? 's' : ''}`, 
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Estatísticas detalhadas */}
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-600/10 rounded-lg border border-green-600/20">
                    <div className="text-2xl font-bold text-green-400">{totalAvailableCredits}</div>
                    <div className="text-sm text-muted-foreground">Disponíveis</div>
                  </div>
                  <div className="text-center p-4 bg-red-600/10 rounded-lg border border-red-600/20">
                    <div className="text-2xl font-bold text-red-400">{creditsUsed}</div>
                    <div className="text-sm text-muted-foreground">Usados</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-emerald-600/10 rounded-lg border border-emerald-600/20">
                    <div className="text-lg font-bold text-emerald-400">{dailyCredits}</div>
                    <div className="text-xs text-muted-foreground">Créditos Diários</div>
                  </div>
                  <div className="text-center p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <div className="text-lg font-bold text-blue-400">{userCredits}</div>
                    <div className="text-xs text-muted-foreground">Créditos Comprados</div>
                  </div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Comprado:</span>
                    <span className="text-primary font-bold">{totalCreditsPurchased}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total Usado:</span>
                    <span className="text-red-400 font-bold">{creditsUsed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Restante:</span>
                    <span className="text-green-400 font-bold">{totalAvailableCredits}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

        {/* Document Viewer Modal */}
        <DocumentViewer
          documentId={selectedDocumentId}
          isOpen={isDocumentViewerOpen}
          onClose={() => {
            setIsDocumentViewerOpen(false);
            setSelectedDocumentId(null);
          }}
        />
      </div>
    );
  }