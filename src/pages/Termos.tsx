import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Termos = () => {
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
                através de inteligência artificial avançada, proporcionando consultas jurídicas, análise 
                de documentos e acesso a documentos jurídicos pré-formulados.
              </p>
              <p className="mt-4">
                <strong>Integração com Base Oficial de Jurisprudência:</strong> Nossa plataforma integra-se 
                diretamente com a LexML (Rede de Informação Legislativa e Jurídica), que é a base oficial 
                de jurisprudência do governo brasileiro. Isso garante que as consultas sobre precedentes 
                judiciais acessem dados atualizados e confiáveis diretamente dos tribunais superiores (STF, STJ) 
                e tribunais estaduais, proporcionando maior precisão e confiabilidade nas respostas.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Sistema de Tokens</h2>
              <p>
                Tokens são utilizados exclusivamente no chat com a IA para processar consultas. No plano gratuito, cada usuário recebe 3.000 tokens por dia, renovados a cada 24 horas (não cumulativos). No Plano Essencial, o usuário recebe 30.000 tokens por mês.
              </p>
              <p className="mt-2">
                Importante: calculadoras, documentos e agenda não consomem tokens. Esses recursos seguem os limites do plano conforme descrito abaixo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Planos e Preços</h2>
              <p>
                Oferecemos um plano de assinatura mensal e pacotes opcionais de tokens:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li><strong>Plano Essencial:</strong> R$ 37,90/mês, com 30.000 tokens/mês para o chat e uso ilimitado das calculadoras, documentos (cópia) e agenda.</li>
                <li><strong>Teste Gratuito:</strong> 7 dias com 3.000 tokens/dia para o chat.</li>
                <li><strong>Pacotes Opcionais:</strong> 75.000 e 150.000 tokens avulsos (opcionais) para quem desejar ampliar o uso do chat.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Pagamentos e Processamento</h2>
              <p>
                Os pagamentos são processados de forma segura através da plataforma Stripe, uma das 
                principais empresas de processamento de pagamentos do mundo, garantindo:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li>Criptografia SSL de ponta a ponta</li>
                <li>Conformidade com as normas PCI DSS</li>
                <li>Proteção contra fraudes</li>
                <li>Processamento instantâneo dos tokens após confirmação do pagamento</li>
              </ul>
              <p className="mt-2">
                Aceitamos cartões de crédito das principais bandeiras e o processamento é realizado 
                de forma automatizada e segura.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Calculadoras Jurídicas</h2>
              <p>
                A plataforma oferece calculadoras jurídicas especializadas para auxiliar em cálculos complexos do dia a dia da advocacia:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li><strong>Cálculo de Contrato Bancário:</strong> Análise de juros, taxas, cláusulas abusivas e valores de devolução indevida</li>
                <li><strong>Cálculo de Pensão Alimentícia:</strong> Cálculo de valores em atraso com juros, correção monetária e relatórios detalhados</li>
              </ul>
              <p className="mt-2">
                <strong>Limites por Plano:</strong> No Plano Essencial o uso é ilimitado. No plano gratuito, o usuário pode realizar até 2 cálculos por dia (somados entre as calculadoras).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Documentos Jurídicos</h2>
              <p>
                A plataforma oferece acesso a documentos jurídicos pré-formulados que podem ser personalizados conforme a necessidade:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li>Contratos diversos</li>
                <li>Petições</li>
                <li>Procurações</li>
                <li>Declarações</li>
              </ul>
              <p className="mt-2">
                <strong>Limites por Plano:</strong> No Plano Essencial, a cópia de documentos é ilimitada. No plano gratuito, o usuário pode copiar 1 documento por dia. A cópia de documentos não consome tokens.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Agenda Jurídica</h2>
              <p>
                A Agenda Jurídica permite organizar prazos processuais, audiências, reuniões e compromissos personalizados.
              </p>
              <p className="mt-2">
                <strong>Limites por Plano:</strong> No Plano Essencial, o uso é ilimitado. No plano gratuito, o usuário pode manter até 5 compromissos com status pendente simultaneamente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Responsabilidades do Usuário</h2>
              <p>
                O usuário compromete-se a:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Utilizar os serviços de forma ética e legal</li>
                <li>Não compartilhar sua conta com terceiros</li>
                <li>Verificar as informações obtidas com profissionais qualificados quando necessário</li>
                <li>Respeitar os limites de uso conforme o plano (gratuito e Plano Essencial)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Confiabilidade e Limitações</h2>
              <p>
                O Oráculo Jurídico utiliza fontes oficiais confiáveis e é uma ferramenta de apoio profissional. 
                O usuário reconhece que:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li><strong>Fonte Oficial de Dados:</strong> A jurisprudência é consultada diretamente na LexML, 
                base oficial do governo brasileiro, garantindo acesso a dados atualizados e confiáveis</li>
                <li>As respostas da IA são baseadas em algoritmos avançados e bases de dados oficiais</li>
                <li>Embora altamente confiável, não substitui a consulta a um advogado qualificado em casos complexos</li>
                <li>A plataforma não se responsabiliza por decisões tomadas com base nas informações fornecidas</li>
                <li>É recomendada a verificação das informações com profissionais especializados para casos específicos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Política de Reembolso</h2>
              <p>
                Os tokens adquiridos não são reembolsáveis, exceto em casos de:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li>Falha técnica comprovada da plataforma</li>
                <li>Cobrança indevida</li>
                <li>Problemas de processamento de pagamento</li>
              </ul>
              <p className="mt-2">
                Solicitações de reembolso devem ser feitas em até 7 dias após a compra através 
                do suporte ao cliente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                entrarão em vigor imediatamente após a publicação na plataforma. Recomendamos a 
                verificação periódica deste documento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">12. Contato</h2>
              <p>
                Para dúvidas sobre estes termos, suporte técnico ou solicitações relacionadas à sua conta, 
                entre em contato conosco através do e-mail contato@oraculojuridico.com.br ou utilize 
                nossa página de contato na plataforma.
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