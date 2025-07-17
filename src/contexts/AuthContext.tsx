
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
  credits: number;
  total_credits_purchased: number;
  daily_credits: number;
  last_daily_reset: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  hasActiveAccess: () => boolean;
  useCredits: (amount: number, description?: string) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Primeiro, resetar créditos diários se necessário
      await supabase.rpc('reset_daily_credits_if_needed', { p_user_id: userId });
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    
    try {
      // Primeiro, resetar créditos diários se necessário
      await supabase.rpc('reset_daily_credits_if_needed', { p_user_id: user.id });
      
      // Buscar perfil atualizado
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const useCredits = async (amount: number, description: string = 'Uso de créditos') => {
    if (!user?.id) return false;

    try {
      const { data: result, error } = await supabase
        .rpc('use_credits', {
          p_user_id: user.id,
          p_credits: amount,
          p_description: description
        });

      if (error || !result) {
        console.error('Error using credits:', error);
        return false;
      }

      // Atualizar o perfil após usar créditos
      await refreshProfile();
      return true;
    } catch (error) {
      console.error('Error using credits:', error);
      return false;
    }
  };

  const hasActiveAccess = () => {
    if (!profile) return false;
    
    // Com sistema de créditos, verifica se tem créditos disponíveis (diários + comprados)
    const totalCredits = (profile.daily_credits || 0) + (profile.credits || 0);
    return totalCredits > 0;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Use a URL completa do site ao invés de window.location.origin
    const redirectUrl = 'https://oraculojuridico.com.br/';
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
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
    setProfile(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
    useCredits,
    refreshProfile
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
