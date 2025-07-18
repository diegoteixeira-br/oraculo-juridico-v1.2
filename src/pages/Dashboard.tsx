import { useState, useEffect } from "react";
import { CreditCard, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
      <div className="max-w-4xl mx-auto space-y-6">

        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-20 w-auto mx-auto mb-4"
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

        {/* Credits Details Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-slate-800 border-slate-700 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/chat")}>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Iniciar Consulta</h3>
              <p className="text-muted-foreground text-sm">Faça uma nova pergunta jurídica</p>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800 border-slate-700 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate("/minha-conta")}>
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Minha Conta</h3>
              <p className="text-muted-foreground text-sm">Gerencie suas configurações</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}