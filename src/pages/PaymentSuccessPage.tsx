import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [creditsAdded, setCreditsAdded] = useState<number | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Erro",
          description: "Session ID não encontrado",
          variant: "destructive",
        });
        navigate('/comprar-creditos');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId }
        });

        if (error) throw error;

        if (data?.success) {
          setCreditsAdded(data.tokens_added);
          await refreshProfile(); // Atualiza o perfil para mostrar novos tokens
          toast({
            title: "Pagamento Confirmado!",
            description: `${data.tokens_added} tokens foram adicionados à sua conta.`,
          });
        } else {
          toast({
            title: "Pagamento Pendente",
            description: "Seu pagamento ainda está sendo processado.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao verificar pagamento.",
          variant: "destructive",
        });
      } finally {
        setProcessing(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast, refreshProfile]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="bg-slate-800 border-slate-700 max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Verificando seu pagamento...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-primary">
              Pagamento Confirmado!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {creditsAdded && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-primary mb-2">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-semibold">Tokens Adicionados</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  +{creditsAdded} tokens
                </p>
              </div>
            )}
            
            <p className="text-muted-foreground">
              Seus tokens foram adicionados com sucesso à sua conta. 
              Agora você pode fazer suas consultas no Oráculo Jurídico!
            </p>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/chat')} 
                className="w-full"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Começar a Usar
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Voltar ao Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}