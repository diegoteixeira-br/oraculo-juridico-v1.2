import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Zap, CheckCircle, CreditCard, Clock, Gift } from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { supabase } from '@/integrations/supabase/client';
export default function FinalizarCadastro() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const success = searchParams.get('success') === 'true';

  // SEO
  useSEO({
    title: "Finalizar Cadastro - Teste Gratuito | Oráculo Jurídico",
    description: "Complete seu cadastro e comece seu teste gratuito de 7 dias com 15.000 tokens. Plano Básico R$ 59,90/mês com 30.000 tokens."
  });
  const handleContinueToStripe = async () => {
    try {
      // Buscar o product_type da assinatura Essencial
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          product_type_id: '443c946c-18a2-48b0-90bb-925518b11aaf' // ID do plano Essencial
        }
      });

      if (error) {
        console.error('Erro ao criar checkout:', error);
        // Fallback para link direto
        window.open('https://buy.stripe.com/cNi00k4Hf2lE1xZbwy5AQ02', '_blank');
        return;
      }

      // Redirecionar para o Stripe na mesma aba
      window.location.href = data.url;
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      // Fallback para link direto
      window.open('https://buy.stripe.com/cNi00k4Hf2lE1xZbwy5AQ02', '_blank');
    }
  };
  // Se success=true, mostrar página de boas-vindas
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
          <div className="container max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" alt="Oráculo Jurídico" className="h-8 w-auto" />
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    Bem-vindo ao Oráculo Jurídico!
                  </h1>
                  <p className="text-xs text-slate-300 hidden md:block">
                    Sua conta foi criada com sucesso
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo de boas-vindas */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="container max-w-xl mx-auto">
            <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-green-600/20 rounded-full">
                    <CheckCircle className="w-16 h-16 text-green-400" />
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-white mb-4">Seja Bem-vindo!</h2>
                
                <p className="text-green-200 mb-2">
                  Parabéns! Sua conta foi criada com sucesso.
                </p>
                
                {email && (
                  <p className="text-green-200 mb-6">
                    Email: <strong>{email}</strong>
                  </p>
                )}
                
                <p className="text-slate-300 mb-8">
                  Agora você pode acessar sua conta e começar a usar todos os recursos do Oráculo Jurídico.
                </p>
                
                <Button 
                  asChild 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 text-lg"
                  size="lg"
                >
                  <Link to="/login">
                    <Zap className="w-5 h-5 mr-2" />
                    Acesse aqui sua conta
                  </Link>
                </Button>
                
                <div className="mt-6 p-4 bg-slate-700/20 rounded-lg">
                  <p className="text-sm text-slate-300">
                    <Shield className="w-4 h-4 inline mr-1 text-green-400" />
                    Sua assinatura está ativa • 7 dias com reembolso garantido
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/login" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" alt="Oráculo Jurídico" className="h-8 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-400" />
                  Finalizar Cadastro
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Finalize e experimente 7 dias com reembolso garantido
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="container max-w-2xl mx-auto space-y-6">
          
          {/* Card de sucesso */}
          <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-600/20 rounded-full">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Conta Criada com Sucesso!</h2>
              <p className="text-green-200">
                Seu email: <strong>{email}</strong>
              </p>
              
            </CardContent>
          </Card>

          {/* Card de escolha do plano */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-white text-2xl">
                <Zap className="w-6 h-6 text-blue-400" />
                Escolha seu Plano
              </CardTitle>
              <CardDescription>
                Complete seu cadastro • Diversos planos disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Destaque da oferta */}
              <div className="text-center p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400 mb-2">Planos a partir de R$ 29,90</div>
                <div className="text-sm text-slate-300">Escolha o plano ideal para você</div>
                <div className="text-lg font-semibold text-yellow-400 mt-2">
                  7 Dias com Reembolso Garantido!
                </div>
              </div>

              {/* Aviso importante */}
              <div className="p-4 bg-yellow-600/10 rounded-lg border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-200 mb-2">Importante sobre seu teste gratuito:</h3>
                    <ul className="text-sm text-yellow-100 space-y-1">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                        Para completar o cadastro, é necessário adicionar um cartão
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                        <strong>Cobrança no ato • Reembolso total se cancelar antes do 8º dia</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        A partir do 8º dia, cobrança mensal sem reembolso
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                        Acesso completo a todos os recursos
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Benefícios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="font-medium text-white">30.000 tokens/mês</div>
                    <div className="text-xs text-slate-400">Muito mais do que o básico</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Clock className="w-5 h-5 text-green-400" />
                  <div>
                    <div className="font-medium text-white">Suporte prioritário</div>
                    <div className="text-xs text-slate-400">Resposta rápida</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Gift className="w-5 h-5 text-purple-400" />
                  <div>
                    <div className="font-medium text-white">Recursos premium</div>
                    <div className="text-xs text-slate-400">Todas as funcionalidades</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-400" />
                  <div>
                    <div className="font-medium text-white">Sem compromisso</div>
                    <div className="text-xs text-slate-400">Cancele quando quiser</div>
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="space-y-3 px-4 md:px-0">
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 py-3 px-3 text-sm sm:text-base md:text-lg min-h-[48px] whitespace-normal leading-tight" size="lg">
                  <Link to="/comprar-creditos">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="text-center flex-1">Continuar para Finalizar Cadastro</span>
                  </Link>
                </Button>
                
                <div className="text-center">
                  <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
                    
                  </Button>
                </div>
              </div>

              {/* Garantia */}
              <div className="text-center p-4 bg-slate-700/20 rounded-lg">
                <p className="text-sm text-slate-300">
                  <Shield className="w-4 h-4 inline mr-1 text-green-400" />
                  Cobrança no ato • Reembolso total se cancelar antes do 8º dia • Pagamento seguro via Stripe
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}