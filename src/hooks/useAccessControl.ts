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

  const canAccessPremiumTools = isSubscriber || isTrialActive;
  const canUseChat = isSubscriber || isTrialActive; // não permite chat por tokens após expirar
  const canPurchaseTokens = isSubscriber; // somente assinante mensal pode comprar tokens

  const isBlocked = isTrialExpired && !isSubscriber && !hasPlanTokens; // bloqueio total

  return {
    isSubscriber,
    isTrialActive,
    isTrialExpired,
    hasPlanTokens,
    canAccessPremiumTools,
    canUseChat,
    canPurchaseTokens,
    isBlocked,
  };
}
