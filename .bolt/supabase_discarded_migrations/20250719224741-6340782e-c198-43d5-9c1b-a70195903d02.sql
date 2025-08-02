-- Criar tabela para documentos jurídicos pré-feitos
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'contrato', 'peticao', 'procuracao', etc.
  content TEXT NOT NULL, -- Conteúdo do documento em HTML ou markdown
  template_variables JSONB, -- Variáveis que podem ser substituídas no template
  is_active BOOLEAN NOT NULL DEFAULT true,
  min_credits_required INTEGER NOT NULL DEFAULT 3,
  file_url TEXT, -- URL do arquivo PDF se disponível
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_legal_documents_category ON public.legal_documents(category);
CREATE INDEX idx_legal_documents_active ON public.legal_documents(is_active);

-- Habilitar RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Política para visualização (todos os usuários autenticados podem ver documentos ativos)
CREATE POLICY "Authenticated users can view active documents" 
ON public.legal_documents 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_legal_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_legal_documents_updated_at();

-- Inserir documentos iniciais
INSERT INTO public.legal_documents (title, description, category, content, min_credits_required) VALUES
(
  'Contrato de Prestação de Serviços',
  'Modelo completo para formalizar prestação de serviços',
  'contrato',
  '<div class="document-header">
    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
  </div>
  
  <p><strong>CONTRATANTE:</strong> {{contratante_nome}}, {{contratante_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{contratante_documento}}, residente e domiciliado à {{contratante_endereco}}.</p>
  
  <p><strong>CONTRATADO:</strong> {{contratado_nome}}, {{contratado_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{contratado_documento}}, residente e domiciliado à {{contratado_endereco}}.</p>
  
  <h2>CLÁUSULA 1ª - DO OBJETO</h2>
  <p>O presente contrato tem por objeto {{objeto_servico}}.</p>
  
  <h2>CLÁUSULA 2ª - DAS OBRIGAÇÕES DO CONTRATADO</h2>
  <p>O CONTRATADO se obriga a:</p>
  <ul>
    <li>Executar os serviços com qualidade e dentro dos prazos estabelecidos;</li>
    <li>Manter sigilo sobre informações confidenciais;</li>
    <li>{{obrigacoes_contratado}}</li>
  </ul>
  
  <h2>CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE</h2>
  <p>O CONTRATANTE se obriga a:</p>
  <ul>
    <li>Efetuar o pagamento conforme acordado;</li>
    <li>Fornecer informações necessárias para execução dos serviços;</li>
    <li>{{obrigacoes_contratante}}</li>
  </ul>
  
  <h2>CLÁUSULA 4ª - DO VALOR E FORMA DE PAGAMENTO</h2>
  <p>Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de R$ {{valor_total}} ({{valor_extenso}}), da seguinte forma: {{forma_pagamento}}.</p>
  
  <h2>CLÁUSULA 5ª - DA VIGÊNCIA</h2>
  <p>O presente contrato vigorará por {{prazo_vigencia}}, contados a partir de {{data_inicio}}.</p>
  
  <h2>CLÁUSULA 6ª - DA RESCISÃO</h2>
  <p>O presente contrato poderá ser rescindido por qualquer das partes, mediante comunicação prévia de {{prazo_rescisao}} dias.</p>
  
  <h2>CLÁUSULA 7ª - DO FORO</h2>
  <p>Fica eleito o foro da comarca de {{comarca}}, para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.</p>
  
  <p>E por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor.</p>
  
  <div class="signature-section">
    <p>{{cidade}}, {{data_assinatura}}</p>
    
    <div class="signatures">
      <div class="signature">
        <p>_________________________________</p>
        <p>{{contratante_nome}}<br>CONTRATANTE</p>
      </div>
      
      <div class="signature">
        <p>_________________________________</p>
        <p>{{contratado_nome}}<br>CONTRATADO</p>
      </div>
    </div>
  </div>',
  3
),
(
  'Petição Inicial Cível',
  'Template para ações cíveis em geral',
  'peticao',
  '<div class="document-header">
    <h1>PETIÇÃO INICIAL</h1>
  </div>
  
  <p>Exmo. Sr. Dr. Juiz de Direito da {{vara}} da Comarca de {{comarca}}</p>
  
  <p><strong>{{requerente_nome}}</strong>, {{requerente_qualificacao}}, inscrito no CPF sob o nº {{requerente_cpf}}, residente e domiciliado à {{requerente_endereco}}, por intermédio de seu advogado que esta subscreve (OAB/{{uf}} {{oab_numero}}), vem respeitosamente perante V. Exa., com fundamento {{fundamento_legal}}, propor a presente</p>
  
  <h1 style="text-align: center">{{tipo_acao}}</h1>
  
  <p>em face de <strong>{{requerido_nome}}</strong>, {{requerido_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{requerido_documento}}, com endereço à {{requerido_endereco}}, pelos fatos e fundamentos jurídicos a seguir expostos:</p>
  
  <h2>I - DOS FATOS</h2>
  <p>{{fatos_principais}}</p>
  
  <h2>II - DO DIREITO</h2>
  <p>{{fundamentos_juridicos}}</p>
  
  <h2>III - DOS PEDIDOS</h2>
  <p>Ante o exposto, requer-se a V. Exa.:</p>
  <ol>
    <li>{{pedido_principal}}</li>
    <li>{{pedidos_subsidiarios}}</li>
    <li>A condenação da parte requerida ao pagamento das custas processuais e honorários advocatícios;</li>
    <li>Deferimento de todos os demais pedidos que se fizerem necessários ao deslinde da questão.</li>
  </ol>
  
  <p>Dá-se à causa o valor de R$ {{valor_causa}} ({{valor_causa_extenso}}).</p>
  
  <p>Termos em que pede e aguarda deferimento.</p>
  
  <p>{{cidade}}, {{data}}.</p>
  
  <div class="signature">
    <p>_________________________________</p>
    <p>{{advogado_nome}}<br>OAB/{{uf}} {{oab_numero}}</p>
  </div>',
  3
),
(
  'Procuração Judicial',
  'Modelo de procuração para representação judicial',
  'procuracao',
  '<div class="document-header">
    <h1>PROCURAÇÃO</h1>
  </div>
  
  <p><strong>OUTORGANTE:</strong> {{outorgante_nome}}, {{outorgante_estado_civil}}, {{outorgante_profissao}}, inscrito no CPF sob o nº {{outorgante_cpf}}, portador da Cédula de Identidade RG nº {{outorgante_rg}}, residente e domiciliado à {{outorgante_endereco}}.</p>
  
  <p><strong>OUTORGADO:</strong> {{outorgado_nome}}, advogado, inscrito na OAB/{{uf}} sob o nº {{oab_numero}}, com escritório à {{outorgado_endereco}}.</p>
  
  <h2>PODERES</h2>
  
  <p>Pelo presente instrumento particular de procuração, o OUTORGANTE nomeia e constitui seu bastante procurador o OUTORGADO, conferindo-lhe os seguintes poderes:</p>
  
  <h3>PODERES GERAIS:</h3>
  <ul>
    <li>Receber citação inicial e intimações</li>
    <li>Contestar, reconvir e oferecer exceções</li>
    <li>Produzir provas e contraditar as da parte contrária</li>
    <li>Requerer perícias e formular quesitos</li>
    <li>Assistir à colheita de provas</li>
    <li>Apresentar razões finais</li>
    <li>Recorrer e renunciar ao direito de recorrer</li>
    <li>Receber</li>
    <li>Dar quitação</li>
    <li>Firmar compromissos</li>
    <li>Assinar petições e documentos</li>
  </ul>
  
  <h3>PODERES ESPECIAIS:</h3>
  <ul>
    <li>Transigir</li>
    <li>Desistir</li>
    <li>Confessar</li>
    <li>Reconhecer a procedência do pedido</li>
    <li>Receber valores e dar quitação</li>
    <li>Substabelecimento com ou sem reservas</li>
    <li>{{poderes_especiais_adicionais}}</li>
  </ul>
  
  <p>Esta procuração é válida por {{prazo_validade}} e poderá ser revogada a qualquer tempo mediante comunicação expressa.</p>
  
  <p>{{cidade}}, {{data}}.</p>
  
  <div class="signature-section">
    <div class="signature">
      <p>_________________________________</p>
      <p>{{outorgante_nome}}<br>OUTORGANTE</p>
    </div>
    
    <p><strong>RECONHECIMENTO DE FIRMA</strong></p>
    <p>Reconheço a firma de {{outorgante_nome}} em minha presença.</p>
    <p>{{cidade}}, {{data}}.</p>
    <p>_________________________________<br>Tabelião</p>
  </div>',
  3
);

-- Criar tabela para histórico de documentos visualizados/baixados pelos usuários
CREATE TABLE public.user_document_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_id UUID NOT NULL REFERENCES public.legal_documents(id),
  access_type TEXT NOT NULL, -- 'view' ou 'download'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de acesso
ALTER TABLE public.user_document_access ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seu próprio histórico
CREATE POLICY "Users can view their own document access" 
ON public.user_document_access 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para usuários registrarem acesso
CREATE POLICY "Users can record their own document access" 
ON public.user_document_access 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);