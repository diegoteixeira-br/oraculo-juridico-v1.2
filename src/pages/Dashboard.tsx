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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userCredits, setUserCredits] = useState(0);
  const [dailyCredits, setDailyCredits] = useState(0);
  const [totalCreditsPurchased, setTotalCreditsPurchased] = useState(0);

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
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    loadUserData();
  }, [user?.id]);

  const chartData = [
    { name: 'Créditos Diários', value: dailyCredits, color: '#10b981' },
    { name: 'Créditos Comprados', value: userCredits, color: '#3b82f6' }
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
                Templates prontos para download - Disponível para usuários premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Template 1 - Contrato de Prestação de Serviços */}
                <div className="group bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <div className="aspect-[3/4] bg-white rounded mb-3 flex items-center justify-center">
                    <div className="text-slate-800 text-xs text-center p-2">
                      <div className="font-bold mb-2">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
                      <div className="space-y-1 text-[8px]">
                        <div className="border-b border-slate-300 pb-1">Contratante: _______________</div>
                        <div className="border-b border-slate-300 pb-1">Contratado: _______________</div>
                        <div className="text-left space-y-1">
                          <div>1. DO OBJETO</div>
                          <div>2. DAS OBRIGAÇÕES</div>
                          <div>3. DO PAGAMENTO</div>
                          <div>4. DA VIGÊNCIA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Contrato de Prestação de Serviços</h3>
                  <p className="text-xs text-muted-foreground mb-3">Modelo completo para formalizar prestação de serviços</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>

                {/* Template 2 - Petição Inicial */}
                <div className="group bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <div className="aspect-[3/4] bg-white rounded mb-3 flex items-center justify-center">
                    <div className="text-slate-800 text-xs text-center p-2">
                      <div className="font-bold mb-2">PETIÇÃO INICIAL</div>
                      <div className="space-y-1 text-[8px]">
                        <div className="border-b border-slate-300 pb-1">Exmo. Sr. Dr. Juiz de Direito</div>
                        <div className="text-left space-y-1">
                          <div>Requerente: _______________</div>
                          <div>Requerido: _______________</div>
                          <div className="mt-2">DOS FATOS:</div>
                          <div>DO DIREITO:</div>
                          <div>DOS PEDIDOS:</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Petição Inicial Cível</h3>
                  <p className="text-xs text-muted-foreground mb-3">Template para ações cíveis em geral</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>

                {/* Template 3 - Procuração */}
                <div className="group bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <div className="aspect-[3/4] bg-white rounded mb-3 flex items-center justify-center">
                    <div className="text-slate-800 text-xs text-center p-2">
                      <div className="font-bold mb-2">PROCURAÇÃO</div>
                      <div className="space-y-1 text-[8px]">
                        <div className="text-left space-y-1">
                          <div>Outorgante: _______________</div>
                          <div>Outorgado: _______________</div>
                          <div className="mt-2">PODERES:</div>
                          <div>□ Receber citação</div>
                          <div>□ Contestar</div>
                          <div>□ Transigir</div>
                          <div>□ Receber</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Procuração Judicial</h3>
                  <p className="text-xs text-muted-foreground mb-3">Modelo de procuração para representação judicial</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>

                {/* Template 4 - Acordo Extrajudicial */}
                <div className="group bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <div className="aspect-[3/4] bg-white rounded mb-3 flex items-center justify-center">
                    <div className="text-slate-800 text-xs text-center p-2">
                      <div className="font-bold mb-2">ACORDO EXTRAJUDICIAL</div>
                      <div className="space-y-1 text-[8px]">
                        <div className="border-b border-slate-300 pb-1">Parte 1: _______________</div>
                        <div className="border-b border-slate-300 pb-1">Parte 2: _______________</div>
                        <div className="text-left space-y-1">
                          <div>1. DO OBJETO</div>
                          <div>2. DAS CONDIÇÕES</div>
                          <div>3. DO PAGAMENTO</div>
                          <div>4. DAS PENALIDADES</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Acordo Extrajudicial</h3>
                  <p className="text-xs text-muted-foreground mb-3">Modelo para acordos fora do âmbito judicial</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>

                {/* Template 5 - Notificação Extrajudicial */}
                <div className="group bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <div className="aspect-[3/4] bg-white rounded mb-3 flex items-center justify-center">
                    <div className="text-slate-800 text-xs text-center p-2">
                      <div className="font-bold mb-2">NOTIFICAÇÃO EXTRAJUDICIAL</div>
                      <div className="space-y-1 text-[8px]">
                        <div className="border-b border-slate-300 pb-1">Notificante: _______________</div>
                        <div className="border-b border-slate-300 pb-1">Notificado: _______________</div>
                        <div className="text-left space-y-1">
                          <div>1. DOS FATOS</div>
                          <div>2. DA NOTIFICAÇÃO</div>
                          <div>3. DO PRAZO</div>
                          <div>4. DAS CONSEQUÊNCIAS</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Notificação Extrajudicial</h3>
                  <p className="text-xs text-muted-foreground mb-3">Para comunicar formalmente descumprimentos</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>

                {/* Template 6 - Contrato de Locação */}
                <div className="group bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <div className="aspect-[3/4] bg-white rounded mb-3 flex items-center justify-center">
                    <div className="text-slate-800 text-xs text-center p-2">
                      <div className="font-bold mb-2">CONTRATO DE LOCAÇÃO</div>
                      <div className="space-y-1 text-[8px]">
                        <div className="border-b border-slate-300 pb-1">Locador: _______________</div>
                        <div className="border-b border-slate-300 pb-1">Locatário: _______________</div>
                        <div className="text-left space-y-1">
                          <div>1. DO IMÓVEL</div>
                          <div>2. DO ALUGUEL</div>
                          <div>3. DAS OBRIGAÇÕES</div>
                          <div>4. DA GARANTIA</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">Contrato de Locação</h3>
                  <p className="text-xs text-muted-foreground mb-3">Modelo para locação de imóveis residenciais</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
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

          {/* Pie Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Distribuição de Créditos</CardTitle>
              <CardDescription>
                Visualização dos seus créditos por tipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}