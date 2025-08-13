import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard } from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: ReactNode;
  requiresActiveSubscription?: boolean; // legado
  gate?: 'any' | 'premium' | 'chat' | 'dashboard';
}

export default function ProtectedRoute({ 
  children, 
  requiresActiveSubscription = false,
  gate = 'any'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const access = useAccessControl();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const { isTrialExpired, isBlocked, canAccessPremiumTools, canUseChat } = access;

  const shouldBlock = (() => {
    if (gate === 'dashboard') return false;
    if (gate === 'premium') return !canAccessPremiumTools;
    if (gate === 'chat') return !canUseChat;
    return isBlocked;
  })();

  const handleSubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: {} });
      if (error) throw new Error(error.message || 'Falha ao iniciar o checkout');
      const url = (data as any)?.url;
      if (!url) throw new Error('URL de checkout não recebida');
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('[ProtectedRoute] Erro ao criar checkout:', err);
      toast({
        title: 'Não foi possível iniciar a assinatura',
        description: err?.message || 'Tente novamente em instantes.',
      });
    }
  };

  if (shouldBlock) {
    const title = isTrialExpired ? 'Período Gratuito Expirado' : 'Acesso Restrito';
    const description = gate === 'premium'
      ? 'Disponível para assinantes ativos ou durante o período gratuito.'
      : gate === 'chat'
        ? 'Para usar o Chat, ative sua assinatura.'
        : 'Seu período gratuito de 7 dias chegou ao fim. Ative uma assinatura para continuar usando a plataforma.';

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              {isTrialExpired ? (
                <>
                  <Clock className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <CardTitle>{title}</CardTitle>
                </>
              ) : (
                <>
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <CardTitle>{title}</CardTitle>
                </>
              )}
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={handleSubscribe}>Assinar agora</Button>
              {gate === 'premium' && (
                <Button variant="outline" className="w-full" onClick={() => navigate('/chat')}>
                  Ir para o Chat Jurídico IA
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}