import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Upload, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export default function ConfirmarPagamentoPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Atualizar status da conta para "pending_activation"
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'pending_activation',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      // Aqui você poderia enviar os dados para um sistema de administração
      // ou salvar em uma tabela de confirmações de pagamento

      toast({
        title: "Confirmação recebida!",
        description: "Sua confirmação de pagamento foi registrada. Verificaremos e ativaremos sua conta em breve.",
      });

      // Redirecionar para dashboard com status atualizado
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/pagamento')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="text-center space-y-2">
          <img 
            src="/src/assets/cakto-logo.png" 
            alt="Cakto" 
            className="w-16 h-16 mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold">Confirmar Pagamento</h1>
          <p className="text-muted-foreground">
            Informe os dados do seu pagamento para ativarmos sua conta
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Confirmação de Pagamento
            </CardTitle>
            <CardDescription>
              Preencha as informações abaixo para confirmar seu pagamento via Cakto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transactionId">ID da Transação ou Comprovante</Label>
                  <Input
                    id="transactionId"
                    placeholder="Ex: TXN123456 ou número do comprovante"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Data do Pagamento</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (Opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione qualquer informação adicional sobre o pagamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <h3 className="font-medium mb-2">⚠️ Importante:</h3>
                <p className="text-sm text-muted-foreground">
                  Após enviar esta confirmação, nossa equipe verificará o pagamento e ativará sua conta. 
                  Isso pode levar algumas horas. Você receberá uma confirmação por email.
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  "Processando..."
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Confirmar Pagamento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
          <h3 className="font-medium mb-2">✅ Próximos Passos:</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>1. Verificaremos seu pagamento na Cakto</li>
            <li>2. Ativaremos sua conta para acesso completo</li>
            <li>3. Você receberá um email de confirmação</li>
            <li>4. Poderá usar todas as funcionalidades premium</li>
          </ul>
        </div>
      </div>
    </div>
  );
}