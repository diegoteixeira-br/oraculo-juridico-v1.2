import { useState } from "react";
import { Eye, EyeOff, Save, Trash2, ArrowLeft, User, Lock, AlertTriangle, Phone, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

export default function MinhaContaPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();

  const getTrialDaysRemaining = () => {
    if (!profile?.trial_end_date) return 0;
    const trialEnd = new Date(profile.trial_end_date);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isTrialActive = profile?.subscription_status === 'trial' && trialDaysRemaining > 0;

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

  const handleCancelSubscription = async () => {
    setIsDeletingAccount(true);

    try {
      const { data } = await supabase.functions.invoke('cancel-subscription');
      
      if (data?.success) {
        toast({
          title: "Assinatura cancelada",
          description: "Sua assinatura foi cancelada. Você pode continuar usando durante o período gratuito.",
        });
        // Recarregar a página para atualizar o status
        window.location.reload();
      } else {
        throw new Error(data?.error || "Erro ao cancelar assinatura");
      }
    } catch (error) {
      console.error("Erro ao cancelar assinatura:", error);
      toast({
        title: "Erro ao cancelar",
        description: "Ocorreu um erro ao cancelar a assinatura. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
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
          {isTrialActive && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="font-medium text-amber-500">
                  Período Gratuito: {trialDaysRemaining} dias restantes
                </span>
              </div>
              <p className="text-sm text-amber-600 mt-2 text-center">
                Aproveite todos os recursos sem custo até {new Date(profile!.trial_end_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}
        </div>

        {/* Subscription Status Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Status da Assinatura
            </CardTitle>
            <CardDescription>
              Informações sobre seu plano atual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={profile?.subscription_status === 'active' ? 'default' : 'secondary'}>
                {profile?.subscription_status === 'active' ? 'Ativo' : 
                 profile?.subscription_status === 'trial' ? 'Período Gratuito' : 'Inativo'}
              </Badge>
            </div>
            
            {profile?.subscription_status === 'trial' && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Teste gratuito termina em:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(profile.trial_end_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            
            {profile?.subscription_status === 'active' && profile.subscription_end_date && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Próxima cobrança:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(profile.subscription_end_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-600">
              {isTrialActive ? (
                <Button className="w-full bg-primary hover:bg-primary/90">
                  Assinar Agora - R$ 97,00/mês
                </Button>
              ) : (
                <Button variant="outline" className="w-full">
                  Gerenciar Assinatura
                </Button>
              )}
            </div>
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

        {/* Danger Zone Card - More discrete */}
        <Card className="bg-slate-800/30 border-slate-600/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Cancelar Assinatura
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Cancelar pagamentos recorrentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-slate-700/20 border border-slate-600/30 rounded-md">
                <h3 className="font-medium text-slate-300 mb-1 text-sm">Cancelar Pagamento do Cartão</h3>
                <p className="text-xs text-slate-500 mb-3">
                  Cancelar cobranças recorrentes no cartão de crédito.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs bg-slate-700/50 hover:bg-slate-600/50 border-slate-600">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Cancelar Assinatura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-slate-800 border-slate-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-300">
                        Cancelar Assinatura?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso cancelará sua assinatura e interromperá os pagamentos recorrentes.
                        Você manterá acesso até o final do período já pago.
                        <br /><br />
                        <strong>Importante:</strong> Sua conta permanecerá ativa e você poderá usar os 7 dias gratuitos caso ainda não tenha utilizado.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600">
                        Manter Assinatura
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-slate-600 hover:bg-slate-500"
                        disabled={isDeletingAccount}
                      >
                        {isDeletingAccount ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Cancelando...
                          </div>
                        ) : (
                          "Confirmar Cancelamento"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}