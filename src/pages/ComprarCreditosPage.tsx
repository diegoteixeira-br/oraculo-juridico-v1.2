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

      const stripeUrls = {
        basico: 'https://buy.stripe.com/4gMfZia1z1hAccD1VY5AQ00',
        premium: 'https://buy.stripe.com/4gMfZi5Lj5xQ1xZ8km5AQ01'
      };

      const url = stripeUrls[packageId as keyof typeof stripeUrls];
      if (url) {
        window.open(url, '_blank');
      } else {
        throw new Error('Plano não encontrado');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-end">
          <UserMenu />
        </div>

        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Planos de Tokens</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Escolha o plano ideal para suas necessidades. 
            Os tokens são consumidos conforme o uso nas consultas e análises.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mt-4 max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Como funciona:</strong> O consumo é calculado pelos tokens usados na pergunta + resposta + processamento de documentos
            </p>
          </div>
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mt-2 max-w-lg mx-auto">
            <p className="text-xs text-blue-200">
              🎁 <strong>Plano Gratuito:</strong> 3.000 tokens diários (renova automaticamente)
            </p>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {tokenPackages.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`relative bg-slate-800 border-slate-700 transition-all duration-300 hover:scale-105 ${
                pkg.popular ? 'border-primary shadow-lg shadow-primary/20' : ''
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              

              <CardHeader className="text-center pt-6 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold text-primary">
                  {pkg.name}
                </CardTitle>
                <CardDescription className="text-xl md:text-2xl font-bold text-white">
                  {pkg.tokens.toLocaleString()} tokens
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  {pkg.discount && (
                    <div className="mb-1">
                      <Badge className="bg-green-600 text-white text-xs">
                        {pkg.discount}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {pkg.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {pkg.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                    <span className="text-2xl md:text-3xl font-bold text-primary">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    R$ {(pkg.price / (pkg.tokens / 1000)).toFixed(3).replace('.', ',')} por 1k tokens
                  </p>
                </div>

                <div className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs md:text-sm">
                      <Check className="w-3 h-3 md:w-4 md:h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  className={`w-full mt-4 h-10 md:h-11 text-sm md:text-base ${
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
                      Comprar Agora
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 md:p-6 text-center max-w-xl mx-auto">
          <h3 className="text-base md:text-lg font-semibold text-primary mb-2">Pagamento Seguro</h3>
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            Seus dados estão protegidos. Processamento via Stripe com criptografia SSL.
          </p>
          <div className="flex items-center justify-center gap-2 md:gap-4 text-xs text-muted-foreground">
            <span>🔒 SSL Seguro</span>
            <span>💳 Cartão de Crédito</span>
            <span>🔄 Processamento Instantâneo</span>
          </div>
        </div>
      </div>
    </div>
  );
}