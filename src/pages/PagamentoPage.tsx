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
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleCaktoPayment = () => {
    // SUBSTITUA PELA URL REAL DA CAKTO
    const caktoUrl = "https://pay.cakto.com.br/76f5dfq_469425"; 
    window.open(caktoUrl, '_blank');
  };

  const handleConfirmPayment = () => {
    navigate('/confirmar-pagamento');
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <img 
            src="/src/assets/cakto-logo.png" 
            alt="Cakto" 
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
              Pagamento via Cakto
            </CardTitle>
            <CardDescription>
              Complete o pagamento para ativar sua conta e ter acesso total ao Oráculo Jurídico
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
                onClick={handleCaktoPayment}
                className="w-full"
                size="lg"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Finalizar Pagamento na Cakto
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Após completar o pagamento, clique no botão abaixo:
                </p>
                <Button 
                  onClick={handleConfirmPayment}
                  variant="outline"
                  size="lg"
                >
                  Já Paguei - Ativar Minha Conta
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h3 className="font-medium mb-2">📋 Instruções:</h3>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Clique em "Finalizar Pagamento na Cakto"</li>
                <li>2. Complete o pagamento na plataforma da Cakto</li>
                <li>3. Retorne aqui e clique em "Já Paguei"</li>
                <li>4. Sua conta será ativada para acesso completo</li>
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