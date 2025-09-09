import { useSEO } from "@/hooks/useSEO";
import { Brain, Users, Award, Target, Heart, TrendingUp } from "lucide-react";

const Sobre = () => {
  useSEO({
    title: "Sobre o Oráculo Jurídico - Inteligência Artificial para Advogados",
    description: "Conheça a história, missão e visão do Oráculo Jurídico. Descubra como nossa plataforma de IA está revolucionando a advocacia brasileira com tecnologia de ponta."
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-foreground">
      {/* Header */}
      <header className="py-6 px-4 border-b border-border bg-slate-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
            Sobre o Oráculo Jurídico
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Revolucionando a Advocacia com <span className="text-primary">Inteligência Artificial</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            O Oráculo Jurídico nasceu da necessidade de democratizar o acesso à informação jurídica de qualidade, 
            utilizando tecnologia de ponta para tornar a pesquisa legal mais eficiente e acessível.
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16 px-4 bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-6 text-foreground">Nossa História</h3>
              <p className="text-muted-foreground mb-4">
                Fundado em 2024, o Oráculo Jurídico surge da experiência prática de advogados que enfrentavam 
                diariamente os desafios da pesquisa jurídica tradicional: tempo excessivo gasto em consultas, 
                informações desatualizadas e custos elevados de plataformas complexas.
              </p>
              <p className="text-muted-foreground mb-4">
                Nossa equipe multidisciplinar combina expertise jurídica com conhecimento avançado em 
                inteligência artificial, criando uma solução que realmente entende as necessidades do 
                profissional do direito brasileiro.
              </p>
              <p className="text-muted-foreground">
                Hoje, somos a primeira plataforma de IA jurídica verdadeiramente especializada no 
                direito brasileiro, oferecendo respostas fundamentadas e confiáveis em segundos.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 card-signup">
                <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">IA Especializada</h4>
                <p className="text-sm text-muted-foreground">Treinada exclusivamente para o direito brasileiro</p>
              </div>
              <div className="text-center p-6 card-signup">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Equipe Expert</h4>
                <p className="text-sm text-muted-foreground">Advogados e tecnólogos trabalhando juntos</p>
              </div>
              <div className="text-center p-6 card-signup">
                <Award className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Qualidade Garantida</h4>
                <p className="text-sm text-muted-foreground">Respostas fundamentadas e confiáveis</p>
              </div>
              <div className="text-center p-6 card-signup">
                <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4" />
                <h4 className="font-semibold text-foreground mb-2">Inovação Contínua</h4>
                <p className="text-sm text-muted-foreground">Sempre evoluindo com novas funcionalidades</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-6 text-foreground">Nossos Princípios</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 card-signup">
              <Target className="w-16 h-16 text-primary mx-auto mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-foreground">Missão</h4>
              <p className="text-muted-foreground">
                Democratizar o acesso à informação jurídica de qualidade através da inteligência artificial, 
                tornando a advocacia mais eficiente e precisa para todos os profissionais do direito.
              </p>
            </div>
            
            <div className="text-center p-8 card-signup">
              <Brain className="w-16 h-16 text-primary mx-auto mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-foreground">Visão</h4>
              <p className="text-muted-foreground">
                Ser a principal plataforma de inteligência artificial jurídica do Brasil, 
                transformando a forma como os advogados pesquisam, analisam e aplicam o direito.
              </p>
            </div>
            
            <div className="text-center p-8 card-signup">
              <Heart className="w-16 h-16 text-primary mx-auto mb-6" />
              <h4 className="text-2xl font-bold mb-4 text-foreground">Valores</h4>
              <p className="text-muted-foreground">
                Precisão, confiabilidade, inovação e compromisso com a excelência. 
                Acreditamos que a tecnologia deve servir para potencializar o conhecimento humano.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Diferenciais */}
      <section className="py-16 px-4 bg-muted/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-6 text-foreground">Por que Escolher o Oráculo Jurídico?</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 card-signup">
              <h4 className="text-xl font-semibold mb-4 text-foreground">Especialização Nacional</h4>
              <p className="text-muted-foreground">
                Nossa IA foi desenvolvida especificamente para o direito brasileiro, compreendendo as 
                nuances da legislação nacional e a estrutura do sistema jurídico brasileiro.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <h4 className="text-xl font-semibold mb-4 text-foreground">Base de Dados Oficial</h4>
              <p className="text-muted-foreground">
                Integração direta com a LexML, a base oficial de jurisprudência do governo brasileiro, 
                garantindo acesso às informações mais atualizadas e confiáveis.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <h4 className="text-xl font-semibold mb-4 text-foreground">Interface Intuitiva</h4>
              <p className="text-muted-foreground">
                Desenvolvida por advogados para advogados. Nossa interface é simples, direta e 
                focada na experiência do usuário jurídico.
              </p>
            </div>
            
            <div className="p-6 card-signup">
              <h4 className="text-xl font-semibold mb-4 text-foreground">Suporte Especializado</h4>
              <p className="text-muted-foreground">
                Nossa equipe de suporte entende tanto de tecnologia quanto de direito, 
                oferecendo atendimento qualificado e personalizado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6 text-foreground">
            Faça Parte da Revolução da Advocacia Digital
          </h3>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se aos milhares de advogados que já descobriram como a inteligência artificial 
            pode transformar sua prática profissional.
          </p>
          <a 
            href="/cadastro" 
            className="btn-primary text-lg px-8 py-4 inline-block"
          >
            Teste Grátis por 7 Dias
          </a>
        </div>
      </section>
    </div>
  );
};

export default Sobre;