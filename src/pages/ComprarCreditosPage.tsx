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
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plano');
  const reason = searchParams.get('reason');
  const gateParam = searchParams.get('gate');
  const [showReason, setShowReason] = useState(false);
  const [subLoading, setSubLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();
  usePageTitle();
  const { canPurchaseTokens } = useAccessControl();
  const { subscriptions, tokenPacks, formatPrice, loading } = useProductTypes();

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
  const handlePurchase = async (productTypeId: string) => {
    if (!canPurchaseTokens) {
      toast({
        title: 'Ação não permitida',
        description: 'A compra de tokens está disponível apenas para assinantes ativos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      setSelectedPackage(productTypeId);

      console.log("🚀 Iniciando compra de tokens:", productTypeId);
      
      // Encontrar o produto para determinar qual link usar
      const selectedProduct = tokenPacks.find(pack => pack.id === productTypeId);
      
      if (!selectedProduct) {
        throw new Error('Produto não encontrado');
      }

      let stripeUrl = '';
      
      // Links diretos do Stripe baseados no nome do produto
      if (selectedProduct.name === 'Pacote Básico') {
        stripeUrl = 'https://buy.stripe.com/4gMfZia1z1hAccD1VY5AQ00';
      } else if (selectedProduct.name === 'Pacote Premium') {
        stripeUrl = 'https://buy.stripe.com/4gMfZi5Lj5xQ1xZ8km5AQ01';
      } else {
        throw new Error('Link de pagamento não configurado para este produto');
      }

      console.log("✅ Redirecionando para:", stripeUrl);
      // Redirecionar para o link do Stripe na mesma aba
      window.location.href = stripeUrl;
      
    } catch (error) {
      console.error('❌ Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  const handleSubscribe = async () => {
    try {
      setSubLoading(true);
      
      // Link direto do Stripe para a assinatura Essencial
      const stripeUrl = 'https://buy.stripe.com/cNi00k4Hf2lE1xZbwy5AQ02';
      
      console.log("✅ Redirecionando para assinatura:", stripeUrl);
      // Redirecionar para o link do Stripe na mesma aba
      window.location.href = stripeUrl;
      
    } catch (error) {
      console.error('❌ Erro ao iniciar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a assinatura. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSubLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke('customer-portal');
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
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };
  const closeReasonModal = () => {
    setShowReason(false);
    // Remove query params to evitar reabrir o modal ao navegar para trás
    navigate('/comprar-creditos', { replace: true });
  };

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
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-6 sm:h-8 w-auto"
              />
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
      {showReason && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeReasonModal} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md">
            <Card className="relative bg-background/95 border-border shadow-lg">
              <button
                aria-label="Fechar"
                className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
                onClick={closeReasonModal}
              >
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
        </div>
      )}

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

          {/* Plano de Assinatura Essencial */}
          <div className="max-w-4xl mx-auto">
            <Card className="relative bg-slate-900/60 border-primary/50 shadow-lg shadow-primary/20 overflow-hidden">
              <CardHeader className="pt-6 pb-2 text-center">
                <Badge className="bg-primary text-primary-foreground mb-2 w-fit mx-auto text-base px-3 py-1">
                  <Crown className="w-5 h-5 mr-1" />
                  Plano Essencial
                </Badge>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge className="bg-red-600 text-white px-2 py-1 text-sm">
                    50% OFF
                  </Badge>
                  <span className="text-sm text-muted-foreground">Promoção por tempo limitado — pode acabar a qualquer momento.</span>
                </div>
                <CardDescription className="text-white text-3xl lg:text-4xl font-bold flex items-center justify-center gap-3">
                  <span className="line-through text-xl text-muted-foreground">R$ 75,80/mês</span>
                  <span>R$ 37,90/mês</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
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
                      <span>7 dias grátis: 15.000 tokens no período de teste</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Button onClick={handleSubscribe} disabled={subLoading} className="w-full sm:w-auto h-14 px-8 text-lg">
                      {subLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Redirecionando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-6 h-6" />
                          Assinar agora
                        </div>
                      )}
                    </Button>
                    <Button onClick={handleManageSubscription} disabled={portalLoading} variant="secondary" className="w-full sm:w-auto">
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
                </div>
                <div className="text-center mt-4 text-base text-muted-foreground">
                  Inclui 30.000 tokens/mês. Excedentes? Compre pacotes avulsos abaixo.
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pacotes de Tokens Extras */}
          <div className="max-w-4xl mx-auto">
            {!canPurchaseTokens && (
              <Card className="bg-amber-500/10 border-amber-500/30 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <p className="text-sm text-amber-200">
                      Pacotes de tokens extras estão disponíveis apenas para assinantes do plano Essencial.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Pacotes de Tokens */}
              {tokenPacks.map((tokenPack, index) => (
                <Card key={tokenPack.id} className={`relative bg-slate-800 border-slate-700 transition-all duration-300 h-fit ${index === 0 ? 'border-blue-500 shadow-lg shadow-blue-500/20' : ''} ${!canPurchaseTokens ? 'opacity-60' : ''}`}>
                  {index === 0 && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-2 py-1 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  {index === 1 && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-600 text-white px-2 py-1 text-xs">
                        20% OFF
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pt-4 sm:pt-6 pb-2 sm:pb-3">
                    <CardTitle className={`text-base sm:text-lg lg:text-xl font-bold ${index === 0 ? 'text-blue-400' : 'text-green-400'}`}>
                      {tokenPack.name}
                    </CardTitle>
                    <CardDescription className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                      {tokenPack.tokens_included.toLocaleString()} tokens
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                        <span className={`text-xl sm:text-2xl lg:text-3xl font-bold ${index === 0 ? 'text-blue-400' : 'text-green-400'}`}>
                          {formatPrice(tokenPack.price_cents)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(Math.round(tokenPack.price_cents / (tokenPack.tokens_included / 1000)))} por 1k tokens
                      </p>
                    </div>

                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Check className={`w-3 h-3 sm:w-4 sm:h-4 ${index === 0 ? 'text-blue-400' : 'text-green-400'} flex-shrink-0`} />
                        <span>{tokenPack.tokens_included.toLocaleString()} tokens</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Check className={`w-3 h-3 sm:w-4 sm:h-4 ${index === 0 ? 'text-blue-400' : 'text-green-400'} flex-shrink-0`} />
                        <span>Sem expiração</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handlePurchase(tokenPack.id)}
                      disabled={isLoading || !canPurchaseTokens}
                      className={`w-full mt-3 h-10 sm:h-12 text-sm sm:text-base ${index === 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {isLoading && selectedPackage === tokenPack.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Redirecionando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Comprar Tokens
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
    </div>
  );
}