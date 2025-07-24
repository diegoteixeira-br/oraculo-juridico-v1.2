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
          .select('tokens, daily_tokens, plan_tokens, plan_type')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          // Os valores já são tokens, não precisam conversão
          setUserCredits(Number(profile.plan_tokens || 0));
          setDailyCredits(Number(profile.daily_tokens || 0));
          setTotalCreditsPurchased(Number(profile.plan_tokens || 0));
        }

        // Calcular tokens realmente usados baseado no histórico de transações
        const { data: transactions } = await supabase
          .from('credit_transactions')
          .select('amount, transaction_type')
          .eq('user_id', user.id);

        if (transactions) {
          let totalUsed = 0;
          transactions.forEach(transaction => {
            if (transaction.transaction_type === 'usage' || 
                transaction.transaction_type === 'daily_usage') {
              totalUsed += Math.abs(transaction.amount); // Usar valor absoluto pois são negativos
            }
          });
          setCreditsUsed(totalUsed);
        } else {
          setCreditsUsed(0);
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
    { name: 'Tokens Disponíveis', value: Math.floor(totalAvailableCredits), color: '#10b981' },
    { name: 'Tokens Usados', value: Math.floor(creditsUsed), color: '#ef4444' }
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
                  • O custo varia de acordo com o tamanho da consulta
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

        {/* Documentos Pré-feitos - só aparece se tem mais de 3.000 tokens */}
        {totalAvailableCredits > 3000 && (
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
                  <div className="flex gap-4 w-max">
                    {legalDocuments.filter(doc => {
                      const requiredTokens = doc.min_tokens_required || 3000;
                      return totalAvailableCredits >= requiredTokens;
                    }).map((doc) => (
                      <div 
                        key={doc.id} 
                        className="cursor-pointer hover:scale-105 transition-all flex-shrink-0"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        {/* Documento em formato A4 miniatura */}
                        <div className="bg-white rounded-lg shadow-lg border border-gray-300 p-3 w-40 h-52 relative overflow-hidden">
                          {/* Cabeçalho do documento */}
                          <div className="text-center border-b-2 border-gray-300 pb-2 mb-3">
                            <h1 className="font-bold text-xs text-gray-800 uppercase tracking-wide">
                              {doc.title}
                            </h1>
                          </div>
                          
                          {/* Conteúdo do documento simulado */}
                          <div className="text-[6px] leading-tight text-gray-700 space-y-1">
                            {doc.category === 'contrato' && (
                              <>
                                <div className="font-semibold">CONTRATANTE:</div>
                                <div className="border-b border-gray-200 h-2"></div>
                                <div className="font-semibold mt-2">CONTRATADO:</div>
                                <div className="border-b border-gray-200 h-2"></div>
                                <div className="font-semibold mt-2">CLÁUSULA 1ª - DO OBJETO</div>
                                <div className="text-gray-500">O presente contrato tem por objeto...</div>
                                <div className="border-b border-gray-200 h-1 mt-1"></div>
                                <div className="font-semibold mt-2">CLÁUSULA 2ª - OBRIGAÇÕES</div>
                                <div className="text-gray-500">O CONTRATADO se obriga a...</div>
                                <div className="border-b border-gray-200 h-1 mt-1"></div>
                                <div className="font-semibold mt-2">CLÁUSULA 3ª - PAGAMENTO</div>
                                <div className="text-gray-500">Pelos serviços prestados...</div>
                              </>
                            )}
                            {doc.category === 'peticao' && (
                              <>
                                <div className="text-right font-semibold">Exmo. Sr. Juiz de Direito</div>
                                <div className="text-center font-semibold mt-2">{doc.title}</div>
                                <div className="mt-2">
                                  <div className="font-semibold">Requerente:</div>
                                  <div className="border-b border-gray-200 h-2"></div>
                                </div>
                                <div className="mt-2">
                                  <div className="font-semibold">DOS FATOS:</div>
                                  <div className="text-gray-500">Vem o requerente...</div>
                                  <div className="border-b border-gray-200 h-1 mt-1"></div>
                                </div>
                                <div className="mt-2">
                                  <div className="font-semibold">DOS PEDIDOS:</div>
                                  <div className="text-gray-500">Requer...</div>
                                </div>
                              </>
                            )}
                            {doc.category === 'procuracao' && (
                              <>
                                <div className="text-center font-bold">PROCURAÇÃO</div>
                                <div className="mt-2">
                                  <div className="font-semibold">OUTORGANTE:</div>
                                  <div className="border-b border-gray-200 h-2"></div>
                                </div>
                                <div className="mt-2">
                                  <div className="font-semibold">OUTORGADO:</div>
                                  <div className="border-b border-gray-200 h-2"></div>
                                </div>
                                <div className="mt-2">
                                  <div className="font-semibold">PODERES:</div>
                                  <div className="text-gray-500">☐ Representar em juízo</div>
                                  <div className="text-gray-500">☐ Assinar documentos</div>
                                  <div className="text-gray-500">☐ Receber valores</div>
                                </div>
                              </>
                            )}
                            {doc.category === 'documento' && (
                              <>
                                <div className="text-center font-bold">DECLARAÇÃO</div>
                                <div className="mt-3 text-gray-600">
                                  <div>Eu, _________________,</div>
                                  <div className="mt-1">declaro para os devidos fins que</div>
                                  <div className="border-b border-gray-200 h-2 mt-1"></div>
                                  <div className="border-b border-gray-200 h-2 mt-1"></div>
                                  <div className="border-b border-gray-200 h-2 mt-1"></div>
                                </div>
                                <div className="mt-4 text-right">
                                  <div>________________, __ de _______ de ____</div>
                                  <div className="mt-2">_________________________</div>
                                  <div className="text-center">Assinatura</div>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Rodapé com informações */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-slate-800 text-white px-2 py-1 rounded text-[8px] flex justify-between items-center">
                              <span className="capitalize">{doc.category}</span>
                              <span>{doc.min_tokens_required || 3000} tokens</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Título abaixo do documento */}
                        <div className="mt-2 text-center">
                          <h3 className="font-semibold text-xs text-white truncate w-40">
                            {doc.title}
                          </h3>
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

        {/* Credit Overview Banner */}
        <div className="mt-4 p-6 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl">
          <div className="flex items-center gap-3 justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
            <div className="text-center">
              <span className="text-2xl font-bold text-primary block">
                {Math.floor(totalAvailableCredits).toLocaleString()} tokens disponíveis
              </span>
            </div>
          </div>
          <p className="text-center text-primary/80 mt-2">
            {dailyCredits > 0 && (
              <span>{Math.floor(dailyCredits)} tokens diários + </span>
            )}
            {Math.floor(userCredits)} tokens do plano
          </p>
        </div>

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
                  <div className="text-3xl font-bold text-primary">{Math.floor(totalAvailableCredits)}</div>
                  <div className="text-sm text-muted-foreground">Total Disponíveis</div>
                  <div className="text-xs text-primary/70 mt-1">{Math.floor(totalAvailableCredits).toLocaleString()} tokens</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-600/10 rounded-lg border border-green-600/20">
                    <div className="text-2xl font-bold text-green-400">{Math.floor(dailyCredits)}</div>
                    <div className="text-xs text-muted-foreground">Tokens Diários</div>
                    <div className="text-xs text-green-400/70">{Math.floor(dailyCredits).toLocaleString()} tokens</div>
                  </div>
                  <div className="text-center p-4 bg-blue-600/10 rounded-lg border border-blue-600/20">
                    <div className="text-2xl font-bold text-blue-400">{Math.floor(userCredits)}</div>
                    <div className="text-xs text-muted-foreground">Tokens do Plano</div>
                    <div className="text-xs text-blue-400/70">{Math.floor(userCredits).toLocaleString()} tokens</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-4 border-t border-slate-600">
                <span className="font-medium">Custo por pesquisa:</span>
                <span className="text-primary font-bold">Variável por consulta</span>
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
              <CardTitle>Distribuição de Tokens</CardTitle>
              <CardDescription>
                Análise completa do uso dos seus tokens
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
                        `${Number(value).toLocaleString()} token${value !== 1 ? 's' : ''}`, 
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
                     <div className="text-2xl font-bold text-green-400">{Math.floor(totalAvailableCredits).toLocaleString()}</div>
                     <div className="text-sm text-muted-foreground">Tokens Disponíveis</div>
                   </div>
                   <div className="text-center p-4 bg-red-600/10 rounded-lg border border-red-600/20">
                     <div className="text-2xl font-bold text-red-400">{Math.floor(creditsUsed).toLocaleString()}</div>
                     <div className="text-sm text-muted-foreground">Tokens Usados</div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-3 bg-emerald-600/10 rounded-lg border border-emerald-600/20">
                     <div className="text-lg font-bold text-emerald-400">{Math.floor(dailyCredits)}</div>
                     <div className="text-xs text-muted-foreground">Créditos Diários</div>
                   </div>
                   <div className="text-center p-3 bg-blue-600/10 rounded-lg border border-blue-600/20">
                     <div className="text-lg font-bold text-blue-400">{Math.floor(userCredits)}</div>
                     <div className="text-xs text-muted-foreground">Créditos Comprados</div>
                   </div>
                 </div>

                 <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-medium">Total Comprado:</span>
                     <span className="text-primary font-bold">{Math.floor(totalCreditsPurchased)}</span>
                   </div>
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-medium">Total Usado:</span>
                     <span className="text-red-400 font-bold">{Math.floor(creditsUsed)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-medium">Restante:</span>
                     <span className="text-green-400 font-bold">{Math.floor(totalAvailableCredits)}</span>
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