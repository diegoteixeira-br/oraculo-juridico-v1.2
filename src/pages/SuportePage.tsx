import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MessageCircle, Phone, Clock, Shield, Zap, Users, HelpCircle, ExternalLink, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import UserMenu from "@/components/UserMenu";
import { useScrollDirection } from "@/hooks/useScrollDirection";

const SuportePage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { visible: menuVisible } = useScrollDirection();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const whatsappNumber = "5565993025105"; // Substitua pelo número real do WhatsApp
  
  const supportCategories = [
    {
      id: "tokens",
      title: "Tokens e Pagamentos",
      description: "Dúvidas sobre tokens, planos e pagamentos",
      icon: Zap,
      color: "from-green-600/20 to-emerald-600/20 border-green-500/30",
      iconColor: "text-green-400",
      message: "Olá! Preciso de ajuda com tokens e pagamentos no Oráculo Jurídico."
    },
    {
      id: "tecnico",
      title: "Suporte Técnico",
      description: "Problemas técnicos, bugs ou dificuldades de uso",
      icon: AlertCircle,
      color: "from-red-600/20 to-orange-600/20 border-red-500/30",
      iconColor: "text-red-400",
      message: "Olá! Estou enfrentando um problema técnico no Oráculo Jurídico e preciso de ajuda."
    },
    {
      id: "conta",
      title: "Minha Conta",
      description: "Alterações de dados, senha ou configurações",
      icon: Users,
      color: "from-blue-600/20 to-indigo-600/20 border-blue-500/30",
      iconColor: "text-blue-400",
      message: "Olá! Preciso de ajuda com minha conta no Oráculo Jurídico."
    },
    {
      id: "geral",
      title: "Dúvidas Gerais",
      description: "Outras dúvidas sobre o sistema ou funcionalidades",
      icon: HelpCircle,
      color: "from-purple-600/20 to-violet-600/20 border-purple-500/30",
      iconColor: "text-purple-400",
      message: "Olá! Tenho algumas dúvidas sobre o Oráculo Jurídico."
    }
  ];

  const faqItems = [
    {
      question: "Como funcionam os tokens?",
      answer: "Cada consulta consome tokens baseado no tamanho da pergunta e resposta. Você pode adquirir tokens através de pacotes ou assinatura mensal.",
      category: "tokens"
    },
    {
      question: "Como posso comprar mais tokens?",
      answer: "Acesse 'Comprar Créditos' no menu principal e escolha entre pacotes de tokens ou o plano Essencial com 30.000 tokens mensais.",
      category: "tokens"
    },
    {
      question: "Como posso alterar minha senha?",
      answer: "Acesse 'Minha Conta' no menu do usuário e use a seção 'Alterar Senha' para definir uma nova senha.",
      category: "conta"
    },
    {
      question: "A IA é confiável?",
      answer: "Nossa IA integra-se com a LexML, base oficial de jurisprudência do governo brasileiro. IMPORTANTE: As informações sempre precisam ser revisadas e adaptadas pelo advogado responsável, pois a base pode não estar 100% atualizada e cada caso é único.",
      category: "geral"
    },
    {
      question: "Como reportar um bug?",
      answer: "Use o suporte técnico via WhatsApp ou email descrevendo detalhadamente o problema encontrado.",
      category: "tecnico"
    },
    {
      question: "Como funciona o plano Essencial?",
      answer: "O plano Essencial oferece 30.000 tokens mensais por R$ 37,90/mês, ideal para uso moderado a intenso da plataforma.",
      category: "tokens"
    },
    {
      question: "Posso cancelar minha assinatura?",
      answer: "Sim! Você pode cancelar sua assinatura a qualquer momento através da página 'Minha Conta' ou entrando em contato conosco.",
      category: "tokens"
    },
    {
      question: "Como usar a IA da Agenda Jurídica?",
      answer: "Acesse 'Agenda Jurídica' no menu principal. Digite sua consulta jurídica ou solicite análise de prazos e a IA fornecerá orientações especializadas baseadas na legislação brasileira atualizada.",
      category: "geral"
    },
    {
      question: "A plataforma funciona em mobile?",
      answer: "Sim! Nossa plataforma é totalmente responsiva e funciona perfeitamente em smartphones, tablets e computadores.",
      category: "tecnico"
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Absolutamente! Utilizamos criptografia de ponta, conformidade com LGPD e não compartilhamos seus dados com terceiros.",
      category: "geral"
    }
  ];

  const openWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(
      `${message}\n\n` +
      `📧 Email: ${user?.email || 'Não informado'}\n` +
      `👤 Nome: ${profile?.full_name || 'Não informado'}\n` +
      `🎯 Tokens: ${Math.floor(((profile?.token_balance || 0) + (profile?.plan_tokens || 0)))}\n` +
      `📋 Plano: ${profile?.plan_type || 'gratuito'}`
    );
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const totalTokens = (profile?.token_balance || 0) + (profile?.plan_tokens || 0);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-6 sm:h-8 w-auto"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="hidden sm:inline">Central de Suporte</span>
                  <span className="sm:hidden">Suporte</span>
                </h1>
                <p className="text-xs text-slate-300 hidden lg:block">
                  Estamos aqui para ajudar você
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Contador de tokens */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white">
                  {Math.floor(totalTokens).toLocaleString()}
                </span>
                <span className="text-xs text-slate-300">tokens</span>
              </div>
              
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
          
          {/* Card de informações sobre suporte */}
          <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/30">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-green-600/20 rounded-xl">
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">Suporte Especializado</h3>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Nossa equipe está pronta para resolver suas dúvidas
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="text-sm sm:text-lg font-bold text-green-400">WhatsApp</div>
                  <div className="text-xs text-slate-400">Resposta Rápida</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="text-sm sm:text-lg font-bold text-blue-400">24h</div>
                  <div className="text-xs text-slate-400">Tempo Resposta</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="text-sm sm:text-lg font-bold text-purple-400">FAQ</div>
                  <div className="text-xs text-slate-400">Respostas Imediatas</div>
                </div>
                <div className="text-center p-2 sm:p-3 bg-white/5 rounded-lg">
                  <div className="text-sm sm:text-lg font-bold text-orange-400">Email</div>
                  <div className="text-xs text-slate-400">Suporte Completo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid principal - Categorias e FAQ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Categorias de Suporte */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span className="text-base sm:text-lg">Escolha o Tipo de Suporte</span>
                  </CardTitle>
                  <CardDescription>
                    <span className="text-xs sm:text-sm">Selecione a categoria que melhor descreve sua dúvida</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {supportCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`p-3 sm:p-4 bg-gradient-to-br ${category.color} rounded-xl`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg">
                          <category.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${category.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-white">{category.title}</h3>
                          <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Contato Direto */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-base sm:text-lg">Contato Direto</span>
                  </CardTitle>
                  <CardDescription>
                    <span className="text-xs sm:text-sm">Outras formas de entrar em contato</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-600/10 rounded-lg border border-green-500/20">
                    <div className="p-2 bg-green-600/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">WhatsApp</p>
                      <p className="text-xs text-slate-300">Resposta mais rápida</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
                    <div className="p-2 bg-blue-600/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Email</p>
                      <p className="text-xs text-slate-300">contato@oraculojuridico.com.br</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <span className="text-base sm:text-lg">Perguntas Frequentes</span>
                </CardTitle>
                <CardDescription>
                  <span className="text-xs sm:text-sm">Respostas para as dúvidas mais comuns</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="max-h-[450px] sm:max-h-[500px] overflow-y-auto space-y-3 sm:space-y-4">
                {faqItems.map((item, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-primary/20 rounded-full flex-shrink-0 mt-1">
                        <Info className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-2 text-xs sm:text-sm">
                          {item.question}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.answer}
                        </p>
                        <div className="mt-2">
                          <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                            {supportCategories.find(c => c.id === item.category)?.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="text-center pt-4 border-t border-slate-600">
                  <p className="text-xs sm:text-sm text-slate-400 mb-3">
                    Não encontrou sua resposta?
                  </p>
                  <p className="text-xs text-slate-500">
                    Use o botão "Falar com Suporte" abaixo para entrar em contato
                  </p>
                </div>
                </div>
                
                {/* Botão de suporte fixo fora da área de scroll */}
                <div className="pt-6 border-t border-slate-600">
                  <Button
                    onClick={() => openWhatsApp("Olá! Preciso de ajuda com o Oráculo Jurídico.")}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 text-sm sm:text-base font-semibold"
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Falar com Suporte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Informações de Atendimento */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-200 mb-2 text-sm sm:text-base">Horário de Atendimento</h4>
                  <div className="space-y-1 text-xs sm:text-sm text-blue-300/80">
                    <p>• <strong>WhatsApp:</strong> Segunda a Sexta, 9h às 18h</p>
                    <p>• <strong>Email:</strong> 24/7 (resposta em até 24h úteis)</p>
                    <p>• <strong>FAQ:</strong> Disponível 24/7 para consulta imediata</p>
                    <p>• <strong>Emergências:</strong> Use o WhatsApp para casos urgentes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações de Segurança */}
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 mb-2 text-sm sm:text-base">Segurança e Privacidade</h4>
                  <div className="space-y-1 text-xs sm:text-sm text-amber-300/80">
                    <p>• Suas informações pessoais são tratadas com total confidencialidade</p>
                    <p>• Não compartilhamos dados com terceiros</p>
                    <p>• Comunicação criptografada em todos os canais</p>
                    <p>• Conformidade com LGPD e melhores práticas de segurança</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SuportePage;