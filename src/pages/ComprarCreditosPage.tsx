import { useState, useEffect } from "react";
import { CreditCard, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";

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

  // Auto-selecionar o pacote se vier da URL
  useEffect(() => {
    if (selectedPlan) {
      setSelectedPackage(selectedPlan);
    }
  }, [selectedPlan]);

  const handlePurchase = async (packageId: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header fixo */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 p-2 sm:p-4">
        <div className="max-w-2xl mx-auto flex justify-end">
          <UserMenu />
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4 p-2 sm:p-4 pt-4">

        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-12 sm:h-14 w-auto mx-auto mb-2 sm:mb-3"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">Planos de Tokens</h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-2">
            Escolha o plano ideal para suas necessidades.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-3 mt-2 sm:mt-3 max-w-sm mx-auto">
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

        {/* Packages Grid */}
        <div className="grid gap-3 sm:gap-4 max-w-lg mx-auto">
          {tokenPackages.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative bg-slate-800 border-slate-700 transition-all duration-300 ${
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
                <CardTitle className="text-base sm:text-lg font-bold text-primary">
                  {pkg.name}
                </CardTitle>
                <CardDescription className="text-lg sm:text-xl font-bold text-white">
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
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    R$ {(pkg.price / (pkg.tokens / 1000)).toFixed(3).replace('.', ',')} por 1k tokens
                  </p>
                </div>

                <div className="space-y-1 sm:space-y-2">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Check className="w-3 h-3 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  className={`w-full mt-3 h-9 sm:h-10 text-sm ${
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
                      <CreditCard className="w-4 h-4" />
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
  );
}