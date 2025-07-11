import { useState, useEffect } from "react";
import { Eye, EyeOff, Save, ArrowLeft, User, Lock, CreditCard, History, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CreditTransaction {
  id: string;
  transaction_type: 'purchase' | 'usage' | 'bonus';
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

export default function MinhaContaPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut, refreshProfile } = useAuth();
  
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Sistema de créditos - valores reais do banco
  const userCredits = profile?.credits || 0;
  const totalCreditsPurchased = profile?.total_credits_purchased || 0;

  // Carregar transações do usuário
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.id) return;
      
      setLoadingTransactions(true);
      try {
        const { data, error } = await supabase
          .from('credit_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setTransactions((data || []) as CreditTransaction[]);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadTransactions();
  }, [user?.id]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erro na confirmação",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simular mudança de senha
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Senha alterada com sucesso!",
      description: "Sua senha foi atualizada.",
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
        </div>

        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Minha Conta</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações e dados da conta
          </p>
          <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">
                {userCredits} créditos disponíveis
              </span>
            </div>
            <p className="text-sm text-primary/80 mt-2 text-center">
              Total comprado: {totalCreditsPurchased} créditos
            </p>
          </div>
        </div>

        {/* Credits Status Card */}
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
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">{userCredits}</div>
                <div className="text-sm text-muted-foreground">Créditos Disponíveis</div>
              </div>
              <div className="text-center p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                <div className="text-2xl font-bold text-secondary-foreground">{totalCreditsPurchased}</div>
                <div className="text-sm text-muted-foreground">Total Comprado</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Custo por pesquisa:</span>
              <span className="text-sm text-muted-foreground">
                1 crédito
              </span>
            </div>
            
            <div className="pt-4 border-t border-slate-600 flex gap-2">
              <Button 
                onClick={() => navigate("/comprar-creditos")}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Comprar Mais Créditos
              </Button>
              <Button 
                onClick={() => refreshProfile()}
                variant="outline"
                size="sm"
              >
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Transações */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Transações
            </CardTitle>
            <CardDescription>
              Últimas 10 transações de créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTransactions ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={transaction.transaction_type === 'purchase' ? 'default' : 'secondary'}
                          className={transaction.transaction_type === 'purchase' ? 'bg-green-600' : 'bg-orange-600'}
                        >
                          {transaction.transaction_type === 'purchase' ? 'Compra' : 'Uso'}
                        </Badge>
                        <span className="text-sm font-medium">
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} créditos
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações da Conta
            </CardTitle>
            <CardDescription>
              Dados básicos da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={profile?.full_name || user?.email || ""}
                  className="bg-slate-700 border-slate-600 focus:border-primary"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  className="bg-slate-700 border-slate-600 focus:border-primary"
                  disabled
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Para alterar essas informações, entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Mantenha sua conta segura alterando sua senha regularmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Alterando senha...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Alterar Senha
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}