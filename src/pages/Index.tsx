import { Link } from "react-router-dom";
import { Brain, Zap, Users, Shield, ArrowRight, BookOpen, ChevronDown, Sparkles, Clock, TrendingUp, MessageSquare, Calendar, Calculator, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import heroBrain from "../assets/hero-brain-legal.jpg";
import { useState, useEffect } from "react";

const Index = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  useSEO({
    title: "Oráculo Jurídico — IA Jurídica para Advogados e Estudantes",
    description: "Transforme sua prática jurídica com IA especializada em Direito brasileiro. Chat jurídico, calculadoras, agenda e blog - tudo em uma plataforma.",
  });

  const testimonials = [
    {
      text: "O Oráculo Jurídico revolucionou minha pesquisa jurídica. O que antes levava horas, agora resolvo em minutos.",
      author: "Dra. Maria Silva",
      role: "Advogada Civilista"
    },
    {
      text: "A precisão das respostas e a integração com a LexML fazem toda a diferença no meu dia a dia.",
      author: "Dr. João Santos",
      role: "Advogado Trabalhista"
    },
    {
      text: "Como estudante de Direito, encontrei no Oráculo uma ferramenta indispensável para meus estudos.",
      author: "Ana Costa",
      role: "Estudante de Direito"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" 
                alt="Oráculo Jurídico" 
                className="h-10 w-auto"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Oráculo Jurídico
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/blog" className="story-link text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link to="/contato" className="story-link text-muted-foreground hover:text-foreground transition-colors">
                Contato
              </Link>
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/cadastro">
                <Button size="sm" className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90">
                  Começar Grátis
                </Button>
              </Link>
            </nav>

            <div className="md:hidden">
              <Link to="/login">
                <Button size="sm">Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background">
          <img 
            src={heroBrain} 
            alt="IA jurídica" 
            className="w-full h-full object-cover opacity-10" 
          />
        </div>
        
        <div className="relative container mx-auto text-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              IA Jurídica Especializada
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Transforme Sua
              <span className="block bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Prática Jurídica
              </span>
              com Inteligência Artificial
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Acesse uma IA especializada em Direito brasileiro, calculadoras jurídicas, agenda inteligente e um blog com conteúdo atualizado. Tudo em uma plataforma.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/cadastro">
                <Button size="lg" className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-lg px-8 py-4 hover-scale">
                  Começar Gratuitamente
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 hover-scale">
                  <BookOpen className="mr-2 w-5 h-5" />
                  Explorar Blog
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Brain className="w-10 h-10 text-primary" />
          </div>
        </div>
        <div className="absolute top-1/3 right-10 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Tudo Que Você Precisa Em <span className="text-primary">Um Só Lugar</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Ferramentas poderosas desenvolvidas especificamente para advogados e estudantes de Direito
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover-scale animate-fade-in border-2 hover:border-primary/50 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <MessageSquare className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Chat Jurídico IA</h3>
                <p className="text-muted-foreground">
                  IA especializada em Direito brasileiro com acesso à LexML
                </p>
              </CardContent>
            </Card>

            <Card className="group hover-scale animate-fade-in border-2 hover:border-primary/50 transition-all duration-300" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Calculator className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Calculadoras</h3>
                <p className="text-muted-foreground">
                  Cálculos precisos para contratos bancários e pensão alimentícia
                </p>
              </CardContent>
            </Card>

            <Card className="group hover-scale animate-fade-in border-2 hover:border-primary/50 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
                  <Calendar className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Agenda Jurídica</h3>
                <p className="text-muted-foreground">
                  Organize prazos e receba lembretes automáticos
                </p>
              </CardContent>
            </Card>

            <Card className="group hover-scale animate-fade-in border-2 hover:border-primary/50 transition-all duration-300" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/20 transition-colors">
                  <BookOpen className="w-8 h-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Blog Jurídico</h3>
                <p className="text-muted-foreground">
                  Artigos atualizados sobre legislação e jurisprudência
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in">
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">99%</div>
              <p className="text-muted-foreground">Precisão nas Respostas</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">24/7</div>
              <p className="text-muted-foreground">Disponibilidade</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl md:text-5xl font-bold text-primary mb-2">&lt; 3s</div>
              <p className="text-muted-foreground">Tempo de Resposta</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 animate-fade-in">
            O Que Nossos Usuários Dizem
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20 animate-fade-in">
              <CardContent className="p-8">
                <div className="mb-6">
                  <blockquote className="text-xl md:text-2xl italic text-muted-foreground leading-relaxed">
                    "{testimonials[currentTestimonial].text}"
                  </blockquote>
                </div>
                <div>
                  <p className="font-semibold text-lg">{testimonials[currentTestimonial].author}</p>
                  <p className="text-muted-foreground">{testimonials[currentTestimonial].role}</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-primary' : 'bg-muted'
                  }`}
                  onClick={() => setCurrentTestimonial(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto Para Revolucionar Sua Advocacia?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Junte-se a milhares de advogados que já transformaram sua prática jurídica com nossa plataforma.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cadastro">
                <Button size="lg" className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-lg px-8 py-4 hover-scale">
                  Começar Agora - 7 Dias Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/blog">
                <Button variant="outline" size="lg" className="text-lg px-8 py-4 hover-scale">
                  Ler Mais no Blog
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Sem compromisso • Cancele quando quiser
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" 
                  alt="Oráculo Jurídico" 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold">Oráculo Jurídico</span>
              </div>
              <p className="text-muted-foreground">
                Transformando a prática jurídica com inteligência artificial.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produto</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/cadastro" className="hover:text-foreground transition-colors">Chat IA</Link></li>
                <li><Link to="/cadastro" className="hover:text-foreground transition-colors">Calculadoras</Link></li>
                <li><Link to="/cadastro" className="hover:text-foreground transition-colors">Agenda</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/contato" className="hover:text-foreground transition-colors">Contato</Link></li>
                <li><Link to="/termos" className="hover:text-foreground transition-colors">Termos</Link></li>
                <li><Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/suporte" className="hover:text-foreground transition-colors">Central de Ajuda</Link></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
                <li><Link to="/cadastro" className="hover:text-foreground transition-colors">Criar Conta</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Oráculo Jurídico. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
