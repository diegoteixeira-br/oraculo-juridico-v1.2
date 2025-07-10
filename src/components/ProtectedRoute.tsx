import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiresActiveSubscription?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requiresActiveSubscription = false 
}: ProtectedRouteProps) {
  const { user, profile, loading, hasActiveAccess } = useAuth();
  const navigate = useNavigate();

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

  if (requiresActiveSubscription && !hasActiveAccess()) {
    const isTrialExpired = profile?.subscription_status === 'trial' && 
      new Date() >= new Date(profile.trial_end_date);

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              {isTrialExpired ? (
                <>
                  <Clock className="w-12 h-12 mx-auto mb-4 text-amber-500" />
                  <CardTitle>Período Gratuito Expirado</CardTitle>
                  <CardDescription>
                    Seu período gratuito de 7 dias chegou ao fim. Continue aproveitando todos os recursos da plataforma!
                  </CardDescription>
                </>
              ) : (
                <>
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <CardTitle>Acesso Restrito</CardTitle>
                  <CardDescription>
                    Esta funcionalidade requer uma assinatura ativa.
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={() => navigate('/pricing')}
              >
                Ver Planos e Preços
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/dashboard')}
              >
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