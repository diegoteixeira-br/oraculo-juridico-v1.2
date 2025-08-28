import { useState, useEffect } from "react";
import { CreditCard, Check, Star, Crown, RefreshCw, ArrowLeft, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useProductTypes } from "@/hooks/useProductTypes";
export default function ComprarCreditosPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {
    toast
  } = useToast();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plano');
  const reason = searchParams.get('reason');
  const gateParam = searchParams.get('gate');
  const [showReason, setShowReason] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();
  usePageTitle();
  const {
    canPurchaseTokens
  } = useAccessControl();
  const {
    subscriptions,
    tokenPacks,
    formatPrice,
    loading
  } = useProductTypes();

  // Garantir que a página sempre abra no topo
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-selecionar o pacote se vier da URL
  useEffect(() => {
    if (selectedPlan) {
      setSelectedPackage(selectedPlan);
    }
  }, [selectedPlan]);

  // Mostrar motivo do redirecionamento (modal)
  useEffect(() => {
    if (reason === 'trial_expired' || reason === 'blocked') {
      setShowReason(true);
    }
  }, [reason]);
  const handlePurchaseRecharge = async (rechargeType: string) => {
    if (!canPurchaseTokens) {
      toast({
        title: 'Ação não permitida',
        description: 'Pacotes de recarga estão disponíveis apenas para assinantes do Plano Básico.',
        variant: 'destructive'
      });
      return;
    }
    try {
      setIsLoading(true);
      setSelectedPackage(rechargeType);
      console.log("🚀 Iniciando compra de recarga:", rechargeType);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { packageId: rechargeType }
      });

      if (error) throw error;

      if (data?.url) {
        console.log("✅ Redirecionando para Stripe:", data.url);
        // Redirecionar para o Stripe na mesma aba
        window.location.href = data.url;
      } else {
        throw new Error('URL de pagamento não recebida');
      }
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };
  const handleSubscribe = async () => {
    try {
      setSubLoading(true);

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: { planType: 'basico' }
      });

      if (error) throw error;

      if (data?.url) {
        console.log("✅ Redirecionando para Stripe:", data.url);
        // Redirecionar para o Stripe na mesma aba
        window.location.href = data.url;
      } else {
        throw new Error('URL de assinatura não recebida');
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a assinatura. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setSubLoading(false);
    }
  };
  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        // Redirecionar para o portal do cliente na mesma aba
        window.location.href = data.url;
      } else {
        throw new Error('URL do portal do cliente não recebida');
      }
    } catch (error) {
      console.error('❌ Erro ao abrir portal do cliente:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o portal do cliente.',
        variant: 'destructive'
      });
    } finally {
      setPortalLoading(false);
    }
  };
  const closeReasonModal = () => {
    setShowReason(false);
    // Remove query params to evitar reabrir o modal ao navegar para trás
    navigate('/comprar-creditos', {
      replace: true
    });
  };
  return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="text-white hover:bg-slate-700">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" alt="Oráculo Jurídico" className="h-6 sm:h-8 w-auto" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Comprar Tokens
                </h1>
                <p className="text-xs text-slate-300 hidden lg:block">
                  Escolha um plano mensal ou pacotes avulsos
                </p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Aviso de redirecionamento */}
      {showReason && <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeReasonModal} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md">
            <Card className="relative bg-background/95 border-border shadow-lg">
              <button aria-label="Fechar" className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground" onClick={closeReasonModal}>
                <X className="w-5 h-5" />
              </button>
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>{reason === 'trial_expired' ? 'Período Gratuito Expirado' : 'Acesso Restrito'}</CardTitle>
                <CardDescription>
                  {gateParam === 'chat' ? 'Para usar o Chat, ative sua assinatura.' : 'Você foi redirecionado porque este recurso é exclusivo para assinantes.'}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>}

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Informações iniciais */}
          <div className="text-center">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-3 max-w-lg mx-auto">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Como funciona:</strong> Tokens usados no chat e da resposta de áudio (caso utilizado)
              </p>
            </div>
          </div>

          {/* Planos de Assinatura */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Planos de Assinatura Mensal</h2>
              <p className="text-slate-300">Escolha o plano ideal para suas necessidades</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plano Básico */}
              <Card className="relative bg-slate-900/60 border-primary/50 shadow-lg shadow-primary/20 overflow-hidden">
                <CardHeader className="pt-6 pb-2 text-center">
                  <Badge className="bg-primary text-primary-foreground mb-2 w-fit mx-auto text-base px-3 py-1">
                    <Crown className="w-5 h-5 mr-1" />
                    Plano Básico
                  </Badge>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge className="bg-red-600 text-white px-2 py-1 text-sm">
                      50% OFF
                    </Badge>
                  </div>
                  <CardDescription className="text-white text-2xl lg:text-3xl font-bold flex items-center justify-center gap-3">
                    <span className="line-through text-lg text-muted-foreground">R$ 119,80/mês</span>
                    <span>R$ 59,90/mês</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-primary" />
                      <span>30.000 tokens por mês</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Calculadoras ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Documentos Jurídicos ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Agenda de Compromissos com IA ilimitada</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-primary" />
                      <span>Renovação automática. Cancele quando quiser.</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-primary" />
                      <span>7 dias com reembolso garantido</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <Button onClick={handleSubscribe} disabled={subLoading} className="w-full h-12 text-lg">
                      {subLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Redirecionando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Assinar Plano Básico
                        </div>
                      )}
                    </Button>
                    <Button onClick={handleManageSubscription} disabled={portalLoading} variant="secondary" className="w-full">
                      {portalLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Abrindo portal...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Gerenciar assinatura
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Plano Profissional */}
              <Card className="relative bg-gradient-to-br from-amber-900/20 to-amber-800/20 border-amber-500/50 shadow-lg shadow-amber-500/20 overflow-hidden">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-amber-600 text-white px-3 py-1 text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    Recomendado
                  </Badge>
                </div>
                
                <CardHeader className="pt-8 pb-2 text-center">
                  <Badge className="bg-amber-600 text-white mb-2 w-fit mx-auto text-base px-3 py-1">
                    <Crown className="w-5 h-5 mr-1" />
                    Plano Profissional
                  </Badge>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge className="bg-green-600 text-white px-2 py-1 text-sm">
                      20% OFF
                    </Badge>
                  </div>
                  <CardDescription className="text-white text-2xl lg:text-3xl font-bold flex items-center justify-center gap-3">
                    <span className="line-through text-lg text-muted-foreground">R$ 121,25/mês</span>
                    <span className="text-amber-400">R$ 97,00/mês</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-amber-400" />
                      <span className="text-amber-100"><strong>Tokens Ilimitados</strong> (política de uso justo)</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-amber-400" />
                      <span>Calculadoras ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-amber-400" />
                      <span>Documentos Jurídicos ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-amber-400" />
                      <span>Agenda de Compromissos com IA ilimitada</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-amber-400" />
                      <span>Suporte prioritário</span>
                    </div>
                    <div className="flex items-center gap-2 text-base">
                      <Check className="w-5 h-5 text-amber-400" />
                      <span>7 dias com reembolso garantido</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-3">
                    <Button disabled className="w-full h-12 text-lg bg-amber-600 hover:bg-amber-700">
                      <div className="flex items-center gap-2">
                        <Crown className="w-5 h-5" />
                        Em Breve
                      </div>
                    </Button>
                    <p className="text-xs text-amber-200 text-center">
                      Plano será lançado em breve
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pacotes de Recarga para Plano Básico */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-2">Pacotes de Recarga</h2>
              <p className="text-slate-300 text-sm">Disponível apenas para assinantes do Plano Básico</p>
            </div>

            {!canPurchaseTokens && (
              <Card className="bg-amber-500/10 border-amber-500/30 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <p className="text-sm text-amber-200">
                      Pacotes de recarga estão disponíveis apenas para assinantes do Plano Básico.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recarga Rápida */}
              <Card className={`relative bg-slate-800 border-slate-700 transition-all duration-300 ${!canPurchaseTokens ? 'opacity-60' : ''}`}>
                <CardHeader className="text-center pt-6 pb-3">
                  <CardTitle className="text-lg font-bold text-blue-400">
                    Recarga Rápida
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-white">
                    25.000 tokens
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-blue-400">
                      R$ 29,90
                    </span>
                    <p className="text-xs text-muted-foreground">
                      R$ 1,20 por 1k tokens
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>25.000 tokens</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Sem expiração</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>Ativação imediata</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePurchaseRecharge('recarga-rapida')} 
                    disabled={isLoading || !canPurchaseTokens} 
                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading && selectedPackage === 'recarga-rapida' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirecionando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Comprar Recarga
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Recarga Inteligente */}
              <Card className={`relative bg-slate-800 border-green-500 shadow-lg shadow-green-500/20 transition-all duration-300 ${!canPurchaseTokens ? 'opacity-60' : ''}`}>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-3 py-1 text-sm">
                    <Star className="w-4 h-4 mr-1" />
                    Mais Vantajoso
                  </Badge>
                </div>
                
                <CardHeader className="text-center pt-8 pb-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Badge className="bg-green-600 text-white px-2 py-1 text-xs">
                      20% OFF
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-green-400">
                    Recarga Inteligente
                  </CardTitle>
                  <CardDescription className="text-2xl font-bold text-white">
                    50.000 tokens
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg font-medium text-muted-foreground line-through">
                        R$ 49,90
                      </span>
                      <span className="text-3xl font-bold text-green-400">
                        R$ 39,90
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R$ 0,80 por 1k tokens
                    </p>
                    <p className="text-xs text-green-400 font-medium">
                      Economia de R$ 10,00
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>50.000 tokens</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>Sem expiração</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>Ativação imediata</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="font-medium">Melhor custo-benefício</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePurchaseRecharge('recarga-inteligente')} 
                    disabled={isLoading || !canPurchaseTokens} 
                    className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                  >
                    {isLoading && selectedPackage === 'recarga-inteligente' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Redirecionando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Comprar Recarga
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 text-center max-w-md mx-auto">
            <h3 className="text-sm sm:text-base font-semibold text-primary mb-1 sm:mb-2">Pagamento Seguro</h3>
            <p className="text-xs text-muted-foreground mb-2 sm:mb-3">
              Processamento via Stripe com criptografia SSL.
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <span>🔒 SSL</span>
              <span>💳 Cartão</span>
              <span>🔄 Instantâneo</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
}