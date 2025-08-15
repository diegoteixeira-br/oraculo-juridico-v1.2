import { useAuth } from "@/contexts/AuthContext";

export function useAccessControl() {
  const { profile } = useAuth();

  const now = new Date();
  const trialEnd = profile?.trial_end_date ? new Date(profile.trial_end_date) : null;
  const isTrial = profile?.subscription_status === 'trial';
  const isSubscriber = profile?.subscription_status === 'active';
  const isCancelled = profile?.subscription_status === 'cancelled';

  const isTrialActive = !!(isTrial && trialEnd && now < trialEnd);
  const isTrialExpired = !!(isTrial && trialEnd && now >= trialEnd);

  const planTokens = Number(profile?.plan_tokens || 0);
  const hasPlanTokens = planTokens > 0;

  // Verificar o tipo de plano atual
  const planType = profile?.plan_type || 'gratuito';
  const isEssentialSubscriber = isSubscriber && planType === 'Essencial';
  const isFreeUser = planType === 'Gratuito' || planType === 'gratuito';

  const canAccessPremiumTools = isSubscriber || isTrialActive;
  // Chat é liberado para todos: assinantes, trial ativo com tokens, ou usuários com plan_tokens
  const canUseChat = isSubscriber || isTrialActive || hasPlanTokens;
  const canPurchaseTokens = isEssentialSubscriber; // Apenas assinantes essenciais podem comprar tokens extras

  // Verificar se a conta está ativa
  const isAccountActive = profile?.is_active !== false;
  const isBlocked = ((isTrialExpired && !isSubscriber) && !hasPlanTokens) || !isAccountActive;


  // Informações sobre o plano atual
  const getCurrentPlanInfo = () => {
    // Se tem subscription_status active, mas plan_type é gratuito, há inconsistência
    if (isSubscriber && planType === 'Essencial') {
      return {
        name: 'Essencial',
        type: 'subscription',
        badge: 'Assinante', 
        badgeColor: 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
      };
    }
    
    if (isSubscriber && (planType === 'gratuito' || planType === 'Gratuito')) {
      // Usuário com subscription ativa mas plano gratuito - tratar como assinante ativo
      return {
        name: 'Gratuito',
        type: 'active',
        badge: 'Ativo',
        badgeColor: 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
      };
    }
    
    if (isCancelled) {
      return {
        name: 'Assinatura Cancelada',
        type: 'cancelled',
        badge: 'Cancelado',
        badgeColor: 'bg-red-500/20 text-red-200 border border-red-400/30'
      };
    }
    
    if (isTrialActive) {
      return {
        name: 'Gratuito',
        type: 'trial',
        badge: `Trial (${Math.max(0, Math.ceil((trialEnd!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))} dias)`,
        badgeColor: 'bg-blue-500/20 text-blue-200 border border-blue-400/30'
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
    isCancelled,
    planType,
    getCurrentPlanInfo,
  };
}
