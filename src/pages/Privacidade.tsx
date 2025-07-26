import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacidade = () => {
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
              <div className="space-y-3">
                <p>
                  Coletamos as seguintes informações pessoais:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de cadastro:</strong> nome completo, e-mail e senha (criptografada)</li>
                  <li><strong>Dados de perfil:</strong> informações adicionais do perfil do usuário</li>
                  <li><strong>Dados de pagamento:</strong> informações processadas pelo Stripe para compra de tokens</li>
                  <li><strong>Conversas com IA:</strong> perguntas, respostas e documentos compartilhados no chat</li>
                  <li><strong>Dados de uso:</strong> histórico de consumo de tokens, transações e acessos</li>
                  <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador e dados de sessão</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Uso das Informações</h2>
              <div className="space-y-3">
                <p>
                  Utilizamos suas informações para:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fornecer consultas jurídicas através da nossa IA especializada</li>
                  <li>Gerenciar seu saldo de tokens (gratuitos e pagos)</li>
                  <li>Processar pagamentos via Stripe de forma segura</li>
                  <li>Manter histórico de suas consultas e transações</li>
                  <li>Melhorar a qualidade das respostas da IA</li>
                  <li>Enviar comunicações importantes sobre a conta</li>
                  <li>Garantir a segurança e prevenir uso inadequado</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Sistema de Tokens e Dados de Uso</h2>
              <div className="space-y-3">
                <p>
                  Registramos informações sobre o uso de tokens:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Quantidade de tokens consumidos por consulta</li>
                  <li>Saldo de tokens gratuitos diários e tokens pagos</li>
                  <li>Histórico de compras e transações</li>
                  <li>Data e hora de cada consulta realizada</li>
                </ul>
                <p>
                  Essas informações são essenciais para o funcionamento do serviço e controle de uso.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Compartilhamento de Dados</h2>
              <div className="space-y-3">
                <p>
                  Compartilhamos informações limitadas com:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Stripe:</strong> dados de pagamento para processamento seguro de transações</li>
                  <li><strong>OpenAI:</strong> perguntas para processamento pela IA (sem dados pessoais identificáveis)</li>
                  <li><strong>Supabase:</strong> nosso provedor de banco de dados e autenticação</li>
                  <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
                </ul>
                <p>
                  Não vendemos, alugamos ou comercializamos suas informações pessoais.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Segurança dos Dados</h2>
              <div className="space-y-3">
                <p>
                  Implementamos as seguintes medidas de segurança:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Criptografia de senhas usando tecnologia bcrypt</li>
                  <li>Comunicação segura via HTTPS/SSL</li>
                  <li>Autenticação baseada em JWT tokens</li>
                  <li>Controle de acesso por usuário (RLS)</li>
                  <li>Monitoramento de atividades suspeitas</li>
                  <li>Backups regulares dos dados</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Armazenamento de Conversas</h2>
              <p>
                As conversas com a IA jurídica são armazenadas para permitir a continuidade do 
                atendimento e melhorar a qualidade das respostas. Você pode solicitar a exclusão 
                do histórico de conversas a qualquer momento através do suporte.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Cookies e Tecnologias Similares</h2>
              <div className="space-y-3">
                <p>
                  Utilizamos cookies para:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Manter sua sessão de usuário ativa</li>
                  <li>Lembrar suas preferências</li>
                  <li>Analisar o uso da plataforma</li>
                  <li>Melhorar a experiência de navegação</li>
                </ul>
                <p>
                  Você pode controlar cookies através das configurações do navegador.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Direitos do Usuário (LGPD)</h2>
              <div className="space-y-3">
                <p>
                  Conforme a LGPD, você tem direito a:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir dados incompletos ou incorretos</li>
                  <li>Solicitar exclusão de dados desnecessários</li>
                  <li>Revogar consentimento</li>
                  <li>Solicitar portabilidade dos dados</li>
                  <li>Informações sobre uso e compartilhamento</li>
                </ul>
                <p>
                  Para exercer esses direitos, entre em contato através do e-mail de suporte.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Retenção de Dados</h2>
              <div className="space-y-3">
                <p>
                  Mantemos seus dados pelos seguintes períodos:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Dados de conta:</strong> enquanto a conta estiver ativa</li>
                  <li><strong>Histórico de conversas:</strong> por até 2 anos ou até solicitação de exclusão</li>
                  <li><strong>Dados de transação:</strong> conforme exigido pela legislação fiscal (5 anos)</li>
                  <li><strong>Logs de segurança:</strong> por até 6 meses</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Alterações na Política</h2>
              <p>
                Podemos atualizar esta política periodicamente. Mudanças significativas serão 
                notificadas por e-mail e/ou aviso na plataforma. A data da última atualização 
                sempre estará disponível no topo deste documento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Contato e Encarregado de Dados</h2>
              <div className="space-y-3">
                <p>
                  Para questões sobre privacidade e proteção de dados:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>E-mail:</strong> privacidade@oraculojuridico.com.br</li>
                  <li><strong>Suporte geral:</strong> suporte@oraculojuridico.com.br</li>
                  <li><strong>Encarregado de Dados (DPO):</strong> dpo@oraculojuridico.com.br</li>
                </ul>
              </div>
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