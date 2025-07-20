import { useState, useEffect } from "react";
import { History, CreditCard, Download, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "@/components/UserMenu";

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
  
  const { user } = useAuth();
  const { toast } = useToast();

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
        return 'Compra Cakto';
      case 'daily_usage':
        return 'Uso Diário';
      case 'usage':
        return 'Uso';
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
        new Date(transaction.created_at).toLocaleDateString('pt-BR'),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={exportTransactions}
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <UserMenu />
        </div>

        {/* Title */}
        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Histórico de Transações</h1>
          <p className="text-muted-foreground">
            Visualize todas as suas transações de créditos
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar por descrição</Label>
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de transação</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type" className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="purchase">Compra Cakto</SelectItem>
                    <SelectItem value="daily_usage">Uso Diário</SelectItem>
                    <SelectItem value="usage">Uso</SelectItem>
                    <SelectItem value="bonus">Bônus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Período</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="date" className="bg-slate-700 border-slate-600">
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

        {/* Transactions List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Transações ({filteredTransactions.length})
            </CardTitle>
            <CardDescription>
              {filteredTransactions.length === transactions.length 
                ? "Todas as transações" 
                : `${filteredTransactions.length} de ${transactions.length} transações`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Carregando transações...</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 bg-secondary/10 rounded-lg border border-secondary/20 hover:bg-secondary/20 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="secondary"
                            className={getTransactionTypeBadgeColor(transaction.transaction_type)}
                          >
                            {getTransactionTypeLabel(transaction.transaction_type)}
                          </Badge>
                          <span className={`text-lg font-bold ${
                            transaction.amount > 0 ? 'text-green-400' : 'text-orange-400'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} créditos
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      <p className="text-sm text-foreground mb-2">
                        {transaction.description}
                      </p>
                      
                      {transaction.transaction_type === 'purchase' && (
                        <p className="text-xs text-green-400 font-medium">
                          Compra realizada via Cakto • Quantidade: {transaction.amount} créditos
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          Status: {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  Nenhuma transação encontrada
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || typeFilter !== "all" || dateFilter !== "all" 
                    ? "Tente ajustar os filtros para encontrar suas transações"
                    : "Você ainda não possui transações de créditos"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}