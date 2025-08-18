import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const Termos = () => {
  useSEO({
    title: "Termos de Uso | Oráculo Jurídico",
    description: "Termos de Uso do Oráculo Jurídico — teste gratuito de 7 dias com 15.000 tokens.",
  });
  return (
    <div className="min-h-screen bg-background">
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/blog">
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
                Tokens são utilizados para TODAS as funcionalidades com Inteligência Artificial: chat jurídico, conversão de texto em áudio (text-to-speech) e extração automática de prazos da agenda. No teste gratuito, o usuário recebe 15.000 tokens para utilizar ao longo de 7 dias (não renováveis diariamente). No Plano Essencial, o usuário recebe 30.000 tokens por mês.
              </p>
              <p className="mt-2">
                Importante: calculadoras e cópia de documentos não consomem tokens. Esses recursos seguem os limites do plano conforme descrito abaixo.
              </p>
              
              <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Regras Específicas do Plano Essencial</h3>
              <p>
                <strong>Acúmulo de Tokens:</strong> No Plano Essencial, tokens não utilizados são acumulados no próximo período de renovação mensal. Por exemplo, se o usuário utilizar apenas 20.000 tokens no primeiro mês, os 10.000 tokens restantes serão somados aos 30.000 tokens do segundo mês, totalizando 40.000 tokens disponíveis.
              </p>
              <p className="mt-2">
                <strong>Prazo de Renovação:</strong> Para manter o acúmulo de tokens, a renovação deve ser feita em até 7 dias após o vencimento da assinatura. Caso a renovação não seja realizada dentro deste prazo, todos os tokens acumulados não utilizados serão perdidos, e o usuário receberá apenas os 30.000 tokens padrão do novo período.
              </p>
              <p className="mt-2">
                <strong>Exemplo Prático:</strong> Se a assinatura vence no dia 15 e o usuário possui 8.000 tokens não utilizados, ele terá até o dia 22 para renovar e manter esses tokens. Renovando no prazo, receberá 38.000 tokens (8.000 + 30.000). Renovando após o dia 22, receberá apenas 30.000 tokens.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Planos e Preços</h2>
              <p>
                Oferecemos um plano de assinatura mensal e pacotes opcionais de tokens:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li><strong>Plano Essencial:</strong> R$ 37,90/mês, com 30.000 tokens mensais para funcionalidades de IA (chat jurídico, conversão de áudio em texto, extração automática de prazos de documentos) e uso ilimitado das calculadoras, documentos (cópia) e agenda.</li>
                <li><strong>Teste Gratuito:</strong> 7 dias grátis com 15.000 tokens para funcionalidades de IA (chat jurídico, conversão de áudio em texto) e uso ilimitado das calculadoras e documentos.</li>
                <li><strong>Pacotes Opcionais:</strong> 75.000 e 150.000 tokens avulsos para ampliar o uso das funcionalidades de IA conforme necessidade.</li>
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
                <strong>Limites por Plano:</strong> No Plano Essencial o uso é ilimitado. No teste gratuito de 7 dias, o uso também é ilimitado.
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
                 <strong>Limites por Plano:</strong> No Plano Essencial, a cópia de documentos é ilimitada. No teste gratuito de 7 dias, a cópia também é ilimitada. A cópia de documentos não consome tokens.
               </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Sistema de Áudio do Chat</h2>
              <p>
                O Oráculo Jurídico oferece conversão das respostas da IA em áudio para melhorar a experiência do usuário:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-2">
                <li><strong>Funcionamento:</strong> As respostas podem ser convertidas em áudio de alta qualidade usando vozes naturais</li>
                <li><strong>Armazenamento Temporário:</strong> O sistema mantém até 10 áudios salvos durante sua sessão ativa</li>
                <li><strong>Gerenciamento Automático:</strong> Quando o limite de 10 áudios é atingido, os 3 mais antigos são removidos automaticamente para dar espaço aos novos</li>
                <li><strong>Disponibilidade:</strong> O áudio permanece disponível ao navegar entre páginas da plataforma durante a mesma sessão</li>
                <li><strong>Expiração:</strong> Todo o áudio é automaticamente removido quando você desloga da conta ou fecha o navegador</li>
                <li><strong>Cobrança:</strong> Tokens são cobrados apenas na primeira geração do áudio. O consumo varia de acordo com o tamanho do texto (aproximadamente 1 token por caractere). Reproduções subsequentes do mesmo áudio durante a sessão não consomem tokens adicionais</li>
              </ul>
              <p className="mt-2">
                <strong>Benefício:</strong> Este sistema evita cobranças desnecessárias de tokens quando você reproduz o mesmo áudio múltiplas vezes durante sua sessão de uso.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Agenda Jurídica</h2>
              <p>
                A Agenda Jurídica permite organizar prazos processuais, audiências, reuniões e compromissos personalizados.
              </p>
              <p className="mt-2">
                 <strong>Limites por Plano:</strong> A Agenda Jurídica é exclusiva do Plano Essencial com uso ilimitado. Não está disponível no teste gratuito.
               </p>
              <p className="mt-2">
                <strong>Extração Automática de Prazos:</strong> A funcionalidade de extração automática de prazos via IA consome um mínimo de 500 tokens por uso, com custo variável baseado no tamanho do texto analisado. Esta função analiza documentos jurídicos (texto, PDF ou imagem) e identifica automaticamente prazos processuais, criando compromissos na agenda.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Responsabilidades do Usuário</h2>
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
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Confiabilidade e Limitações</h2>
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
              <h2 className="text-xl font-semibold text-foreground mb-4">12. Política de Reembolso</h2>
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
              <h2 className="text-xl font-semibold text-foreground mb-4">13. Modificações dos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações 
                entrarão em vigor imediatamente após a publicação na plataforma. Recomendamos a 
                verificação periódica deste documento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">14. Contato</h2>
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