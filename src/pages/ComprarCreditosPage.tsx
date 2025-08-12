import { useState, useEffect } from "react";
import { CreditCard, Check, Star, Crown, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useAccessControl } from "@/hooks/useAccessControl";

const tokenPackages = [
  {
    id: "basico",
    name: "Plano Básico",
    tokens: 75000,
    price: 59.90,
    planType: "basico",
    popular: true,
    features: [
      "75.000 tokens",
      "Acesso a todos os documentos",
      "Suporte por email",
      "Sem expiração"
    ]
  },
  {
    id: "premium",
    name: "Plano Premium",
    tokens: 150000,
    price: 97.00,
    originalPrice: 120.00,
    discount: "20% OFF",
    planType: "premium",
    popular: false,
    features: [
      "150.000 tokens",
      "Acesso a todos os documentos",
      "Suporte prioritário",
      "Chat direto com especialistas",
      "Sem expiração"
    ]
  }
];

export default function ComprarCreditosPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plano');
  const [subLoading, setSubLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const navigate = useNavigate();
  usePageTitle();
  const { canPurchaseTokens } = useAccessControl();

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

  const handlePurchase = async (packageId: string) => {
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
      setSelectedPackage(packageId);

      console.log("🚀 Iniciando compra de tokens:", packageId);
      
      // Chamar a função create-payment
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { packageId }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        console.log("✅ URL de checkout recebida:", data.url);
        // Abrir Stripe checkout em nova aba
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de pagamento não recebida');
      }
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
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de assinatura não recebida');
      }
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
        window.open(data.url, '_blank');
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

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Informações iniciais */}
          <div className="text-center">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-3 max-w-sm mx-auto">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Como funciona:</strong> Tokens usados na pergunta + resposta + documentos
              </p>
            </div>
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-2 sm:p-3 mt-2 max-w-sm mx-auto">
              <p className="text-xs text-blue-200">
                🎁 <strong>Plano Gratuito:</strong> 3.000 tokens diários
              </p>
            </div>
          </div>

          {/* Assinatura Mensal */}
          <div className="max-w-4xl mx-auto">
            <Card className="relative bg-slate-900/60 border-primary/50 shadow-lg shadow-primary/20 overflow-hidden">
              <CardHeader className="pt-6 pb-2 text-center">
                <Badge className="bg-primary text-primary-foreground mb-2 w-fit mx-auto">Novo</Badge>
                <CardTitle className="text-xl lg:text-2xl text-primary flex items-center justify-center gap-2 flex-wrap">
                  <Crown className="w-5 h-5" /> Plano Essencial
                  <Badge className="bg-primary text-primary-foreground ml-1">50% OFF</Badge>
                  <span className="text-xs text-muted-foreground italic">Promoção por tempo limitado — pode acabar a qualquer momento.</span>
                </CardTitle>
                <CardDescription className="text-white text-2xl lg:text-3xl font-bold flex items-center justify-center gap-3">
                  <span className="text-muted-foreground line-through text-lg lg:text-xl">R$ 75,80/mês</span>
                  <span>R$ 37,90/mês</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6">
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>30.000 tokens por mês</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Calculadoras ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Documentos Jurídicos ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Agenda de Compromissos ilimitada</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>Renovação automática. Cancele quando quiser.</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      <span>7 dias grátis: 3.000 tokens/dia no período de teste</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Button onClick={handleSubscribe} disabled={subLoading} className="w-full sm:w-auto h-12 px-6">
                      {subLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Redirecionando...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
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
                    <p className="text-xs text-muted-foreground text-center">
                      Inclui 30.000 tokens/mês. Excedentes? Compre pacotes avulsos abaixo.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Packages Grid - Responsivo: vertical no mobile, horizontal no desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 max-w-4xl mx-auto">
            {tokenPackages.map((pkg) => (
              <Card 
                key={pkg.id}
                className={`relative bg-slate-800 border-slate-700 transition-all duration-300 h-fit ${
                  pkg.popular ? 'border-primary shadow-lg shadow-primary/20' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-2 py-1 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pt-4 sm:pt-6 pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg lg:text-xl font-bold text-primary">
                    {pkg.name}
                  </CardTitle>
                  <CardDescription className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                    {pkg.tokens.toLocaleString()} tokens
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-center">
                    {pkg.discount && (
                      <div className="mb-1">
                        <Badge className="bg-green-600 text-white text-xs">
                          {pkg.discount}
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                      {pkg.originalPrice && (
                        <span className="text-xs sm:text-sm text-muted-foreground line-through">
                          R$ {pkg.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary">
                        R$ {pkg.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      R$ {(pkg.price / (pkg.tokens / 1000)).toFixed(3).replace('.', ',')} por 1k tokens
                    </p>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isLoading}
                    className={`w-full mt-3 h-10 sm:h-12 text-sm sm:text-base ${
                      pkg.popular 
                        ? 'bg-primary hover:bg-primary/90' 
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    {isLoading && selectedPackage === pkg.id ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                        Comprar Tokens
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
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