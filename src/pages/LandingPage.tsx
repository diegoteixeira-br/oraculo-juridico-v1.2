import { Link } from "react-router-dom";
import { 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  Globe, 
  Smartphone, 
  History, 
  Lock,
  Check,
  ChevronDown,
  ChevronRight,
  Brain,
  Zap,
  Users,
  Award
} from "lucide-react";
import { useState } from "react";
import heroBrain from "../assets/hero-brain.jpg";
import legalOffice from "../assets/legal-office.jpg";


const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      question: "Como funcionam os créditos?",
      answer: "É muito simples. Cada pergunta completa que você faz à nossa Inteligência Artificial consome 1 crédito. Ao se cadastrar, você entra no nosso plano gratuito e ganha 1 crédito que se renova a cada 24 horas."
    },
    {
      question: "Meus créditos gratuitos se acumulam se eu não usar?",
      answer: "Não. O crédito gratuito é renovado diariamente, ou seja, você tem direito a uma nova consulta grátis a cada dia. Ele não é cumulativo. Para ter um saldo de créditos para usar quando quiser, você pode adquirir um de nossos pacotes."
    },
    {
      question: "Os créditos que eu compro têm data de validade?",
      answer: "Não! Uma das grandes vantagens dos nossos pacotes é que os créditos não expiram. Você pode comprá-los hoje e usá-los ao longo de semanas ou meses, conforme a sua necessidade."
    },
    {
      question: "O que acontece quando meus créditos acabam?",
      answer: "Se você estiver em um pacote pago e seus créditos acabarem, você pode simplesmente comprar um novo pacote a qualquer momento para continuar usando a ferramenta sem interrupções. Se você estiver no plano gratuito, basta aguardar a renovação do seu crédito diário no dia seguinte."
    },
    {
      question: "Quais formas de pagamento vocês aceitam para os pacotes?",
      answer: "Aceitamos as principais formas de pagamento, incluindo Cartão de Crédito e Pix, através da nossa plataforma de pagamento segura, a Cakto."
    },
    {
      question: "Preciso cadastrar um cartão de crédito para usar o plano gratuito?",
      answer: "Não. Para criar sua conta no plano gratuito e usar seu crédito diário, você não precisa fornecer nenhuma informação de pagamento. Você só precisará inserir seus dados de pagamento quando decidir comprar um pacote de créditos."
    },
    {
      question: "As informações da IA são confiáveis?",
      answer: "Nossa IA é uma ferramenta de auxílio poderosa, mas não substitui o julgamento profissional de um advogado. Sempre confira as fontes citadas."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, e com nosso novo sistema de créditos, não há nenhuma burocracia! Como não trabalhamos com assinaturas ou cobranças recorrentes, você tem total liberdade e controle.\n\nPara a Conta Gratuita: Você pode simplesmente parar de usar quando quiser, sem nenhum compromisso. Se desejar excluir seus dados, basta solicitar a exclusão da sua conta.\n\nPara os Pacotes Pagos: A compra de créditos é uma transação única, não uma assinatura. Portanto, não existe uma mensalidade para ser cancelada. Você compra seu pacote, usa os créditos no seu ritmo e só compra mais se e quando precisar."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Oráculo Jurídico
          </h1>
          
          <div className="flex items-center space-x-4">
            {/* Login button */}
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2 border border-border rounded-lg px-4 py-2 hover:bg-muted/10">
              <Smartphone className="w-4 h-4" />
              <span>Login</span>
            </Link>
            
            {/* Criar Conta button */}
            <Link to="/cadastro" className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center space-x-2 rounded-lg px-3 py-2 md:px-4">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-xs md:text-sm">Criar Conta</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/80">
          <img 
            src={heroBrain} 
            alt="AI Technology"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            A Resposta Jurídica que Você Precisa,{" "}
            <span className="text-primary">na Velocidade da Luz</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto animate-fade-in">
            Chega de perder horas em pesquisa. Com o Oráculo Jurídico, você acessa uma IA treinada para o Direito brasileiro e obtém respostas fundamentadas em segundos.
          </p>
          <Link
            to="/cadastro"
            className="inline-block btn-primary text-lg px-8 py-4 animate-fade-in"
          >
            Crie sua Conta Gratuita
          </Link>
        </div>
      </section>

      {/* Problema e Solução */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              A pesquisa jurídica tradicional é lenta e cara
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6 card-signup">
              <Clock className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Tempo Perdido</h3>
              <p className="text-muted-foreground">
                Horas gastas em Vade Mecuns e bases de jurisprudência.
              </p>
            </div>
            
            <div className="text-center p-6 card-signup">
              <DollarSign className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Custo Elevado</h3>
              <p className="text-muted-foreground">
                Altas mensalidades de complexas plataformas de pesquisa.
              </p>
            </div>
            
            <div className="text-center p-6 card-signup">
              <AlertTriangle className="w-16 h-16 text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Informação Desatualizada</h3>
              <p className="text-muted-foreground">
                Risco de basear sua estratégia em leis ou decisões revogadas.
              </p>
            </div>
          </div>

          <div className="text-center bg-card p-8 rounded-lg border border-border">
            <h3 className="text-3xl font-bold mb-4 text-primary">
              Oráculo Jurídico: Sua Advocacia na Era da Inteligência Artificial
            </h3>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
              Nossa plataforma centraliza o conhecimento jurídico e o entrega de forma conversacional e instantânea. Pergunte como se estivesse falando com um assistente sênior. Disponível no seu computador ou celular.
            </p>
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Simples, Rápido e Poderoso
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Cadastre-se</h3>
              <p className="text-muted-foreground">
                Crie sua conta gratuita e comece a usar com 1 crédito renovado diariamente. Sem compromisso.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Pergunte em Linguagem Natural</h3>
              <p className="text-muted-foreground">
                Acesse nosso chat e faça sua pergunta. Ex: "Quais os requisitos da usucapião extraordinária segundo o Código Civil?"
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Receba a Resposta na Hora</h3>
              <p className="text-muted-foreground">
                Nossa IA analisa sua questão e fornece uma resposta clara, com as devidas fontes legais, em segundos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Principais */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Ferramentas Desenhadas para o Advogado Moderno
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 card-signup">
              <Brain className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">IA Especializada</h3>
              <p className="text-muted-foreground">
                Treinada com foco na legislação e jurisprudência brasileira.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <Globe className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Acesso 24/7</h3>
              <p className="text-muted-foreground">
                Sua fonte de consulta sempre disponível.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <Smartphone className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Multiplataforma</h3>
              <p className="text-muted-foreground">
                Use no desktop do seu escritório ou no celular entre audiências.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <History className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Histórico de Conversas</h3>
              <p className="text-muted-foreground">
                Salve e consulte suas pesquisas anteriores a qualquer momento.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <Lock className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Segurança de Dados</h3>
              <p className="text-muted-foreground">
                Suas informações e pesquisas são confidenciais.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <Award className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Custo-Benefício Imbatível</h3>
              <p className="text-muted-foreground">
                Acesso ilimitado por um preço que cabe no seu bolso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Preços */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Escolha o plano ideal para sua necessidade
            </h2>
            <p className="text-lg text-muted-foreground">
              Comece gratuitamente ou compre créditos para uso intensivo. Sem mensalidades, sem compromisso.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Card 1: Plano Gratuito */}
            <div className="card-signup p-8 text-center relative">
              <h3 className="text-2xl font-bold mb-4 text-foreground">Gratuito</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">R$ 0</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Perfeito para testar a plataforma e para consultas esporádicas.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-muted-foreground">1 crédito por dia</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-muted-foreground">Acesso à IA Jurídica</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-muted-foreground">Histórico de conversas</span>
                </div>
              </div>
              
              <Link
                to="/cadastro"
                className="inline-block w-full py-3 px-6 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors rounded-lg font-semibold"
              >
                Cadastre-se Grátis
              </Link>
            </div>

            {/* Card 2: Pacote 100 (Destaque) */}
            <div className="card-signup p-8 text-center relative transform scale-105 border-2 border-primary">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                MAIS POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">Pacote 100</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">R$ 97,00</span>
              </div>
              <p className="text-muted-foreground mb-6">
                O melhor custo-benefício para advogados e escritórios.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">100 créditos para usar quando quiser</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Sem data de expiração</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Acesso prioritário à IA</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="text-muted-foreground">Suporte via e-mail</span>
                </div>
              </div>
              
              <Link
                to="/pagamento"
                className="inline-block w-full py-3 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg font-semibold"
              >
                Comprar Créditos
              </Link>
            </div>

            {/* Card 3: Pacote 50 */}
            <div className="card-signup p-8 text-center relative">
              <h3 className="text-2xl font-bold mb-4 text-foreground">Pacote 50</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-foreground">R$ 59,90</span>
              </div>
              <p className="text-muted-foreground mb-6">
                Ideal para estudantes e profissionais com demanda moderada.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-muted-foreground">50 créditos para usar quando quiser</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-muted-foreground">Sem data de expiração</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-secondary" />
                  <span className="text-muted-foreground">Acesso à IA Jurídica</span>
                </div>
              </div>
              
              <Link
                to="/pagamento"
                className="inline-block w-full py-3 px-6 border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors rounded-lg font-semibold"
              >
                Comprar Créditos
              </Link>
            </div>
          </div>

          {/* Seção FAQ sobre Créditos */}
          <div className="bg-card p-8 rounded-lg border border-border text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Como funcionam os créditos?
            </h3>
            <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
              É simples. Cada pergunta completa que você faz à nossa Inteligência Artificial consome 1 crédito. No plano gratuito, seu crédito é renovado a cada 24 horas. Nos pacotes pagos, os créditos não expiram e você pode comprar mais sempre que precisar.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Ainda tem dúvidas?
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="card-signup">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/10 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  {openFaq === index ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Oráculo Jurídico
              </h3>
              <p className="text-sm text-muted-foreground">
                CNPJ: 00.000.000/0001-00
              </p>
            </div>
            
            <div className="flex space-x-8">
              <Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
                Política de Privacidade
              </Link>
              <Link to="/contato" className="text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Oráculo Jurídico. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;