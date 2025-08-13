import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";


const Privacidade = () => {
  useSEO({
    title: "Política de Privacidade | Oráculo Jurídico",
    description: "Política de Privacidade — Stripe, LexML e teste gratuito de 7 dias com 15.000 tokens.",
  });
  return (
    <div className="min-h-screen bg-background">
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/">
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
              <span>Voltar para Home</span>
            </button>
          </Link>
          <img 
            src="/lovable-uploads/c69e5a84-404e-4cbe-9d84-d19d95158721.png" 
            alt="Oráculo Jurídico" 
            className="h-16 w-auto"
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold text-foreground mb-8">Política de Privacidade</h1>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Coleta de Informações</h2>
              <p>
                Coletamos informações que você nos fornece diretamente, como nome, e-mail e dados 
                de pagamento, necessários para o funcionamento adequado da plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Uso das Informações</h2>
              <p>
                Utilizamos suas informações para fornecer e melhorar nossos serviços, processar 
                pagamentos, enviar comunicações importantes e personalizar sua experiência.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2.1 Dados de Uso e Limites por Plano</h2>
              <p>
                Para garantir o cumprimento dos limites de uso por plano e do teste gratuito, registramos métricas de utilização como consumo de tokens no chat, número de cópias de documentos, quantidade de cálculos realizados e compromissos pendentes. Esses dados são usados exclusivamente para aplicar as regras de limite e melhorar a experiência do usuário, em conformidade com a LGPD.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2.2 Período de Teste Gratuito</h2>
              <p>
                Oferecemos um teste gratuito de 7 dias com 15.000 tokens para uso no chat com a IA. Durante o período de teste, coletamos métricas de consumo de tokens e eventos de uso para aplicar as regras do teste, prevenir abusos e garantir a qualidade do serviço. Não há cobrança durante o teste; dados de faturamento só são processados quando você opta por assinar um plano.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Compartilhamento de Dados</h2>
              <p>
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
                exceto quando necessário para fornecer nossos serviços ou conforme exigido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3.1 Processamento de Pagamentos (Stripe)</h2>
              <p>
                Pagamentos são processados pela Stripe. Não armazenamos dados completos de cartão em nossos servidores. Mantemos apenas metadados necessários (por exemplo: identificador da transação, status, valor e e-mail de cobrança) para fins de conciliação e suporte. Para mais detalhes, consulte a política de privacidade da Stripe.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3.2 Integrações e Fontes Oficiais (LexML)</h2>
              <p>
                Para consultas de jurisprudência, integramos com a LexML, base oficial do governo brasileiro. As consultas utilizam termos de busca e não compartilhamos seus dados pessoais com essa base. Coletamos logs técnicos mínimos (como termo de busca e horário) para auditoria e melhoria contínua.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança adequadas para proteger suas informações contra 
                acesso, alteração, divulgação ou destruição não autorizada.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Cookies e Tecnologias Similares</h2>
              <p>
                Utilizamos cookies para melhorar sua experiência de navegação e analisar o uso da 
                plataforma. Você pode controlar o uso de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Direitos do Usuário</h2>
              <p>
                Você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de suas 
                informações pessoais. Entre em contato conosco para exercer esses direitos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Retenção de Dados</h2>
              <p>
                Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos 
                descritos nesta política, salvo quando um período de retenção mais longo for exigido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Alterações na Política</h2>
              <p>
                Podemos atualizar esta política de privacidade periodicamente. Notificaremos você 
                sobre mudanças significativas através de e-mail ou aviso em nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Contato</h2>
              <p>
                Para dúvidas sobre esta política de privacidade, entre em contato conosco através 
                do e-mail contato@oraculojuridico.com.br
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Lei Geral de Proteção de Dados (LGPD)</h2>
              <p>
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 
                13.709/2018) e demais regulamentações aplicáveis sobre proteção de dados pessoais.
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

export default Privacidade;