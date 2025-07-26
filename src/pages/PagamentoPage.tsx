import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ExternalLink, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { useEffect } from 'react';

export default function PagamentoPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleStripePayment = () => {
    navigate('/comprar-creditos');
  };


  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/lovable-uploads/8fc8748b-d056-4136-b669-07bbd1bc2327.png" 
            alt="Oráculo Jurídico" 
            className="w-16 h-16 mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold">Finalizar Cadastro</h1>
          <p className="text-muted-foreground">
            Sua conta foi criada com sucesso! Agora finalize o pagamento para ter acesso completo.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagamento via Stripe
            </CardTitle>
            <CardDescription>
              Complete a compra de créditos para começar a usar o Oráculo Jurídico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Conta criada com sucesso
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Período gratuito de 7 dias ativo
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Email:</strong> {user.email}
              </div>
              {profile.full_name && (
                <div className="text-sm text-muted-foreground">
                  <strong>Nome:</strong> {profile.full_name}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleStripePayment}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Comprar Tokens
              </Button>
              
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-center">
                <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                  ✨ Processamento Seguro
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Seus créditos serão adicionados automaticamente após o pagamento confirmado!
                </p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-medium mb-2">📋 Instruções:</h3>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Clique em "Comprar Créditos"</li>
                <li>2. Escolha seu pacote de créditos</li>
                <li>3. Complete o pagamento no Stripe</li>
                <li>4. Seus créditos serão adicionados automaticamente!</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
          >
            Voltar ao Dashboard (Período Gratuito)
          </Button>
        </div>
      </div>
    </div>
  );
}