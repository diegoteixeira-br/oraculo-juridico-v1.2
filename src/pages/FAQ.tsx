import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, HelpCircle, MessageCircle, Clock, CreditCard, Shield, Users, Zap, Settings, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FAQ = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useSEO({
    title: "Perguntas Frequentes - Oráculo Jurídico | FAQ",
    description: "Encontre respostas para as principais dúvidas sobre o Oráculo Jurídico. Tokens, planos, funcionalidades e muito mais. Tire suas dúvidas aqui."
  });

  const faqCategories = [
    {
      title: "Tokens e Créditos",
      icon: <Zap className="w-6 h-6" />,
      questions: [
        {
          question: "Como funcionam os tokens?",
          answer: "Tokens são usados exclusivamente no chat com a IA jurídica. No Teste Gratuito você recebe 15.000 tokens válidos por 7 dias; no Plano Básico, 30.000 tokens por mês; no Plano Profissional, tokens ilimitados para consultas sem limite."
        },
        {
          question: "Meus tokens gratuitos se acumulam se eu não usar?",
          answer: "Não. O saldo de 15.000 tokens do teste é único para o período de 7 dias e não é cumulativo após o término do teste."
        },
        {
          question: "Como posso adquirir mais tokens?",
          answer: "Você pode assinar o Plano Básico (30.000 tokens/mês por R$ 59,90) ou o Plano Profissional (tokens ilimitados por R$ 97,00). Pacotes avulsos: Recarga Rápida (25k tokens - R$ 39,90) e Recarga Inteligente (50k tokens - R$ 69,90), disponíveis para assinantes do Plano Básico."
        },
        {
          question: "O que acontece se eu gastar todos os meus tokens?",
          answer: "Quando seus tokens acabam, você pode comprar mais através dos pacotes avulsos ou fazer upgrade do seu plano. O Plano Profissional oferece tokens ilimitados."
        }
      ]
    },
    {
      title: "Planos e Pagamentos",
      icon: <CreditCard className="w-6 h-6" />,
      questions: [
        {
          question: "Preciso cadastrar um cartão de crédito para usar o plano gratuito?",
          answer: "Sim. Para ativar o teste de 7 dias é necessário cadastrar um cartão de crédito. A cobrança é feita no ato, mas você tem reembolso integral se cancelar antes do 8º dia."
        },
        {
          question: "Posso cancelar minha assinatura a qualquer momento?",
          answer: "Sim, você pode cancelar sua assinatura a qualquer momento através da sua conta. O cancelamento será efetivo no final do período já pago."
        },
        {
          question: "Qual a diferença entre os planos?",
          answer: "Plano Gratuito: 15.000 tokens por 7 dias. Plano Básico: 30.000 tokens/mês + recursos extras por R$ 59,90. Plano Profissional: tokens ilimitados + todos os recursos por R$ 97,00."
        },
        {
          question: "Há desconto para pagamento anual?",
          answer: "Sim, oferecemos desconto para pagamentos anuais. Entre em contato conosco para saber mais sobre as condições especiais para planos anuais."
        }
      ]
    },
    {
      title: "Confiabilidade e Segurança",
      icon: <Shield className="w-6 h-6" />,
      questions: [
        {
          question: "As informações da IA são confiáveis?",
          answer: "Nossa IA integra-se com a LexML, base oficial de jurisprudência do governo brasileiro. IMPORTANTE: As informações sempre precisam ser revisadas e adaptadas às necessidades específicas de cada caso pelo advogado responsável, pois a base LexML pode não estar 100% atualizada e cada situação jurídica é única."
        },
        {
          question: "Meus dados estão seguros?",
          answer: "Sim. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança. Seus dados são protegidos de acordo com a LGPD e nunca são compartilhados com terceiros."
        },
        {
          question: "Posso confiar nas respostas da IA para tomar decisões jurídicas?",
          answer: "A IA é uma ferramenta de apoio à pesquisa jurídica. Sempre recomendamos que as informações sejam analisadas e validadas por um profissional qualificado antes de tomar decisões importantes."
        },
        {
          question: "As conversas ficam salvas?",
          answer: "Sim, mantemos um histórico completo de suas conversas para que você possa consultar pesquisas anteriores. No plano gratuito, o histórico fica disponível por 7 dias."
        }
      ]
    },
    {
      title: "Funcionalidades",
      icon: <Settings className="w-6 h-6" />,
      questions: [
        {
          question: "Que tipo de perguntas posso fazer?",
          answer: "Você pode fazer qualquer pergunta relacionada ao direito brasileiro: consultas sobre legislação, jurisprudência, procedimentos, prazos, requisitos legais, interpretação de normas e muito mais."
        },
        {
          question: "A IA funciona em dispositivos móveis?",
          answer: "Sim, nossa plataforma é totalmente responsiva e funciona perfeitamente em smartphones, tablets e computadores."
        },
        {
          question: "Posso usar a IA offline?",
          answer: "Não, é necessária conexão com a internet para acessar nossa base de dados e obter respostas atualizadas."
        },
        {
          question: "Há limite de perguntas por dia?",
          answer: "Não há limite de perguntas, apenas limite de tokens. Cada pergunta consome uma quantidade de tokens baseada na complexidade da consulta."
        }
      ]
    },
    {
      title: "Suporte e Contato",
      icon: <Users className="w-6 h-6" />,
      questions: [
        {
          question: "Como posso entrar em contato com o suporte?",
          answer: "Você pode nos contatar através do email suporte@oraculojuridico.com.br ou pelo chat disponível em nossa plataforma. Nosso horário de atendimento é de segunda a sexta, das 9h às 18h."
        },
        {
          question: "Vocês oferecem treinamento para usar a plataforma?",
          answer: "Sim, oferecemos materiais de treinamento e suporte para ajudá-lo a aproveitar ao máximo nossa plataforma. Usuários do Plano Profissional têm acesso a suporte prioritário."
        },
        {
          question: "Posso sugerir melhorias para a plataforma?",
          answer: "Claro! Valorizamos muito o feedback dos nossos usuários. Entre em contato conosco com suas sugestões e estaremos sempre trabalhando para melhorar nossa plataforma."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-foreground">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-slate-700"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
              Perguntas Frequentes
            </h1>
            <p className="text-muted-foreground mt-2">Encontre respostas para suas principais dúvidas</p>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <HelpCircle className="w-16 h-16 text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6 text-foreground">
            Tem dúvidas? Nós temos as <span className="text-primary">respostas</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Explore nossa seção de perguntas frequentes ou entre em contato conosco para suporte personalizado.
          </p>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <div className="flex items-center gap-3 mb-8">
                <div className="text-primary">{category.icon}</div>
                <h3 className="text-2xl font-bold text-foreground">{category.title}</h3>
              </div>
              
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const globalIndex = categoryIndex * 100 + questionIndex;
                  return (
                    <div key={globalIndex} className="card-signup border border-border">
                      <button
                        onClick={() => toggleFaq(globalIndex)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/5 transition-colors"
                      >
                        <h4 className="text-lg font-semibold text-foreground pr-4">
                          {faq.question}
                        </h4>
                        {openFaq === globalIndex ? (
                          <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </button>
                      
                      {openFaq === globalIndex && (
                        <div className="px-6 pb-6">
                          <div className="border-t border-border pt-4">
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default FAQ;