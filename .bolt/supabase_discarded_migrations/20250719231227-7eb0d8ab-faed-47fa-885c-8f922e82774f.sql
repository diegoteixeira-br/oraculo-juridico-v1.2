-- Inserir mais documentos jurídicos de exemplo
INSERT INTO public.legal_documents (title, description, category, content, template_variables, min_credits_required, is_active) VALUES 

('Contrato de Locação Residencial', 'Modelo de contrato para locação de imóveis residenciais', 'contrato', 
'<div class="document-header"><h1>CONTRATO DE LOCAÇÃO RESIDENCIAL</h1></div>

<p><strong>LOCADOR:</strong> {{locador_nome}}, {{locador_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{locador_documento}}, residente e domiciliado à {{locador_endereco}}.</p>

<p><strong>LOCATÁRIO:</strong> {{locatario_nome}}, {{locatario_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{locatario_documento}}, residente e domiciliado à {{locatario_endereco}}.</p>

<h3>CLÁUSULA 1ª - DO OBJETO</h3>
<p>O presente contrato tem por objeto a locação do imóvel situado à {{imovel_endereco}}, com área de {{imovel_area}} m².</p>

<h3>CLÁUSULA 2ª - DO VALOR E PAGAMENTO</h3>
<p>O valor do aluguel é de R$ {{valor_aluguel}} ({{valor_aluguel_extenso}}), vencível todo dia {{dia_vencimento}} de cada mês.</p>

<h3>CLÁUSULA 3ª - DA VIGÊNCIA</h3>
<p>O contrato vigorará por {{prazo_locacao}}, iniciando em {{data_inicio}}.</p>

<h3>CLÁUSULA 4ª - DAS OBRIGAÇÕES</h3>
<p>{{obrigacoes_especiais}}</p>

<div class="signature-section">
<p>{{cidade}}, {{data_assinatura}}</p>
<div class="signatures">
<div class="signature">_________________________________<br>{{locador_nome}}<br>LOCADOR</div>
<div class="signature">_________________________________<br>{{locatario_nome}}<br>LOCATÁRIO</div>
</div>
</div>', 
'{"locador_nome": "", "locador_qualificacao": "", "locador_documento": "", "locador_endereco": "", "locatario_nome": "", "locatario_qualificacao": "", "locatario_documento": "", "locatario_endereco": "", "imovel_endereco": "", "imovel_area": "", "valor_aluguel": "", "valor_aluguel_extenso": "", "dia_vencimento": "", "prazo_locacao": "", "data_inicio": "", "obrigacoes_especiais": "", "cidade": "", "data_assinatura": ""}', 3, true),

('Contrato de Compra e Venda', 'Modelo de contrato para compra e venda de bens', 'contrato',
'<div class="document-header"><h1>CONTRATO DE COMPRA E VENDA</h1></div>

<p><strong>VENDEDOR:</strong> {{vendedor_nome}}, {{vendedor_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{vendedor_documento}}, residente e domiciliado à {{vendedor_endereco}}.</p>

<p><strong>COMPRADOR:</strong> {{comprador_nome}}, {{comprador_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{comprador_documento}}, residente e domiciliado à {{comprador_endereco}}.</p>

<h3>CLÁUSULA 1ª - DO OBJETO</h3>
<p>O presente contrato tem por objeto {{objeto_venda}}.</p>

<h3>CLÁUSULA 2ª - DO PREÇO</h3>
<p>O preço total é de R$ {{valor_total}} ({{valor_total_extenso}}).</p>

<h3>CLÁUSULA 3ª - DO PAGAMENTO</h3>
<p>{{forma_pagamento}}</p>

<div class="signature-section">
<p>{{cidade}}, {{data_assinatura}}</p>
<div class="signatures">
<div class="signature">_________________________________<br>{{vendedor_nome}}<br>VENDEDOR</div>
<div class="signature">_________________________________<br>{{comprador_nome}}<br>COMPRADOR</div>
</div>
</div>',
'{"vendedor_nome": "", "vendedor_qualificacao": "", "vendedor_documento": "", "vendedor_endereco": "", "comprador_nome": "", "comprador_qualificacao": "", "comprador_documento": "", "comprador_endereco": "", "objeto_venda": "", "valor_total": "", "valor_total_extenso": "", "forma_pagamento": "", "cidade": "", "data_assinatura": ""}', 3, true),

('Petição de Divórcio Consensual', 'Modelo de petição para divórcio consensual', 'peticao',
'<div class="document-header"><h1>PETIÇÃO INICIAL - DIVÓRCIO CONSENSUAL</h1></div>

<p>Exmo. Sr. Dr. Juiz de Direito da {{vara_competente}} da Comarca de {{comarca}}.</p>

<p><strong>{{requerente1_nome}}</strong>, {{requerente1_qualificacao}}, inscrito no CPF sob o nº {{requerente1_cpf}}, e <strong>{{requerente2_nome}}</strong>, {{requerente2_qualificacao}}, inscrito no CPF sob o nº {{requerente2_cpf}}, vêm respeitosamente à presença de Vossa Excelência requerer o que segue:</p>

<h3>DOS FATOS:</h3>
<p>1. Os requerentes contraíram matrimônio em {{data_casamento}}, sob o regime de {{regime_bens}}.</p>
<p>2. {{filhos_informacao}}</p>
<p>3. {{motivo_divorcio}}</p>

<h3>DO DIREITO:</h3>
<p>{{fundamentacao_juridica}}</p>

<h3>DOS PEDIDOS:</h3>
<p>Ante o exposto, requerem:</p>
<p>a) A decretação do divórcio consensual;</p>
<p>b) {{outros_pedidos}}</p>

<p>Termos em que pede deferimento.</p>

<p>{{cidade}}, {{data_peticao}}</p>

<p>_________________________________<br>{{advogado_nome}}<br>OAB/{{oab_estado}} {{oab_numero}}</p>',
'{"vara_competente": "", "comarca": "", "requerente1_nome": "", "requerente1_qualificacao": "", "requerente1_cpf": "", "requerente2_nome": "", "requerente2_qualificacao": "", "requerente2_cpf": "", "data_casamento": "", "regime_bens": "", "filhos_informacao": "", "motivo_divorcio": "", "fundamentacao_juridica": "", "outros_pedidos": "", "cidade": "", "data_peticao": "", "advogado_nome": "", "oab_estado": "", "oab_numero": ""}', 3, true),

('Procuração Ad Judicia', 'Modelo de procuração para representação judicial', 'procuracao',
'<div class="document-header"><h1>PROCURAÇÃO AD JUDICIA</h1></div>

<p><strong>OUTORGANTE:</strong> {{outorgante_nome}}, {{outorgante_qualificacao}}, inscrito no CPF sob o nº {{outorgante_cpf}}, residente e domiciliado à {{outorgante_endereco}}.</p>

<p><strong>OUTORGADO:</strong> {{outorgado_nome}}, advogado inscrito na OAB/{{oab_estado}} sob o nº {{oab_numero}}, com escritório à {{escritorio_endereco}}.</p>

<h3>PODERES:</h3>
<p>Confere ao outorgado os mais amplos poderes para:</p>
<ul>
<li>{{poder1}}</li>
<li>{{poder2}}</li>
<li>{{poder3}}</li>
<li>{{outros_poderes}}</li>
</ul>

<p>{{cidade}}, {{data_procuracao}}</p>

<div class="signatures">
<div class="signature">_________________________________<br>{{outorgante_nome}}<br>OUTORGANTE</div>
</div>',
'{"outorgante_nome": "", "outorgante_qualificacao": "", "outorgante_cpf": "", "outorgante_endereco": "", "outorgado_nome": "", "oab_estado": "", "oab_numero": "", "escritorio_endereco": "", "poder1": "", "poder2": "", "poder3": "", "outros_poderes": "", "cidade": "", "data_procuracao": ""}', 3, true),

('Contrato de Trabalho', 'Modelo de contrato de trabalho CLT', 'contrato',
'<div class="document-header"><h1>CONTRATO DE TRABALHO</h1></div>

<p><strong>EMPREGADOR:</strong> {{empregador_nome}}, {{empregador_qualificacao}}, inscrito no CNPJ sob o nº {{empregador_cnpj}}.</p>

<p><strong>EMPREGADO:</strong> {{empregado_nome}}, {{empregado_qualificacao}}, inscrito no CPF sob o nº {{empregado_cpf}}.</p>

<h3>CLÁUSULA 1ª - DA FUNÇÃO</h3>
<p>O empregado exercerá a função de {{cargo}}, com as seguintes atribuições: {{atribuicoes}}</p>

<h3>CLÁUSULA 2ª - DO SALÁRIO</h3>
<p>O salário mensal será de R$ {{salario}} ({{salario_extenso}}).</p>

<h3>CLÁUSULA 3ª - DA JORNADA</h3>
<p>{{jornada_trabalho}}</p>

<div class="signature-section">
<p>{{cidade}}, {{data_contrato}}</p>
<div class="signatures">
<div class="signature">_________________________________<br>{{empregador_nome}}<br>EMPREGADOR</div>
<div class="signature">_________________________________<br>{{empregado_nome}}<br>EMPREGADO</div>
</div>
</div>',
'{"empregador_nome": "", "empregador_qualificacao": "", "empregador_cnpj": "", "empregado_nome": "", "empregado_qualificacao": "", "empregado_cpf": "", "cargo": "", "atribuicoes": "", "salario": "", "salario_extenso": "", "jornada_trabalho": "", "cidade": "", "data_contrato": ""}', 3, true),

('Recibo de Pagamento', 'Modelo de recibo para pagamentos diversos', 'documento',
'<div class="document-header"><h1>RECIBO DE PAGAMENTO</h1></div>

<p>Eu, {{recebedor_nome}}, CPF {{recebedor_cpf}}, declaro ter recebido de {{pagador_nome}}, CPF {{pagador_cpf}}, a quantia de R$ {{valor}} ({{valor_extenso}}).</p>

<p><strong>Referente a:</strong> {{referencia_pagamento}}</p>

<p>Para maior clareza, firmo o presente recibo.</p>

<p>{{cidade}}, {{data_recibo}}</p>

<p>_________________________________<br>{{recebedor_nome}}</p>',
'{"recebedor_nome": "", "recebedor_cpf": "", "pagador_nome": "", "pagador_cpf": "", "valor": "", "valor_extenso": "", "referencia_pagamento": "", "cidade": "", "data_recibo": ""}', 1, true),

('Declaração de Residência', 'Modelo de declaração de residência', 'documento',
'<div class="document-header"><h1>DECLARAÇÃO DE RESIDÊNCIA</h1></div>

<p>Eu, {{declarante_nome}}, CPF {{declarante_cpf}}, declaro sob as penas da lei que {{declarado_nome}}, CPF {{declarado_cpf}}, reside no endereço {{endereco_completo}}, desde {{data_inicio_residencia}}.</p>

<p>{{observacoes}}</p>

<p>Por ser verdade, firmo a presente declaração.</p>

<p>{{cidade}}, {{data_declaracao}}</p>

<p>_________________________________<br>{{declarante_nome}}</p>',
'{"declarante_nome": "", "declarante_cpf": "", "declarado_nome": "", "declarado_cpf": "", "endereco_completo": "", "data_inicio_residencia": "", "observacoes": "", "cidade": "", "data_declaracao": ""}', 1, true),

('Ata de Reunião', 'Modelo de ata para reuniões empresariais', 'documento',
'<div class="document-header"><h1>ATA DE REUNIÃO</h1></div>

<p><strong>Data:</strong> {{data_reuniao}}</p>
<p><strong>Horário:</strong> {{horario_reuniao}}</p>
<p><strong>Local:</strong> {{local_reuniao}}</p>

<h3>PARTICIPANTES:</h3>
<p>{{participantes}}</p>

<h3>PAUTA:</h3>
<p>{{pauta_reuniao}}</p>

<h3>DELIBERAÇÕES:</h3>
<p>{{deliberacoes}}</p>

<h3>ENCAMINHAMENTOS:</h3>
<p>{{encaminhamentos}}</p>

<p>{{cidade}}, {{data_ata}}</p>

<p>_________________________________<br>{{responsavel_ata}}<br>Responsável pela Ata</p>',
'{"data_reuniao": "", "horario_reuniao": "", "local_reuniao": "", "participantes": "", "pauta_reuniao": "", "deliberacoes": "", "encaminhamentos": "", "cidade": "", "data_ata": "", "responsavel_ata": ""}', 1, true);

-- Atualizar o documento de prestação de serviços com o template fornecido pelo usuário
UPDATE public.legal_documents 
SET content = '<div class="document-header"><h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1></div>

<p><strong>CONTRATANTE:</strong> {{contratante_nome}}, {{contratante_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{contratante_documento}}, residente e domiciliado à {{contratante_endereco}}.</p>

<p><strong>CONTRATADO:</strong> {{contratado_nome}}, {{contratado_qualificacao}}, inscrito no CPF/CNPJ sob o nº {{contratado_documento}}, residente e domiciliado à {{contratado_endereco}}.</p>

<h3>CLÁUSULA 1ª - DO OBJETO</h3>
<p>O presente contrato tem por objeto {{objeto_servico}}.</p>

<h3>CLÁUSULA 2ª - DAS OBRIGAÇÕES DO CONTRATADO</h3>
<p>O CONTRATADO se obriga a:</p>
<ul>
<li>Executar os serviços com qualidade e dentro dos prazos estabelecidos;</li>
<li>Manter sigilo sobre informações confidenciais;</li>
<li>{{obrigacoes_contratado}}</li>
</ul>

<h3>CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE</h3>
<p>O CONTRATANTE se obriga a:</p>
<ul>
<li>Efetuar o pagamento conforme acordado;</li>
<li>Fornecer informações necessárias para execução dos serviços;</li>
<li>{{obrigacoes_contratante}}</li>
</ul>

<h3>CLÁUSULA 4ª - DO VALOR E FORMA DE PAGAMENTO</h3>
<p>Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de R$ {{valor_total}} ({{valor_extenso}}), da seguinte forma: {{forma_pagamento}}.</p>

<h3>CLÁUSULA 5ª - DA VIGÊNCIA</h3>
<p>O presente contrato vigorará por {{prazo_vigencia}}, contados a partir de {{data_inicio}}.</p>

<h3>CLÁUSULA 6ª - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por qualquer das partes, mediante comunicação prévia de {{prazo_rescisao}} dias.</p>

<h3>CLÁUSULA 7ª - DO FORO</h3>
<p>Fica eleito o foro da comarca de {{comarca}}, para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato.</p>

<p>E por estarem assim justos e contratados, firmam o presente instrumento em duas vias de igual teor.</p>

<div class="signature-section">
<p>{{cidade}}, {{data_assinatura}}</p>
<div class="signatures">
<div class="signature">_________________________________<br>{{contratante_nome}}<br>CONTRATANTE</div>
<div class="signature">_________________________________<br>{{contratado_nome}}<br>CONTRATADO</div>
</div>
</div>',
template_variables = '{"contratante_nome": "", "contratante_qualificacao": "", "contratante_documento": "", "contratante_endereco": "", "contratado_nome": "", "contratado_qualificacao": "", "contratado_documento": "", "contratado_endereco": "", "objeto_servico": "", "obrigacoes_contratado": "", "obrigacoes_contratante": "", "valor_total": "", "valor_extenso": "", "forma_pagamento": "", "prazo_vigencia": "", "data_inicio": "", "prazo_rescisao": "", "comarca": "", "cidade": "", "data_assinatura": ""}'
WHERE title = 'Contrato de Prestação de Serviços';