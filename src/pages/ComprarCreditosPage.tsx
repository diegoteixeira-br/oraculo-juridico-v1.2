import { useState, useEffect } from "react";
import { CreditCard, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";

const creditPackages = [
  {
    id: "50-credits",
    name: "50 Créditos",
    credits: 50,
    price: 20.00,
    originalPrice: 25.00,
    discount: "20% OFF",
    popular: true,
    features: [
      "Consultas jurídicas ilimitadas",
      "Análise de documentos",
      "Suporte prioritário",
      "Válido por 12 meses"
    ]
  },
  {
    id: "100-credits",
    name: "100 Créditos",
    credits: 100,
    price: 35.00,
    originalPrice: 50.00,
    discount: "30% OFF",
    popular: false,
    features: [
      "Consultas jurídicas ilimitadas",
      "Análise de documentos",
      "Suporte prioritário VIP",
      "Relatórios detalhados",
      "Válido por 12 meses"
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

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { packageId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de pagamento não recebida');
      }
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
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
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Comprar Créditos</h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Escolha o pacote de créditos ideal para suas necessidades. 
            Cada crédito equivale a 1.500 tokens e é cobrado proporcionalmente ao uso.
          </p>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 mt-4 max-w-lg mx-auto">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Como funciona:</strong> O consumo é calculado pelos tokens usados na pergunta + resposta + processamento de arquivos/imagens
            </p>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {creditPackages.map((pkg) => (
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
              
              {pkg.discount && (
                <div className="absolute -top-2 -right-2 z-10">
                  <Badge variant="destructive" className="bg-green-600 hover:bg-green-600/80 text-white text-xs px-2 py-1">
                    {pkg.discount}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-6 pb-4">
                <CardTitle className="text-lg md:text-xl font-bold text-primary">
                  {pkg.name}
                </CardTitle>
                <CardDescription className="text-xl md:text-2xl font-bold text-white">
                  {pkg.credits} créditos
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl md:text-3xl font-bold text-primary">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </span>
                    {pkg.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {pkg.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    R$ {(pkg.price / pkg.credits).toFixed(2).replace('.', ',')} por crédito
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