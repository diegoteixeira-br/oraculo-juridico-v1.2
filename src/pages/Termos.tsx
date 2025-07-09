import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Termos = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/home">
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
              <span>Voltar para Home</span>
            </button>
          </Link>
          <img 
            src="/lovable-uploads/3f5dd265-f1d6-4f36-a02e-44a1c4d5b2a5.png" 
            alt="Oráculo Jurídico" 
            className="h-12 w-auto"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Termos de Uso</h1>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o Oráculo Jurídico, você concorda em cumprir e ficar vinculado aos 
                seguintes termos e condições de uso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Descrição do Serviço</h2>
              <p>
                O Oráculo Jurídico é uma plataforma digital que oferece serviços jurídicos especializados 
                e consultoria legal através de tecnologia avançada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Período de Teste</h2>
              <p>
                Oferecemos um período de teste gratuito de 7 dias para novos usuários. Após este período, 
                será necessário escolher um plano de assinatura para continuar utilizando os serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Pagamentos</h2>
              <p>
                Os pagamentos são processados através da plataforma Cakto, garantindo segurança e 
                conformidade com as normas de proteção de dados financeiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Responsabilidades do Usuário</h2>
              <p>
                O usuário é responsável por manter a confidencialidade de suas credenciais de acesso 
                e por todas as atividades realizadas em sua conta.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Limitações de Responsabilidade</h2>
              <p>
                O Oráculo Jurídico não se responsabiliza por danos diretos, indiretos, incidentais ou 
                consequenciais decorrentes do uso da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                entrarão em vigor imediatamente após a publicação.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Contato</h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato conosco através do e-mail 
                suporte@oraculojuridico.com.br
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Oráculo Jurídico. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Termos;