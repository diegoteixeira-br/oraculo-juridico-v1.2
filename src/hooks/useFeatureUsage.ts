import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useFeatureUsage = () => {
  const { user } = useAuth();

  const logFeatureUsage = async (
    featureName: string,
    featureData: Record<string, any> = {},
    tokensConsumed: number = 0
  ) => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('log_feature_usage', {
        p_user_id: user.id,
        p_feature_name: featureName,
        p_feature_data: featureData,
        p_tokens_consumed: tokensConsumed
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao registrar uso da funcionalidade:', error);
      return false;
    }
  };

  return { logFeatureUsage };
};