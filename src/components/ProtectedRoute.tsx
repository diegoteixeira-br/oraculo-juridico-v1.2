import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccessControl } from '@/hooks/useAccessControl';

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

  useEffect(() => {
    if (shouldBlock) {
      navigate('/comprar-creditos');
    }
  }, [shouldBlock, navigate]);

  if (shouldBlock) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Redirecionando...</CardTitle>
            <CardDescription>Enviando para a página de compra de créditos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate('/comprar-creditos')}>Ir agora</Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}