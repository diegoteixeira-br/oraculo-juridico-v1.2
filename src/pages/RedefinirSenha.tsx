import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function RedefinirSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/login`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        if (error.message.includes('rate limit') || error.message.includes('429')) {
          toast({
            title: "Muitas tentativas",
            description: "Aguarde alguns minutos antes de tentar novamente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro",
            description: error.message || "Ocorreu um erro ao enviar o email. Tente novamente.",
            variant: "destructive",
          });
        }
      } else {
        setEmailEnviado(true);
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailEnviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao login</span>
            </Link>
          </div>

          <div className="text-center space-y-2">
            <img 
              src="/lovable-uploads/8fc8748b-d056-4136-b669-07bbd1bc2327.png" 
              alt="Oráculo Jurídico" 
              className="w-16 h-16 mx-auto mb-4 rounded-lg"
            />
            <h1 className="text-2xl font-bold">Email Enviado!</h1>
            <p className="text-muted-foreground">
              Enviamos as instruções para redefinir sua senha
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Verifique seu email</h3>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um link para <strong>{email}</strong> para você redefinir sua senha.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Não esquece de verificar a pasta de spam!
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={() => setEmailEnviado(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Enviar novamente
                  </Button>
                  
                  <Button
                    asChild
                    className="w-full"
                  >
                    <Link to="/login">
                      Voltar ao login
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/login" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao login</span>
          </Link>
        </div>

        <div className="text-center space-y-2">
          <img 
            src="/lovable-uploads/8fc8748b-d056-4136-b669-07bbd1bc2327.png" 
            alt="Oráculo Jurídico" 
            className="w-16 h-16 mx-auto mb-4 rounded-lg"
          />
          <h1 className="text-2xl font-bold">Redefinir Senha</h1>
          <p className="text-muted-foreground">
            Digite seu email para receber as instruções
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Esqueceu sua senha?</CardTitle>
            <CardDescription>
              Não se preocupe! Digite seu email e enviaremos um link para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar email de redefinição
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground inline">
                Lembrou da senha?{" "}
                <Button
                  asChild
                  variant="link"
                  className="p-0 h-auto text-sm font-medium"
                >
                  <Link to="/login">
                    Fazer login
                  </Link>
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}