import { Link } from "react-router-dom";
import { Clock, DollarSign, AlertTriangle, Shield, Globe, Smartphone, History, Lock, Check, ChevronDown, ChevronRight, Brain, Zap, Users, Award, Scale, Gavel, FileText, Building, Calendar, Heart, MessageCircle, Calculator, Target, TrendingUp, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CustomYouTubePlayer } from "@/components/CustomYouTubePlayer";
import { useSEO } from "@/hooks/useSEO";
import heroBrain from "../assets/hero-brain-legal.jpg";
import legalOffice from "../assets/legal-office.jpg";
const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [videoSettings, setVideoSettings] = useState({
    youtube_video_id: 'VIDEO_ID',
    video_title: 'Veja Como Funciona na Prática',
    video_description: 'Assista ao vídeo demonstrativo e descubra como o Oráculo Jurídico pode revolucionar sua prática advocatícia',
    video_enabled: false
  });
  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  useEffect(() => {
    const fetchVideoSettings = async () => {
      try {
        const {
          data
        } = await supabase.from('landing_page_settings').select('youtube_video_id, video_title, video_description, video_enabled').maybeSingle();
        if (data) {
          setVideoSettings({
            youtube_video_id: data.youtube_video_id || 'VIDEO_ID',
            video_title: data.video_title || 'Veja Como Funciona na Prática',
            video_description: data.video_description || 'Assista ao vídeo demonstrativo e descubra como o Oráculo Jurídico pode revolucionar sua prática advocatícia',
            video_enabled: data.video_enabled || false
          });
        }
      } catch (error) {
        console.error('Erro ao carregar configurações de vídeo:', error);
      }
    };
    fetchVideoSettings();
  }, []);
  const scrollToFreeAccount = () => {
    const freeAccountSection = document.getElementById('free-account-section');
    if (freeAccountSection) {
      freeAccountSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };
  useSEO({
    title: "Oráculo Jurídico — IA Jurídica para Advogados",
    description: "Crie sua conta gratuita e teste 7 dias com 15.000 tokens. Chat jurídico com IA, calculadoras, documentos e agenda."
  });
  const faqData = [{
    question: "Como funcionam os tokens?",
    answer: "Tokens são usados apenas no chat com a IA. No Plano Gratuito de teste você recebe 15.000 tokens válidos por 7 dias; no Plano Básico, 30.000 tokens por mês; no Plano Profissional, tokens ilimitados. Calculadoras e documentos seguem os limites do seu plano. A agenda está disponível nos Planos Básico e Profissional."
  }, {
    question: "Meus tokens gratuitos se acumulam se eu não usar?",
    answer: "Não. O saldo de 15.000 tokens do teste é único para o período de 7 dias e não é cumulativo após o término do teste."
  }, {
    question: "Preciso cadastrar um cartão de crédito para usar o plano gratuito?",
    answer: "Sim. Para ativar o teste de 7 dias é necessário cadastrar um cartão de crédito. A cobrança é feita no ato, mas você tem reembolso integral se cancelar antes do 8º dia."
  }, {
    question: "As informações da IA são confiáveis?",
    answer: "Nossa IA integra-se com a LexML, base oficial de jurisprudência do governo brasileiro. IMPORTANTE: As informações sempre precisam ser revisadas e adaptadas às necessidades específicas de cada caso pelo advogado responsável, pois a base LexML pode não estar 100% atualizada e cada situação jurídica é única."
  }, {
    question: "Como posso adquirir mais tokens?",
    answer: "Você pode assinar o Plano Básico (R$ 59,90/mês) para liberar uso ilimitado de calculadoras, documentos e agenda (além de 30.000 tokens/mês para o chat), ou o Plano Profissional (R$ 97,00/mês) com tokens ilimitados. Pacotes avulsos: Recarga Rápida (25k tokens - R$ 39,90) e Recarga Inteligente (50k tokens - R$ 69,90), disponíveis apenas para assinantes do Plano Básico."
  }, {
    question: "O que é a Agenda Jurídica?",
    answer: "É uma ferramenta disponível nos Planos Básico e Profissional para registrar manualmente prazos, audiências e compromissos. Quando houver itens agendados, você recebe um e-mail de lembrete diariamente no horário configurado na sua conta (respeitando seu fuso horário). Possui também extração automática de prazos via IA que consome mínimo 500 tokens, variando conforme o tamanho do texto."
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-foreground">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" alt="Oráculo Jurídico" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
                Oráculo Jurídico
              </h1>
              <p className="text-sm text-slate-400">Home</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/login" state={{
            from: '/'
          }} className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1 sm:space-x-2 border border-border rounded-lg px-2 py-1.5 sm:px-4 sm:py-2 hover:bg-muted/10">
              <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Vídeo Explicativo */}
      {videoSettings.video_enabled && <section className="py-16 px-4 bg-muted/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6 md:text-[b79b71] text-[#b79b71]">
              {videoSettings.video_title}
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              {videoSettings.video_description}
            </p>
            
            {videoSettings.youtube_video_id && videoSettings.youtube_video_id !== 'VIDEO_ID' ? <CustomYouTubePlayer videoId={videoSettings.youtube_video_id} title={videoSettings.video_title} /> : <div className="relative max-w-3xl mx-auto">
                <div className="aspect-video bg-slate-800/50 rounded-lg border border-border overflow-hidden shadow-2xl flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-4">🎥</div>
                    <p>Vídeo será configurado em breve</p>
                  </div>
                </div>
              </div>}
          </div>
        </section>}

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background/80">
          <img src={heroBrain} alt="IA jurídica - imagem hero" loading="lazy" decoding="async" className="w-full h-full object-cover object-center opacity-20" width="1920" height="1080" />
        </div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">A Resposta Jurídica que Você Precisa</span>, <span className="text-primary">na Velocidade da Luz</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto animate-fade-in">
            Chega de perder horas em pesquisa. Com o Oráculo Jurídico, você acessa uma IA treinada para o Direito brasileiro e obtém respostas fundamentadas em segundos.
          </p>
          <button onClick={scrollToFreeAccount} className="inline-block btn-primary text-lg px-8 py-4 animate-fade-in">
            Quero Começar Gratuitamente
          </button>
        </div>
      </section>
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
              <h3 className="text-xl font-semibold mb-4 text-foreground">Cadastre-se Gratuitamente</h3>
              <p className="text-muted-foreground">Crie sua conta e teste 7 dias com 15.000 tokens. Cobrança no ato com reembolso integral se cancelar antes do 8º dia.</p>
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
              <h3 className="text-xl font-semibold mb-4 text-foreground">IA Especializada em Direito</h3>
              <p className="text-muted-foreground">
                Treinada com foco na legislação e jurisprudência brasileira.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <Calendar className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Agenda Jurídica</h3>
              <p className="text-muted-foreground">
                Registre e organize manualmente prazos e compromissos; receba lembretes por e-mail no horário configurado na sua conta.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <Calculator className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Calculadoras Especializadas</h3>
              <p className="text-muted-foreground">
                Contratos bancários e pensão alimentícia com precisão jurídica.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <Globe className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-4 text-foreground">Acesso 24/7</h3>
              <p className="text-muted-foreground">
                Sua fonte de consulta jurídica sempre disponível.
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
              <h3 className="text-xl font-semibold mb-4 text-foreground">Histórico Completo</h3>
              <p className="text-muted-foreground">
                Mantenha registro de todas suas consultas e documentos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nova Seção - Agenda Jurídica */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Agenda Jurídica Inteligente
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Nunca mais perca um prazo: cadastre compromissos manualmente e receba lembretes por e-mail no horário configurado na sua conta
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Cadastro Manual de Compromissos</h3>
                  <p className="text-muted-foreground">
                    Registre prazos, audiências e compromissos manualmente de forma rápida e organizada.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Calendário Integrado</h3>
                  <p className="text-muted-foreground">
                    Visualize todos seus compromissos em um calendário organizado, com filtros por tipo, status e prioridade.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Organização Completa</h3>
                  <p className="text-muted-foreground">
                    Gerencie prazos processuais, audiências, reuniões com clientes e compromissos personalizados em um só lugar.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Extração Automática de Prazos</h3>
                  <p className="text-muted-foreground">
                    IA analisa documentos (texto, PDF ou imagem) e identifica prazos automaticamente. <strong className="text-yellow-400">Mínimo 500 tokens, custo varia com o tamanho do texto.</strong>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Agenda Jurídica</h4>
                    <p className="text-sm text-muted-foreground">Seus próximos compromissos</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-200">Prazo para Contestação</p>
                      <p className="text-xs text-blue-300/80">15/01 - 14:00 • Processo 123456</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-red-600/10 rounded-lg border border-red-500/20">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-200">Audiência de Instrução</p>
                      <p className="text-xs text-red-300/80">18/01 - 09:30 • Fórum Central</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-green-600/10 rounded-lg border border-green-500/20">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-200">Reunião com Cliente</p>
                      <p className="text-xs text-green-300/80">20/01 - 16:00 • Escritório</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos e Limites */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4 text-foreground">Planos e Limites</h2>
            <p className="text-muted-foreground">Entenda o que você pode fazer no Plano Gratuito, Plano Básico e Plano Profissional</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 card-signup border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-2">Plano Gratuito </h3>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>Chat com IA: 15.000 tokens de teste (válidos por 7 dias)</li>
                <li>Calculadoras jurídicas: acesso completo por 7 dias</li>
                <li>Documentos prontos: copiar e gerar modelos por 7 dias</li>
                
              </ul>
            </div>
            <div className="p-6 card-signup border border-border">
              <h3 className="text-xl font-semibold text-foreground mb-2 flex items-center gap-2 flex-wrap">
                Plano Básico
              </h3>
              <div className="flex items-center gap-2 mb-2 animate-fade-in">
                <span className="text-foreground font-bold text-lg">R$ 59,90/mês</span>
              </div>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>Chat com IA: 30.000 tokens por mês</li>
                
                <li>Calculadoras: uso ilimitado</li>
                <li>Documentos: ilimitados</li>
                <li>Agenda jurídica: compromissos ilimitados</li>
                
              </ul>
            </div>
            <div className="p-6 card-signup border border-amber-500/50 bg-gradient-to-br from-amber-900/10 to-amber-800/10 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <span className="bg-amber-600 text-white px-3 py-1 text-sm rounded-full">Recomendado</span>
              </div>
              <h3 className="text-xl font-semibold text-amber-400 mb-2 flex items-center gap-2 flex-wrap pt-4">
                Plano Profissional
              </h3>
              <div className="flex items-center gap-2 mb-2 animate-fade-in">
                <span className="text-amber-400 font-bold text-lg">R$ 97,00/mês</span>
              </div>
              <ul className="list-disc ml-6 space-y-2 text-muted-foreground">
                <li>Chat com IA: <strong className="text-amber-400">Tokens ilimitados</strong> (política de uso justo)</li>
                <li>Calculadoras: uso ilimitado</li>
                <li>Documentos: ilimitados</li>
                <li>Agenda jurídica: compromissos ilimitados</li>
                <li><strong className="text-amber-400">Suporte prioritário</strong></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Calculadoras Jurídicas Melhoradas */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Calculadoras Jurídicas Especializadas
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Ferramentas avançadas para cálculos jurídicos precisos, desenvolvidas especificamente para advogados
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 card-signup border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center mb-6">
                <Building className="w-12 h-12 text-primary mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Cálculo de Contrato Bancário</h3>
                  <p className="text-muted-foreground text-sm">Análise completa de contratos financeiros</p>
                </div>
              </div>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Juros simples e compostos
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Correção monetária (IPCA, IGP-M, SELIC)
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Multa e juros de mora personalizáveis
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Pagamentos parciais com datas
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Relatório detalhado com fundamentação
                </li>
              </ul>
            </div>

            <div className="p-8 card-signup border-2 border-primary/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center mb-6">
                <Heart className="w-12 h-12 text-primary mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Cálculo de Pensão Alimentícia</h3>
                  <p className="text-muted-foreground text-sm">Cálculos precisos de pensão alimentícia</p>
                </div>
              </div>
              <ul className="space-y-2 text-muted-foreground mb-6">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Cálculo por percentual ou valor fixo
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Múltiplos filhos com idades diferentes
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Valores em atraso com juros e multa
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Correção monetária automática
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-primary mr-2" />
                  Relatório completo para petições
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-card p-6 rounded-lg border border-border max-w-3xl mx-auto">
              <h3 className="text-xl font-bold mb-3 text-foreground">
                Acesso às Calculadoras
              </h3>
              <p className="text-muted-foreground">As calculadoras jurídicas estão disponíveis em sua conta após o login. No Plano Básico o uso é ilimitado; no Plano Gratuito você pode realizar teste por 7 dias.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Conta Gratuita */}
      <section id="free-account-section" className="py-10 sm:py-16 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
              Comece gratuitamente agora mesmo
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Crie sua conta gratuita e teste nossa IA jurídica sem compromisso
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="card-signup p-8 text-center transform scale-105 border-2 border-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                100% GRATUITO
              </div>
              <h3 className="text-3xl font-bold mb-4 text-foreground mt-2">Conta Gratuita</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold text-primary">R$ 0</span>
                <p className="text-muted-foreground mt-2">
                  Para sempre, sem compromisso
                </p>
              </div>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3 text-left">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">7 dias para teste </span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Acesso completo à IA Jurídica com 15.000 tokens</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Calculadoras especializadas</span>
                </div>
                <div className="flex items-center space-x-3 text-left">
                  <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-muted-foreground">Histórico de conversas</span>
                </div>
                
              </div>
              
              <Link to="/cadastro" className="inline-block w-full py-4 px-6 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg font-semibold text-lg">
                Criar Conta Gratuita
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center bg-card p-6 rounded-lg border border-border">
            <h3 className="text-xl font-bold mb-3 text-foreground">
              Precisa de mais tokens?
            </h3>
            <p className="text-muted-foreground">Após criar sua conta, você poderá escolher entre o Plano Básico (R$ 59,90/mês - 30k tokens) ou Plano Profissional (R$ 97,00/mês - tokens ilimitados). Para assinantes do Plano Básico, estão disponíveis pacotes extras: Recarga Rápida (25k tokens por R$ 39,90) e Recarga Inteligente (50k tokens por R$ 69,90).</p>
          </div>
        </div>
      </section>

      {/* Legal Tech Innovation Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Tecnologia Jurídica de Última Geração
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Combinamos inteligência artificial avançada com conhecimento jurídico especializado
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gavel className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Análise Processual Avançada</h3>
                  <p className="text-muted-foreground">
                    Identifica estratégias processuais e sugere fundamentação legal baseada em casos similares.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Redação Jurídica Inteligente</h3>
                  <p className="text-muted-foreground">
                    Auxilia na elaboração de peças processuais com linguagem técnica precisa, fundamentação sólida e modelos personalizáveis.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img src={legalOffice} alt="Escritório jurídico moderno - imagem ilustrativa" loading="lazy" decoding="async" className="w-full h-64 sm:h-80 md:h-96 object-cover object-center rounded-lg" width="1920" height="1080" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-lg"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center space-x-4 bg-card/90 backdrop-blur-sm rounded-lg p-4">
                  <Building className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Escritórios Modernos</h4>
                    <p className="text-sm text-muted-foreground">Tecnologia integrada à advocacia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Funcionalidades Completas */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-foreground">
              Plataforma Jurídica Completa
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Tudo que você precisa para modernizar sua prática jurídica em uma única plataforma
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 card-signup text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Chat IA Jurídica</h3>
              <p className="text-sm text-muted-foreground">
                Consultas ilimitadas com IA especializada em direito brasileiro
              </p>
            </div>
            
            <div className="p-6 card-signup text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Agenda Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Cadastro manual e extração automática de prazos via IA. Organização de compromissos com lembretes por e-mail no horário que você configurar
              </p>
            </div>
            
            <div className="p-6 card-signup text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Calculadoras</h3>
              <p className="text-sm text-muted-foreground">
                Contratos bancários e pensão alimentícia com precisão jurídica
              </p>
            </div>
            
            <div className="p-6 card-signup text-center">
              <div className="w-16 h-16 bg-orange-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-foreground">Documentos</h3>
              <p className="text-sm text-muted-foreground">
                Modelos jurídicos personalizáveis para download
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
              Ainda tem dúvidas?
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => <div key={index} className="card-signup">
                <button onClick={() => toggleFaq(index)} className="w-full p-6 text-left flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <h3 className="text-lg font-semibold text-foreground">
                    {faq.question}
                  </h3>
                  {openFaq === index ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </button>
                {openFaq === index && <div className="px-6 pb-6">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>}
              </div>)}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/90 border-t border-slate-700/50 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <button onClick={() => window.scrollTo({
              top: 0,
              behavior: 'smooth'
            })} className="flex items-center gap-3 mb-4 cursor-pointer group">
                <img src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" alt="Oráculo Jurídico" className="h-8 w-auto transition-transform group-hover:scale-105" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-purple-300 transition-all">
                  Oráculo Jurídico
                </span>
              </button>
              <p className="text-slate-400">
                Sua ferramenta jurídica inteligente para consultas, cálculos e documentos legais.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-200">Links Úteis</h3>
              <ul className="space-y-2 text-slate-400">
                
                
                <li><Link to="/contato" className="hover:text-blue-400 transition-colors">Contato</Link></li>
                <li><Link to="/termos" className="hover:text-blue-400 transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-blue-400 transition-colors">Política de Privacidade</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-slate-200">Recursos</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/blog" className="hover:text-blue-400 transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700/50 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Oráculo Jurídico. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;