-- Create blog_posts table for the legal blog
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  author_name TEXT DEFAULT 'Oráculo Jurídico',
  is_published BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  reading_time_minutes INTEGER,
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'geral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for blog posts
CREATE POLICY "Everyone can read published posts" 
ON public.blog_posts 
FOR SELECT 
USING (is_published = true);

CREATE POLICY "Admins can manage all posts" 
ON public.blog_posts 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create index for better performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);
CREATE INDEX idx_blog_posts_featured ON public.blog_posts(featured, published_at DESC);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_blog_posts_updated_at();

-- Insert some sample blog posts
INSERT INTO public.blog_posts (
  title, 
  slug, 
  summary, 
  content, 
  cover_image_url,
  is_published,
  featured,
  reading_time_minutes,
  meta_title,
  meta_description,
  tags,
  category,
  published_at
) VALUES 
(
  'Marco Civil da Internet: Guia Completo para Advogados',
  'marco-civil-internet-guia-advogados',
  'Entenda os principais aspectos do Marco Civil da Internet e como ele impacta a prática jurídica no ambiente digital.',
  '# Marco Civil da Internet: Guia Completo para Advogados

O Marco Civil da Internet (Lei 12.965/2014) representa um divisor de águas na regulamentação do ambiente digital brasileiro. Para advogados que atuam ou pretendem atuar no direito digital, compreender esta legislação é fundamental.

## O que é o Marco Civil da Internet?

O Marco Civil da Internet é considerado a "constituição da internet brasileira". Esta lei estabelece princípios, garantias, direitos e deveres para o uso da internet no Brasil, criando um framework legal para a governança da rede.

## Principais Direitos dos Usuários

### 1. Privacidade e Proteção de Dados
- Inviolabilidade da intimidade e da vida privada
- Proteção dos dados pessoais
- Direito ao anonimato (ressalvadas as hipóteses legais)

### 2. Liberdade de Expressão
- Liberdade de expressão, comunicação e manifestação do pensamento
- Proteção contra censura prévia

### 3. Neutralidade da Rede
- Tratamento isonômico de qualquer pacote de dados
- Vedação ao bloqueio, monitoramento, filtragem ou análise do conteúdo

## Responsabilidade dos Provedores

### Provedores de Conexão
- Não são responsáveis pelos danos decorrentes de conteúdo gerado por terceiros
- Obrigação de guardar registros de conexão por 1 ano

### Provedores de Aplicação
- Responsabilidade subsidiária por conteúdo de terceiros
- Sistema de "notice and takedown" para remoção de conteúdo

## Aspectos Processuais Importantes

### Quebra de Sigilo
- Necessidade de ordem judicial
- Dados de conexão vs. dados de aplicação
- Prazos e procedimentos específicos

### Jurisdição
- Competência da Justiça brasileira para dados armazenados no país
- Questões de aplicação extraterritorial

## Dicas Práticas para Advogados

1. **Estude a regulamentação complementar**: Decreto 8.771/2016
2. **Mantenha-se atualizado**: Jurisprudência em constante evolução
3. **Especialize-se**: Área em crescimento exponencial
4. **Networking**: Participe de eventos de direito digital

## Conclusão

O Marco Civil da Internet criou um novo paradigma jurídico no Brasil. Para advogados, representa tanto desafios quanto oportunidades significativas de especialização e crescimento profissional.

*Este artigo foi elaborado pela equipe jurídica do Oráculo Jurídico. Para consultas mais específicas, recomendamos buscar orientação profissional especializada.*',
  '/lovable-uploads/c69e5a84-404e-4cbe-9d84-d19d95158721.png',
  true,
  true,
  8,
  'Marco Civil da Internet: Guia Completo para Advogados | Oráculo Jurídico',
  'Entenda os principais aspectos do Marco Civil da Internet e como ele impacta a prática jurídica. Guia completo para advogados no direito digital.',
  ARRAY['direito digital', 'marco civil', 'internet', 'lgpd', 'tecnologia'],
  'direito-digital',
  now()
),
(
  'Inteligência Artificial no Direito: Oportunidades e Desafios',
  'inteligencia-artificial-direito-oportunidades-desafios',
  'Explore como a IA está transformando a advocacia e quais são as principais oportunidades e desafios para profissionais do direito.',
  '# Inteligência Artificial no Direito: Oportunidades e Desafios

A Inteligência Artificial (IA) está revolucionando diversos setores da economia, e o Direito não é exceção. Para advogados e escritórios jurídicos, essa tecnologia representa tanto oportunidades extraordinárias quanto desafios significativos.

## O Estado Atual da IA no Direito

### Ferramentas Disponíveis
- **Análise de Contratos**: Revisão automatizada de cláusulas
- **Pesquisa Jurisprudencial**: Busca inteligente em bases de dados
- **Predição de Resultados**: Análise de probabilidades processuais
- **Chatbots Jurídicos**: Atendimento inicial automatizado

### Cases de Sucesso
Diversos escritórios já implementaram soluções de IA com resultados impressionantes:
- Redução de 70% no tempo de análise documental
- Melhoria na precisão de pesquisas jurídicas
- Automatização de tarefas repetitivas

## Oportunidades para Advogados

### 1. Aumento da Eficiência
A IA permite que advogados se concentrem em atividades de maior valor agregado, delegando tarefas repetitivas para sistemas automatizados.

### 2. Melhoria na Qualidade dos Serviços
- Análises mais precisas e abrangentes
- Redução de erros humanos
- Acesso a insights baseados em dados

### 3. Democratização do Acesso à Justiça
Ferramentas de IA podem tornar serviços jurídicos mais acessíveis, especialmente para pequenas empresas e pessoas físicas.

### 4. Novas Áreas de Especialização
- Direito Digital e Tecnologia
- Compliance em IA
- Proteção de Dados e Privacidade

## Principais Desafios

### 1. Questões Éticas
- Transparência nos algoritmos
- Viés algorítmico
- Responsabilidade por decisões automatizadas

### 2. Aspectos Regulatórios
- Necessidade de regulamentação específica
- Adaptação das normas existentes
- Questões de responsabilidade civil

### 3. Impacto no Mercado de Trabalho
- Automação de funções tradicionais
- Necessidade de requalificação profissional
- Mudança no perfil das vagas jurídicas

## Como se Preparar para o Futuro

### Para Advogados
1. **Educação Continuada**: Cursos em tecnologia jurídica
2. **Experimentação**: Teste ferramentas disponíveis
3. **Networking**: Conecte-se com profissionais da área tech
4. **Mindset**: Desenvolva mentalidade inovadora

### Para Escritórios
1. **Planejamento Estratégico**: Inclua IA na estratégia
2. **Investimento Gradual**: Implemente soluções progressivamente
3. **Capacitação da Equipe**: Treine colaboradores
4. **Parcerias**: Colabore com empresas de tecnologia

## O Papel da Regulamentação

A regulamentação da IA no Direito deve equilibrar:
- Inovação tecnológica
- Proteção dos direitos fundamentais
- Segurança jurídica
- Acesso à justiça

## Tendências para o Futuro

### Próximos 5 Anos
- Maior integração de IA em softwares jurídicos
- Desenvolvimento de soluções específicas por área do direito
- Amadurecimento da regulamentação

### Longo Prazo
- Tribunais virtuais com IA
- Decisões automatizadas em casos simples
- Transformação completa da prática jurídica

## Conclusão

A IA no Direito não é mais uma questão de "se", mas de "quando" e "como". Profissionais que se adaptarem e abraçarem essa transformação estarão melhor posicionados para prosperar no futuro da advocacia.

O importante é manter o equilíbrio entre eficiência tecnológica e os valores fundamentais da profissão jurídica: ética, responsabilidade e compromisso com a justiça.

*Artigo desenvolvido pelo Oráculo Jurídico, sua plataforma de IA jurídica especializada.*',
  '/lovable-uploads/8fc8748b-d056-4136-b669-07bbd1bc2327.png',
  true,
  false,
  10,
  'IA no Direito: Oportunidades e Desafios para Advogados | Oráculo Jurídico',
  'Descubra como a Inteligência Artificial está transformando a advocacia. Oportunidades, desafios e dicas para advogados no futuro digital.',
  ARRAY['inteligencia artificial', 'advocacia', 'tecnologia juridica', 'futuro do direito', 'inovacao'],
  'tecnologia',
  now()
),
(
  'LGPD na Prática: Checklist para Escritórios de Advocacia',
  'lgpd-pratica-checklist-escritorios-advocacia',
  'Guia prático de adequação à LGPD para escritórios de advocacia, com checklist completo e dicas de implementação.',
  '# LGPD na Prática: Checklist para Escritórios de Advocacia

A Lei Geral de Proteção de Dados (LGPD) impacta diretamente os escritórios de advocacia, que lidam constantemente com dados pessoais de clientes. Este guia oferece um checklist prático para adequação.

## Por que a LGPD é Crucial para Escritórios?

Escritórios de advocacia processam grandes volumes de dados pessoais:
- Informações de clientes
- Dados de processos judiciais
- Documentos confidenciais
- Correspondências eletrônicas

## Checklist de Adequação à LGPD

### 1. Mapeamento de Dados
- [ ] Inventário de todos os dados pessoais tratados
- [ ] Identificação das finalidades de cada tratamento
- [ ] Mapeamento do fluxo de dados
- [ ] Classificação dos tipos de dados (sensíveis ou não)

### 2. Base Legal
- [ ] Definição da base legal para cada tratamento
- [ ] Documentação das justificativas legais
- [ ] Revisão de contratos com clientes
- [ ] Atualização de termos de uso e políticas

### 3. Consentimento
- [ ] Implementação de mecanismos de coleta de consentimento
- [ ] Criação de formulários claros e específicos
- [ ] Sistema de gestão de consentimentos
- [ ] Possibilidade de revogação fácil

### 4. Direitos dos Titulares
- [ ] Procedimentos para atender solicitações de acesso
- [ ] Processo de retificação de dados
- [ ] Mecanismo de exclusão de dados
- [ ] Sistema de portabilidade
- [ ] Processo de oposição ao tratamento

### 5. Segurança da Informação
- [ ] Implementação de medidas técnicas de segurança
- [ ] Controles de acesso por perfil
- [ ] Criptografia de dados sensíveis
- [ ] Backup seguro e testado
- [ ] Política de senhas forte

### 6. Governança
- [ ] Nomeação de encarregado (DPO)
- [ ] Políticas internas de proteção de dados
- [ ] Treinamento da equipe
- [ ] Procedimentos de resposta a incidentes
- [ ] Relatório de impacto (quando necessário)

## Medidas Técnicas Essenciais

### Infraestrutura
1. **Firewall e Antivírus**: Proteção contra ameaças externas
2. **Criptografia**: Dados em trânsito e em repouso
3. **Backup**: Rotina automatizada e testada
4. **Controle de Acesso**: Autenticação multifator

### Softwares Jurídicos
- Escolha fornecedores adequados à LGPD
- Contratos de controlador-operador
- Auditoria de segurança periódica
- Políticas de retenção de dados

## Medidas Organizacionais

### Políticas Internas
1. **Política de Proteção de Dados**
2. **Política de Segurança da Informação**
3. **Política de Gestão de Incidentes**
4. **Política de Retenção e Descarte**

### Treinamento da Equipe
- Conscientização sobre LGPD
- Procedimentos internos
- Identificação de incidentes
- Atualização periódica

## Relacionamento com Clientes

### Transparência
- Informações claras sobre tratamento de dados
- Finalidades específicas e legítimas
- Direitos dos titulares explicados
- Canais de comunicação disponíveis

### Contratos
- Cláusulas específicas sobre proteção de dados
- Responsabilidades bem definidas
- Procedimentos em caso de incidentes
- Término do contrato e dados

## Gestão de Incidentes

### Plano de Resposta
1. **Identificação**: Detecção rápida de incidentes
2. **Contenção**: Medidas imediatas de contenção
3. **Avaliação**: Análise do impacto e riscos
4. **Notificação**: ANPD e titulares (quando necessário)
5. **Recuperação**: Restauração da normalidade

### Documentação
- Registro de todos os incidentes
- Medidas tomadas
- Lições aprendidas
- Melhorias implementadas

## Cronograma de Implementação

### Mês 1-2: Diagnóstico
- Mapeamento de dados
- Avaliação de gaps
- Definição de prioridades

### Mês 3-4: Estruturação
- Políticas e procedimentos
- Treinamento inicial
- Implementação técnica

### Mês 5-6: Operacionalização
- Testes dos processos
- Ajustes necessários
- Monitoramento contínuo

## Custos e ROI

### Investimentos Necessários
- Consultoria especializada
- Ferramentas de segurança
- Treinamento da equipe
- Adequação de processos

### Retorno do Investimento
- Redução de riscos de multas
- Melhoria da reputação
- Vantagem competitiva
- Eficiência operacional

## Dicas Finais

1. **Comece Agora**: Não deixe para depois
2. **Busque Ajuda**: Consulte especialistas
3. **Documente Tudo**: Evidências são cruciais
4. **Monitore Constantemente**: LGPD é processo contínuo
5. **Mantenha-se Atualizado**: Acompanhe mudanças na regulamentação

## Conclusão

A adequação à LGPD é fundamental para escritórios de advocacia. Além de ser uma obrigação legal, representa uma oportunidade de melhorar processos, aumentar a confiança dos clientes e se destacar no mercado.

O importante é começar com um diagnóstico honesto, estabelecer prioridades e implementar as mudanças de forma gradual e consistente.

*Guia elaborado pelo Oráculo Jurídico. Para assessoria especializada em adequação à LGPD, consulte nossos parceiros especialistas.*',
  '/lovable-uploads/b02b19a1-02c8-487d-9d6a-7ae0ee4435f9.png',
  true,
  false,
  12,
  'LGPD para Escritórios: Checklist Prático de Adequação | Oráculo Jurídico',
  'Guia completo de adequação à LGPD para escritórios de advocacia. Checklist prático, dicas de implementação e conformidade legal.',
  ARRAY['lgpd', 'protecao de dados', 'escritorios advocacia', 'compliance', 'seguranca informacao'],
  'compliance',
  now()
);