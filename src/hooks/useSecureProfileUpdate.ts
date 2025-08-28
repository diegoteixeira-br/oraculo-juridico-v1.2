import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfileUpdateData {
  full_name?: string;
  cpf?: string;
  timezone?: string;
}

export const useSecureProfileUpdate = () => {
  const updateProfile = async (userId: string, data: ProfileUpdateData) => {
    try {
      const { data: result, error } = await supabase.rpc('secure_update_profile', {
        profile_user_id: userId,
        new_full_name: data.full_name || null,
        new_cpf: data.cpf || null,
        new_timezone: data.timezone || null
      });

      if (error) {
        console.error('Profile update error:', error);
        toast.error('Erro ao atualizar perfil: ' + error.message);
        return false;
      }

      if (!result) {
        toast.error('Falha ao atualizar perfil');
        return false;
      }

      toast.success('Perfil atualizado com sucesso');
      return true;
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erro inesperado ao atualizar perfil');
      return false;
    }
  };

  return { updateProfile };
};