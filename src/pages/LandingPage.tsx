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
import caktoLogo from "../assets/cakto-logo.png";

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqData = [
    {
      question: "A cobrança é automática após os 7 dias?",
      answer: "Sim, ao se cadastrar você insere seus dados de pagamento e a cobrança de R$97,00 ocorrerá automaticamente no 8º dia, a menos que cancele antes."
    },
    {
      question: "As informações da IA são confiáveis?",
      answer: "Nossa IA é uma ferramenta de auxílio poderosa, mas não substitui o julgamento profissional de um advogado. Sempre confira as fontes citadas."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, você pode cancelar sua assinatura a qualquer momento, sem multas ou burocracia."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img 
            src="/lovable-uploads/c69e5a84-404e-4cbe-9d84-d19d95158721.png" 
            alt="Oráculo Jurídico" 
            className="h-16 w-auto"
          />
          <nav className="hidden md:flex space-x-8">
            <Link to="/entrar" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span>Login</span>
            </Link>
            <Link to="/termos" className="text-muted-foreground hover:text-foreground transition-colors">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">
              Política de Privacidade
            </Link>
          </nav>
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
            Experimente 7 Dias Grátis
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
                Crie sua conta e inicie seu teste gratuito de 7 dias. Sem compromisso.
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Um Investimento Inteligente na sua Produtividade
            </h2>
          </div>
          
          <div className="card-signup p-8 text-center max-w-lg mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Plano Profissional</h3>
            <div className="mb-6">
              <span className="text-5xl font-bold text-primary">R$ 97,00</span>
              <span className="text-muted-foreground ml-2">/mês</span>
              <p className="text-sm text-muted-foreground mt-2">
                Após o seu período de 7 dias de teste gratuito.
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-secondary" />
                <span className="text-muted-foreground">Acesso Ilimitado à IA</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-secondary" />
                <span className="text-muted-foreground">Suporte Prioritário</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-secondary" />
                <span className="text-muted-foreground">Acesso Multiplataforma</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-secondary" />
                <span className="text-muted-foreground">Atualizações Constantes</span>
              </div>
            </div>
            
            <div className="mb-8">
              <Link
                to="/cadastro"
                className="inline-block btn-primary w-full text-lg py-4"
              >
                Iniciar Meu Teste Gratuito Agora
              </Link>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span>Pagamento seguro e automatizado. Você pode cancelar quando quiser.</span>
              </div>
            </div>
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
              <a href="mailto:contato@oraculojuridico.com.br" className="text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </a>
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