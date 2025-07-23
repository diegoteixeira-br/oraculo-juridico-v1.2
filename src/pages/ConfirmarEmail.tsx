import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function ConfirmarEmail() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const selectedPlan = searchParams.get('plano');
  const [isResending, setIsResending] = useState(false);
  const { resendConfirmation } = useAuth();
  const { toast } = useToast();

  const handleResendConfirmation = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      await resendConfirmation(email);
      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada e spam.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Erro ao reenviar email",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    document.title = 'Oráculo Jurídico - Confirmar Email';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Confirme seu email</CardTitle>
          <CardDescription className="text-base">
            Sua conta foi criada com sucesso!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Email enviado para:</span>
            </div>
            <div className="font-medium text-foreground bg-secondary/50 px-4 py-2 rounded-lg">
              {email}
            </div>
          </div>

          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Enviamos um email de confirmação para o endereço acima. 
              Clique no link no email para ativar sua conta.
            </p>
            
            {selectedPlan && (
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  🎯 Após confirmar seu email, você será direcionado para finalizar o pagamento do plano selecionado.
                </p>
              </div>
            )}
            
            <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
              <p className="text-xs text-muted-foreground">
                <strong>Não recebeu o email?</strong><br />
                Verifique sua caixa de spam ou lixo eletrônico.
              </p>
              <Button 
                onClick={handleResendConfirmation}
                disabled={isResending}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {isResending ? "Reenviando..." : "Reenviar email de confirmação"}
              </Button>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}