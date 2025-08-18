import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        const isSubscription = searchParams.get('subscription') === 'true';
        
        if (!sessionId) {
          toast({
            title: "Erro",
            description: "ID da sessão não encontrado",
            variant: "destructive",
          });
          navigate('/comprar-creditos');
          return;
        }

        // Verificar o pagamento
        const { data, error } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId }
        });

        if (error) {
          console.error('Erro ao verificar pagamento:', error);
          toast({
            title: "Erro",
            description: "Erro ao verificar pagamento",
            variant: "destructive",
          });
          navigate('/comprar-creditos');
          return;
        }

        if (data?.success) {
          setSuccess(true);
          toast({
            title: "Pagamento confirmado!",
            description: isSubscription 
              ? "Sua assinatura foi ativada com sucesso!" 
              : "Seus créditos foram adicionados à sua conta!",
          });
          
          // Atualizar perfil do usuário
          await refreshProfile();
          
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          toast({
            title: "Pagamento pendente",
            description: "Aguardando confirmação do pagamento...",
          });
          navigate('/comprar-creditos');
        }
      } catch (error) {
        console.error('Erro durante verificação:', error);
        toast({
          title: "Erro",
          description: "Erro inesperado durante a verificação",
          variant: "destructive",
        });
        navigate('/comprar-creditos');
      } finally {
        setProcessing(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, toast, refreshProfile]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Processando pagamento...
          </h1>
          <p className="text-muted-foreground">
            Aguarde enquanto confirmamos seu pagamento.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Pagamento Confirmado!
          </h1>
          
          <p className="text-muted-foreground mb-6">
            Sua assinatura foi ativada com sucesso. 
            Você será redirecionado para fazer seu primeiro acesso em alguns segundos.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Fazer Login Agora
            </button>
            
            <p className="text-sm text-muted-foreground">
              Redirecionamento automático em 3 segundos...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccess;