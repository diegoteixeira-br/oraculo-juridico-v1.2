import { useAuth } from "@/contexts/AuthContext";

export function useAccessControl() {
  const { profile } = useAuth();

  const now = new Date();
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isTrial = profile?.subscription_status === 'trial';
  const isSubscriber = profile?.subscription_status === 'active';

  const isTrialActive = !!(isTrial && trialEnd && now < trialEnd);
  const isTrialExpired = !!(isTrial && trialEnd && now >= trialEnd);

  const planTokens = Number(profile?.plan_tokens || 0);
  const hasPlanTokens = planTokens > 0;

  // Verificar o tipo de plano atual
  const planType = profile?.plan_type || 'gratuito';
  const isEssentialSubscriber = isSubscriber && planType === 'Essencial';
  const isFreeUser = planType === 'Gratuito' || planType === 'gratuito';

  const canAccessPremiumTools = isSubscriber || isTrialActive;
  const canUseChat = isSubscriber || isTrialActive || (!isSubscriber && !isTrialActive && hasPlanTokens);
  const canPurchaseTokens = isEssentialSubscriber; // Apenas assinantes essenciais podem comprar tokens extras

  const isBlocked = isTrialExpired && !isSubscriber && !hasPlanTokens;

  // Informações sobre o plano atual
  const getCurrentPlanInfo = () => {
    if (isTrialActive) {
      return {
        name: 'Gratuito (Teste)',
        type: 'trial',
        badge: 'Gratuito',
        badgeColor: 'bg-green-500/20 text-green-200 border border-green-400/30'
      };
    }
    
    if (isEssentialSubscriber) {
      return {
        name: 'Essencial',
        type: 'subscription',
        badge: 'Assinante',
        badgeColor: 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
      };
    }
    
    return {
      name: 'Gratuito (Expirado)',
      type: 'expired',
      badge: 'Expirado',
      badgeColor: 'bg-red-500/20 text-red-200 border border-red-400/30'
    };
  };

  return {
    isSubscriber,
    isTrialActive,
    isTrialExpired,
    hasPlanTokens,
    canAccessPremiumTools,
    canUseChat,
    canPurchaseTokens,
    isBlocked,
    isEssentialSubscriber,
    isFreeUser,
    planType,
    getCurrentPlanInfo,
  };
}
