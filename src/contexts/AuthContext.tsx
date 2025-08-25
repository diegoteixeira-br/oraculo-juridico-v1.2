import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status: string;
  trial_start_date: string;
  trial_end_date: string;
  subscription_end_date?: string;
  subscription_activated_at?: string;
  created_at?: string;
  cpf?: string;
  tokens: number;
  plan_tokens: number;
  plan_type: string;
  token_balance?: number;
  daily_tokens?: number;
  last_daily_reset?: string;
  is_active?: boolean;
  timezone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, cpf?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  hasActiveAccess: () => boolean;
  useTokens: (amount: number, description?: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  resendConfirmation: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);


  const fetchProfile = async (userId: string) => {
    try {
      // Reset trial tokens if expired before reading profile
      await supabase.rpc('reset_trial_tokens_if_expired', { p_user_id: userId });

      const { data, error } = await supabase
        .from('profiles')
        .select('*, created_at, trial_end_date, timezone')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned - ignore este erro específico
        throw error;
      }
      
      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      // Reset trial tokens if expired before reading profile
      await supabase.rpc('reset_trial_tokens_if_expired', { p_user_id: user.id });

      // Buscar perfil atualizado
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*, created_at, trial_end_date, timezone')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned - ignore este erro específico
        throw error;
      }
      
      if (profile) {
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const useTokens = async (amount: number, description: string = 'Uso de tokens') => {
    if (!user?.id) return false;

    try {
      const { data: result, error } = await supabase
        .rpc('use_tokens', {
          p_user_id: user.id,
          p_tokens: amount,
          p_description: description
        });

      if (error || !result) {
        console.error('Error using tokens:', error);
        return false;
      }

      // Atualizar o perfil após usar tokens
      await refreshProfile();
      return true;
    } catch (error) {
      console.error('Error using tokens:', error);
      return false;
    }
  };

  const hasActiveAccess = () => {
    if (!profile) return false;
    
    // Com sistema de tokens, verifica se há saldo de teste (token_balance) ou do plano
    if (profile.plan_type === 'gratuito') {
      return (profile.token_balance || 0) > 0;
    } else {
      return (profile.plan_tokens || 0) > 0;
    }
  };


  const signUp = async (email: string, password: string, fullName?: string, cpf?: string) => {
    // URL de redirecionamento dinâmica baseada no ambiente atual
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          cpf: cpf
        }
      }
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    return { data, error };
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/login`;
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });
    
    return { data, error };
  };

  // Nova função para atualizar senha
  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    return { data, error };
  };

  // Nova função para reenviar confirmação
  const resendConfirmation = async (email: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { data, error };
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    hasActiveAccess,
    useTokens,
    refreshProfile,
    resetPassword,
    updatePassword,
    resendConfirmation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
