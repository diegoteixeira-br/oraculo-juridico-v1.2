import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { usePaymentMethod } from "@/hooks/usePaymentMethod";

interface TrialStatusCardProps {
  profile: any;
}

export function TrialStatusCard({ profile }: TrialStatusCardProps) {
  const { hasPaymentMethod, loading } = usePaymentMethod();
  
  const now = new Date();
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isTrial = profile?.subscription_status === 'trial';
  const isTrialExpired = !!(isTrial && trialEnd && now >= trialEnd);
  const daysRemaining = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24))) : 0;

  if (isTrialExpired) {
    return (
      <Card className="bg-gradient-to-br from-red-600/20 to-red-600/10 border-red-600/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-300 font-medium">Período Gratuito</p>
              <p className="text-2xl font-bold text-red-400">
                Expirado
              </p>
              <div className="mt-2">
                <p className="text-xs text-red-300/70">
                  Assine um plano para continuar
                </p>
              </div>
            </div>
            <div className="p-2 bg-red-600/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isTrial && !hasPaymentMethod && !loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-600/20 to-amber-600/10 border-amber-600/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-300 font-medium">Período Gratuito</p>
              <p className="text-2xl font-bold text-amber-400">
                {daysRemaining}/7 Dias
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-300/70">Expira em:</span>
                  <span className="text-amber-200 font-medium">
                    {trialEnd?.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-amber-200 font-medium">
                  ⚠️ Cadastre um cartão para não perder acesso
                </p>
              </div>
            </div>
            <div className="p-2 bg-amber-600/20 rounded-lg">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trial ativo com cartão cadastrado
  if (isTrial) {
    return (
      <Card className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 border-blue-600/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-300 font-medium">Período Gratuito</p>
              <p className="text-2xl font-bold text-blue-400">
                {daysRemaining}/7 Dias
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-300/70">Expira em:</span>
                  <span className="text-blue-200 font-medium">
                    {trialEnd?.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-xs text-blue-200 font-medium">
                  ✓ Cartão cadastrado
                </p>
              </div>
            </div>
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}