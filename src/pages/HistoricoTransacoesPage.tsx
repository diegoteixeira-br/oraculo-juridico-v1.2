import { useState, useEffect } from "react";
import { History, CreditCard, Download, Filter, Calendar, ArrowLeft, TrendingUp, Zap, FileText, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import UserMenu from "@/components/UserMenu";
import { useUserTimezone } from "@/hooks/useUserTimezone";

interface CreditTransaction {
  id: string;
  transaction_type: 'purchase' | 'usage' | 'bonus' | 'daily_usage';
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

export default function HistoricoTransacoesPage() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<CreditTransaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formatDateInUserTimezone } = useUserTimezone();

  // Carregar todas as transações
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.id) return;
      
      setLoadingTransactions(true);
      try {
        const { data, error } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        const transactionsData = (data || []) as CreditTransaction[];
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } catch (error) {
        console.error('Error loading transactions:', error);
        toast({
          title: "Erro ao carregar transações",
          description: "Não foi possível carregar o histórico de transações.",
          variant: "destructive",
        });
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadTransactions();
  }, [user?.id, toast]);

  // Filtrar transações
  useEffect(() => {
    let filtered = transactions;

    // Filtro por tipo
    if (typeFilter !== "all") {
      filtered = filtered.filter(transaction => transaction.transaction_type === typeFilter);
    }

    // Filtro por data
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      if (dateFilter !== "all") {
        filtered = filtered.filter(transaction => 
          new Date(transaction.created_at) >= filterDate
        );
      }
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, typeFilter, dateFilter, searchTerm]);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Compra Stripe';
      case 'daily_usage':
        return 'Uso do Teste (7 dias)';
      case 'usage':
        return 'Uso do Plano Mensal';
      case 'bonus':
        return 'Bônus';
      default:
        return type;
    }
  };

  const getTransactionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'bg-green-600 hover:bg-green-600/80';
      case 'daily_usage':
        return 'bg-blue-600 hover:bg-blue-600/80';
      case 'usage':
        return 'bg-orange-600 hover:bg-orange-600/80';
      case 'bonus':
        return 'bg-purple-600 hover:bg-purple-600/80';
      default:
        return 'bg-gray-600 hover:bg-gray-600/80';
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Data', 'Tipo', 'Descrição', 'Valor', 'Status'],
      ...filteredTransactions.map(transaction => [
        formatDateInUserTimezone(new Date(transaction.created_at), 'dd/MM/yyyy'),
        getTransactionTypeLabel(transaction.transaction_type),
        transaction.description,
        transaction.amount.toString(),
        transaction.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-transacoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalTokens = (profile?.token_balance || 0) + (profile?.plan_tokens || 0);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
                width="160"
                height="40"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Histórico de Transações
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Visualize todas as transações do seu teste (7 dias) e do plano mensal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Contador de tokens */}
              <div className="hidden md:flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white">
                  {Math.floor(totalTokens).toLocaleString()}
                </span>
                <span className="text-xs text-slate-300">tokens</span>
              </div>
              
              <Button
                onClick={exportTransactions}
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              
              <UserMenu hideOptions={["historico"]} />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de informações sobre transações */}
          <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-600/20 rounded-xl">
                    <TrendingUp className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Histórico Completo</h3>
                    <p className="text-sm text-slate-300">
                      Todas as suas transações de tokens organizadas
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white">
                  {filteredTransactions.length} transações
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-green-400">Compras</div>
                  <div className="text-xs text-slate-400">Assinatura/Stripe</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">Uso do Teste (7 dias)</div>
                  <div className="text-xs text-slate-400">Tokens do teste (requer cartão)</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-orange-400">Uso do Plano Mensal</div>
                  <div className="text-xs text-slate-400">Tokens do plano</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">Bônus</div>
                  <div className="text-xs text-slate-400">Tokens extras</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="w-5 h-5 text-primary" />
                Filtros
              </CardTitle>
              <CardDescription>
                Filtre suas transações por tipo, período ou descrição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm text-slate-300">Buscar por descrição</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="search"
                      placeholder="Digite para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm text-slate-300">Tipo de transação</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger id="type" className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="purchase">Compra Stripe</SelectItem>
                      <SelectItem value="daily_usage">Uso do Teste (7 dias)</SelectItem>
                      <SelectItem value="usage">Uso do Plano Mensal</SelectItem>
                      <SelectItem value="bonus">Bônus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm text-slate-300">Período</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger id="date" className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os períodos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="3months">Últimos 3 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Transações */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg text-white">
                    Transações ({filteredTransactions.length})
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {filteredTransactions.length === transactions.length 
                    ? "Todas as transações" 
                    : `${filteredTransactions.length} de ${transactions.length} transações`
                  }
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-slate-400">Carregando transações...</p>
                </div>
              ) : filteredTransactions.length > 0 ? (
                <div className="space-y-4">
                  {filteredTransactions.slice(0, 50).map((transaction) => (
                    <div key={transaction.id} className="group p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-700/50 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-600/50 rounded-lg">
                            {transaction.transaction_type === 'purchase' && <CreditCard className="w-5 h-5 text-green-400" />}
                            {transaction.transaction_type === 'daily_usage' && <Calendar className="w-5 h-5 text-blue-400" />}
                            {transaction.transaction_type === 'usage' && <Zap className="w-5 h-5 text-orange-400" />}
                            {transaction.transaction_type === 'bonus' && <TrendingUp className="w-5 h-5 text-purple-400" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="secondary"
                                className={`${getTransactionTypeBadgeColor(transaction.transaction_type)} text-white text-xs`}
                              >
                                {getTransactionTypeLabel(transaction.transaction_type)}
                              </Badge>
                              <span className={`text-lg font-bold ${
                                transaction.amount > 0 ? 'text-green-400' : 'text-orange-400'
                              }`}>
                                {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} tokens
                              </span>
                            </div>
                            <p className="text-sm text-slate-300">
                              {transaction.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-sm text-slate-400 mb-1">
                             {formatDateInUserTimezone(new Date(transaction.created_at), 'dd/MM/yyyy')}
                           </div>
                           <div className="text-xs text-slate-500">
                             {formatDateInUserTimezone(new Date(transaction.created_at), 'HH:mm')}
                           </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-slate-600/30">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-400">
                            Status: {transaction.status}
                          </Badge>
                          {transaction.transaction_type === 'purchase' && (
                            <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                              Stripe
                            </Badge>
                          )}
                        </div>
                        
                        {transaction.transaction_type === 'purchase' && (
                          <div className="text-xs text-green-400 font-medium">
                            Compra confirmada • {Math.abs(transaction.amount).toLocaleString()} tokens
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <CreditCard className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    Nenhuma transação encontrada
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    {searchTerm || typeFilter !== "all" || dateFilter !== "all" 
                      ? "Tente ajustar os filtros para encontrar suas transações"
                      : "Você ainda não possui transações de tokens. Comece fazendo uma consulta ou comprando tokens!"
                    }
                  </p>
                  
                  {!searchTerm && typeFilter === "all" && dateFilter === "all" && (
                    <div className="mt-6 space-y-3">
                      <Button 
                        onClick={() => navigate("/chat")}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Fazer Primeira Consulta
                      </Button>
                      <Button 
                        onClick={() => navigate("/comprar-creditos")}
                        variant="outline"
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Comprar Tokens
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações sobre tokens */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-200 mb-2">Como Funcionam os Tokens</h4>
                  <div className="space-y-1 text-sm text-blue-300/80">
                    <p>• <strong>Teste (7 dias):</strong> 15.000 tokens válidos por 7 dias (requer cartão)</p>
                    <p>• <strong>Plano Mensal:</strong> 30.000 tokens/mês; renovação mensal automática</p>
                    <p>• <strong>Ordem de Uso:</strong> Durante o teste, usamos primeiro os tokens do teste; depois os do plano</p>
                    <p>• <strong>Custo Variável:</strong> Cada consulta consome tokens conforme o tamanho</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}