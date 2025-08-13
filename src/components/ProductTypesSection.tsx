import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Crown, Package, Check } from "lucide-react";
import { useProductTypes } from "@/hooks/useProductTypes";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useNavigate } from "react-router-dom";

export function ProductTypesSection() {
  const { subscriptions, tokenPacks, formatPrice, loading } = useProductTypes();
  const { isEssentialSubscriber, getCurrentPlanInfo, canPurchaseTokens } = useAccessControl();
  const navigate = useNavigate();
  const currentPlan = getCurrentPlanInfo();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-slate-600 rounded w-1/2 mb-4"></div>
                <div className="h-10 bg-slate-600 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção de Assinaturas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Planos de Assinatura</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.map((subscription) => (
            <Card 
              key={subscription.id} 
              className={`bg-slate-800/50 border-slate-700 relative ${
                currentPlan.name === subscription.name ? 'ring-2 ring-primary' : ''
              }`}
            >
              {currentPlan.name === subscription.name && (
                <div className="absolute -top-2 left-4">
                  <Badge className="bg-primary text-white">
                    <Check className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between text-white">
                  <span>{subscription.name}</span>
                  {subscription.price_cents > 0 && (
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(subscription.price_cents)}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{subscription.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-slate-300">
                      {subscription.tokens_included.toLocaleString()} tokens inclusos
                    </span>
                  </div>
                  
                  {subscription.billing_period && (
                    <div className="text-xs text-slate-400">
                      Cobrança: {subscription.billing_period === 'monthly' ? 'Mensal' : 'Anual'}
                    </div>
                  )}
                  
                  {currentPlan.name !== subscription.name && (
                    <Button 
                      onClick={() => navigate('/comprar-creditos')}
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={subscription.price_cents === 0}
                    >
                      {subscription.price_cents === 0 ? 'Gratuito' : 'Assinar Agora'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Seção de Pacotes de Tokens */}
      {tokenPacks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Pacotes de Tokens Extras</h3>
          </div>
          
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tokenPacks.map((tokenPack) => (
              <Card 
                key={tokenPack.id} 
                className={`bg-slate-800/50 border-slate-700 ${
                  !canPurchaseTokens ? 'opacity-60' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-white">
                    <span>{tokenPack.name}</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {formatPrice(tokenPack.price_cents)}
                    </span>
                  </CardTitle>
                  <CardDescription>{tokenPack.description}</CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-slate-300">
                        {tokenPack.tokens_included.toLocaleString()} tokens
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-400">
                      Compra única
                    </div>
                    
                    <Button 
                      onClick={() => navigate('/comprar-creditos')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={!canPurchaseTokens}
                    >
                      {canPurchaseTokens ? 'Comprar Agora' : 'Assine o Essencial'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}