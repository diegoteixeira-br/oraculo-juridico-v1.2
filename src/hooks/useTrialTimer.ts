import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserTimezone } from '@/hooks/useUserTimezone';

export function useTrialTimer() {
  const { profile } = useAuth();
  const { userTimezone } = useUserTimezone();
  const [daysRemaining, setDaysRemaining] = useState(7);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      if (!profile?.trial_end_date) {
        setDaysRemaining(7);
        return;
      }

      try {
        const now = new Date();
        const trialEnd = new Date(profile.trial_end_date);
        
        // Converter para o timezone do usuário
        const nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const trialEndInUserTz = new Date(trialEnd.toLocaleString('en-US', { timeZone: userTimezone }));
        
        // Definir hora como início do dia para cálculo correto
        nowInUserTz.setHours(0, 0, 0, 0);
        trialEndInUserTz.setHours(23, 59, 59, 999);
        
        const diffTime = trialEndInUserTz.getTime() - nowInUserTz.getTime();
        const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        setDaysRemaining(days);

        console.log('Trial Timer Update:', {
          timezone: userTimezone,
          now: nowInUserTz.toISOString(),
          trialEnd: trialEndInUserTz.toISOString(),
          daysRemaining: days
        });
      } catch (error) {
        console.error('Error calculating trial days:', error);
        setDaysRemaining(7);
      }
    };

    // Calcular imediatamente
    calculateDaysRemaining();

    // Atualizar a cada minuto para garantir tempo real
    const interval = setInterval(calculateDaysRemaining, 60000);

    return () => clearInterval(interval);
  }, [profile?.trial_end_date, userTimezone]);

  return {
    daysRemaining,
    isTrial: profile?.subscription_status === 'trial',
    isPaid: profile?.subscription_status === 'active',
    trialEndDate: profile?.trial_end_date ? new Date(profile.trial_end_date) : null
  };
}