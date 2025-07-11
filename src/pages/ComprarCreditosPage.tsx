import { useState } from "react";
import { ArrowLeft, CreditCard, Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const creditPackages = [
  {
    id: "basic",
    name: "Pacote Básico",
    credits: 100,
    price: 29.90,
    originalPrice: 39.90,
    discount: "25% OFF",
    popular: false,
    features: [
      "100 créditos",
      "Válido por 6 meses",
      "Pesquisas ilimitadas",
      "Suporte por email"
    ]
  },
  {
    id: "premium",
    name: "Pacote Premium",
    credits: 300,
    price: 79.90,
    originalPrice: 119.90,
    discount: "33% OFF",
    popular: true,
    features: [
      "300 créditos",
      "Válido por 12 meses",
      "Pesquisas ilimitadas",
      "Suporte prioritário",
      "Relatórios avançados"
    ]
  }
];

export default function ComprarCreditosPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePurchase = async (packageId: string) => {
    setIsLoading(true);
    setSelectedPackage(packageId);

    // Simular processo de compra
    await new Promise(resolve => setTimeout(resolve, 2000));

    const selectedPkg = creditPackages.find(pkg => pkg.id === packageId);
    
    toast({
      title: "Compra realizada com sucesso!",
      description: `${selectedPkg?.credits} créditos foram adicionados à sua conta.`,
    });

    setIsLoading(false);
    setSelectedPackage(null);
    
    // Redirecionar para minha conta após 1 segundo
    setTimeout(() => {
      navigate("/minha-conta");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/minha-conta")}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Minha Conta
          </Button>
        </div>

        <div className="text-center">
          <img 
            src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
            alt="Oráculo Jurídico" 
            className="h-20 w-auto mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-primary mb-2">Comprar Créditos</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Escolha o pacote de créditos ideal para suas necessidades. 
            Cada crédito permite uma pesquisa completa no Oráculo Jurídico.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
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
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="bg-red-600">
                    {pkg.discount}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <CardTitle className="text-xl font-bold text-primary">
                  {pkg.name}
                </CardTitle>
                <CardDescription className="text-2xl font-bold text-white">
                  {pkg.credits} créditos
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-primary">
                      R$ {pkg.price.toFixed(2).replace('.', ',')}
                    </span>
                    {pkg.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {pkg.originalPrice.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    R$ {(pkg.price / pkg.credits).toFixed(2).replace('.', ',')} por crédito
                  </p>
                </div>

                <div className="space-y-2">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={isLoading}
                  className={`w-full mt-6 ${
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
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-primary mb-2">Pagamento Seguro</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Seus dados estão protegidos. Processamento via Stripe com criptografia SSL.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>🔒 SSL Seguro</span>
            <span>💳 Cartão de Crédito</span>
            <span>🔄 Processamento Instantâneo</span>
          </div>
        </div>
      </div>
    </div>
  );
}