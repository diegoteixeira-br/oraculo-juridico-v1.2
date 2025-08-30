
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para contar tokens aproximadamente (1 token ≈ 4 caracteres)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}


// Função para fazer upload de arquivo para OpenAI (ETAPA 3)
async function uploadFileToOpenAI(fileData: string, fileName: string, openAIKey: string): Promise<string> {
  try {
    console.log(`Uploading file to OpenAI: ${fileName}`);
    
    // Validar se fileData existe
    if (!fileData || typeof fileData !== 'string') {
      console.error(`Invalid file data for ${fileName}:`, typeof fileData);
      throw new Error(`Dados do arquivo ${fileName} não encontrados ou inválidos`);
    }
    
    // Converter base64 para blob
    let binaryData;
    if (fileData.includes(',')) {
      const base64Data = fileData.split(',')[1];
      binaryData = atob(base64Data);
    } else {
      binaryData = atob(fileData);
    }
    
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    
    // Determinar o tipo MIME do arquivo
    let mimeType = 'application/octet-stream';
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'txt':
        mimeType = 'text/plain';
        break;
      case 'doc':
        mimeType = 'application/msword';
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }
    
    const formData = new FormData();
    formData.append('file', new Blob([bytes], { type: mimeType }), fileName);
    formData.append('purpose', 'assistants');

    console.log(`Making file upload request to OpenAI for ${fileName} (${mimeType})`);
    
    const fileUploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    console.log(`OpenAI file upload response status: ${fileUploadResponse.status} for ${fileName}`);

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      console.error(`OpenAI file upload failed for ${fileName}:`, {
        status: fileUploadResponse.status,
        statusText: fileUploadResponse.statusText,
        error: errorText,
        headers: Object.fromEntries(fileUploadResponse.headers.entries())
      });
      
      // Tratamento específico para diferentes tipos de erro
      if (fileUploadResponse.status === 401) {
        throw new Error(`Erro de autenticação OpenAI: Verifique a chave API`);
      } else if (fileUploadResponse.status === 413) {
        throw new Error(`Arquivo ${fileName} muito grande. Limite máximo excedido.`);
      } else if (fileUploadResponse.status === 429) {
        throw new Error(`Limite de rate da OpenAI excedido. Tente novamente em alguns minutos.`);
      } else if (fileUploadResponse.status >= 500) {
        throw new Error(`Erro interno da OpenAI (${fileUploadResponse.status}). Tente novamente.`);
      } else {
        throw new Error(`Falha ao fazer upload do arquivo ${fileName}: ${errorText}`);
      }
    }

    const uploadedFile = await fileUploadResponse.json();
    console.log(`File uploaded successfully: ${fileName}, ID: ${uploadedFile.id}`);
    
    return uploadedFile.id; // Retorna o file_id para usar no Assistant
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, {
      error: error.message,
      stack: error.stack,
      fileName
    });
    throw error;
  }
}

// Função para extrair texto de imagem usando Vision API da OpenAI
async function extractTextFromImage(fileData: string, fileName: string, openAIKey: string): Promise<string> {
  try {
    console.log(`Extracting text from image: ${fileName}`);
    
    // Validar se fileData existe
    if (!fileData || typeof fileData !== 'string') {
      throw new Error('Dados da imagem não encontrados ou inválidos');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia todo o texto visível nesta imagem. Retorne apenas o texto extraído sem comentários ou formatação adicional. Se a imagem não contiver texto legível, retorne "ERRO_TEXTO_NAO_ENCONTRADO".'
              },
              {
                type: 'image_url',
                image_url: {
                  url: fileData.includes(',') ? fileData : `data:image/jpeg;base64,${fileData}`
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to extract text from image: ${await response.text()}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content.trim();
    
    if (extractedText === "ERRO_TEXTO_NAO_ENCONTRADO") {
      throw new Error('Não foi possível extrair texto da imagem');
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Nova consulta ao chat jurídico iniciada');
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, userId, sessionId, attachedFiles } = await req.json();
    
    console.log('Processing legal query:', { message, userId, attachedFilesCount: attachedFiles?.length || 0 });

    // Verificar se o usuário tem tokens suficientes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tokens, token_balance, plan_tokens, plan_type, subscription_status, trial_end_date')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar acesso: usuários gratuitos têm acesso ao chat com token_balance ou plan_tokens
    const isTrialActive = profile.subscription_status === 'trial' && 
                         profile.trial_end_date && 
                         new Date() < new Date(profile.trial_end_date);
    
    const isSubscriber = profile.subscription_status === 'active';
    const hasPlanTokens = (profile.plan_tokens || 0) > 0;
    const hasTrialTokens = (profile.token_balance || 0) > 0;
    
    // Chat disponível para: assinantes ativos, trial ativo com tokens, ou usuários com plan_tokens
    const canUseChat = isSubscriber || (isTrialActive && hasTrialTokens) || hasPlanTokens;
    
    if (!canUseChat) {
      return new Response(JSON.stringify({ 
        error: 'Acesso negado',
        details: 'Você precisa de uma assinatura ativa ou tokens disponíveis para usar o chat.'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const totalAvailableTokens = (profile.token_balance || 0) + (profile.plan_tokens || 0);
      
    if (totalAvailableTokens < 1000) {
      return new Response(JSON.stringify({ 
        error: 'Tokens insuficientes',
        details: `Você precisa de pelo menos 1.000 tokens para usar o chat. Disponível: ${totalAvailableTokens} tokens.`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar se a chave da OpenAI está configurada
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'OpenAI API key não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ETAPA 3 - Upload de arquivos para OpenAI e obtenção dos file_ids
    let fileIds: string[] = [];
    
    if (attachedFiles && attachedFiles.length > 0) {
      console.log(`Processing ${attachedFiles.length} attached files...`);
      
      for (const file of attachedFiles) {
        try {
          // Verificar se o arquivo tem dados válidos
          if (!file || !file.data || !file.name || !file.type) {
            console.error('Invalid file data:', file);
            return new Response(JSON.stringify({ 
              error: 'Arquivo inválido ou corrompido. Por favor, tente novamente com outro arquivo.' 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          
          console.log(`Processing file: ${file.name} (${file.type})`);
          
          // Upload do arquivo para OpenAI e obter file_id
          const fileId = await uploadFileToOpenAI(file.data, file.name, openAIKey);
          fileIds.push(fileId);
          
          console.log(`File uploaded successfully: ${file.name}, ID: ${fileId}`);
          
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return new Response(JSON.stringify({ 
            error: `Erro ao processar arquivo ${file.name}: ${error.message}. Por favor, verifique se o arquivo está válido e tente novamente.` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      console.log(`All files uploaded successfully. File IDs: [${fileIds.join(', ')}]`);
    }

    // ETAPA 4 - Usar API de Assistants da OpenAI com file_ids
    let promptContent: string;
    let promptTokens: number;
    let aiMessage: string;
    
    
    if (fileIds.length > 0) {
      // Tentativa 1: Usar OpenAI Assistants API
      try {
        console.log('Using OpenAI Assistants API with file_ids:', fileIds);
        
        // Criar uma thread para a conversa
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({})
        });
        
        if (!threadResponse.ok) {
          throw new Error('Failed to create thread');
        }
        
        const thread = await threadResponse.json();
        console.log('Thread created:', thread.id);
        
        // Adicionar mensagem com file_ids na thread
        const messageContent = message || 'Segue um arquivo para análise.';
        console.log(`Adding message to thread ${thread.id} with ${fileIds.length} attachments`);
        
        const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            role: 'user',
            content: messageContent,
            attachments: fileIds.map(fileId => ({
              file_id: fileId,
              tools: [{ type: 'file_search' }]
            }))
          })
        });
        
        if (!messageResponse.ok) {
          throw new Error('Failed to add message');
        }
        
        console.log('Message added to thread with file_ids');
        
        // Executar o assistant
        const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID');
        
        if (!assistantId) {
          throw new Error('Assistant not configured');
        }
        
        console.log(`Starting assistant run with ID: ${assistantId}`);
        
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            assistant_id: assistantId,
            instructions: `Você é um assistente jurídico especializado em direito brasileiro. 

INSTRUÇÕES IMPORTANTES:
1. Analise cuidadosamente TODOS os arquivos anexados
2. Se for um PDF, extraia e analise todo o conteúdo textual
3. Se for uma imagem, leia todo o texto visível na imagem
4. Forneça uma análise jurídica completa baseada no conteúdo dos arquivos
5. Cite artigos de lei relevantes quando aplicável
6. Estruture sua resposta de forma organizada e didática
7. Se houver questões ou problemas identificados no documento, aponte-os claramente

Se você não conseguir acessar o conteúdo dos arquivos, explique especificamente o que está impedindo a leitura e sugira soluções.`
          })
        });
        
        if (!runResponse.ok) {
          throw new Error('Failed to start assistant run');
        }
        
        const run = await runResponse.json();
        console.log('Run started:', run.id);
        
        // Aguardar conclusão da execução
        let runStatus = run.status;
        let attempts = 0;
        const maxAttempts = 60;
        
        console.log(`Waiting for assistant execution to complete. Initial status: ${runStatus}`);
        
        while (runStatus === 'queued' || runStatus === 'in_progress') {
          if (attempts >= maxAttempts) {
            throw new Error(`Assistant execution timeout after ${maxAttempts} seconds`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
          
          const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
            headers: {
              'Authorization': `Bearer ${openAIKey}`,
              'OpenAI-Beta': 'assistants=v2'
            }
          });
          
          if (!statusResponse.ok) {
            if (attempts < 5) continue;
            throw new Error(`Failed to check run status: ${statusResponse.status}`);
          }
          
          const statusData = await statusResponse.json();
          runStatus = statusData.status;
          
          if (attempts % 10 === 0) {
            console.log(`Assistant execution status after ${attempts}s: ${runStatus}`);
          }
        }
        
        console.log(`Assistant execution completed with status: ${runStatus} after ${attempts} seconds`);
        
        if (runStatus !== 'completed') {
          throw new Error(`Assistant execution failed with status: ${runStatus}`);
        }
        
        // Obter mensagens da thread
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');
        
        if (!assistantMessage) {
          throw new Error('No assistant response found');
        }
        
        aiMessage = assistantMessage.content[0].text.value;
        promptContent = messageContent;
        promptTokens = estimateTokens(messageContent);
        
        console.log('Assistant response received:', aiMessage.substring(0, 100) + '...');
        
      } catch (assistantError) {
        console.log('Assistant API failed, trying Chat Completions with file analysis fallback:', assistantError.message);
        
        // FALLBACK: Usar Chat Completions com análise de arquivos
        const allExtractedContent: string[] = [];
        
        // Primeiro, extrair conteúdo de todos os arquivos anexados
        for (let i = 0; i < attachedFiles.length; i++) {
          const file = attachedFiles[i];
          try {
            if (file.type.startsWith('image/')) {
              // Para imagens, extrair texto usando Vision API
              console.log(`Extracting text from image: ${file.name}`);
              const extractedText = await extractTextFromImage(file.data, file.name, openAIKey);
              allExtractedContent.push(`\n\n=== CONTEÚDO EXTRAÍDO DO ARQUIVO "${file.name}" ===\n${extractedText}\n=== FIM DO CONTEÚDO ===\n`);
            } else if (file.type === 'application/pdf') {
              // Para PDFs, usar a função extract-text-from-pdf
              console.log(`Extracting text from PDF: ${file.name}`);
              try {
                // Converter base64 para FormData
                let binaryData;
                if (file.data.includes(',')) {
                  const base64Data = file.data.split(',')[1];
                  binaryData = atob(base64Data);
                } else {
                  binaryData = atob(file.data);
                }
                
                const bytes = new Uint8Array(binaryData.length);
                for (let i = 0; i < binaryData.length; i++) {
                  bytes[i] = binaryData.charCodeAt(i);
                }
                
                const formData = new FormData();
                formData.append('file', new Blob([bytes], { type: 'application/pdf' }), file.name);
                
                // Chamar a função extract-text-from-pdf
                const pdfResponse = await fetch(`${supabaseUrl}/functions/v1/extract-text-from-pdf`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                  body: formData,
                });
                
                if (pdfResponse.ok) {
                  const pdfData = await pdfResponse.json();
                  if (pdfData.success && pdfData.text) {
                    allExtractedContent.push(`\n\n=== CONTEÚDO EXTRAÍDO DO PDF "${file.name}" ===\n${pdfData.text}\n=== FIM DO CONTEÚDO ===\n`);
                  } else {
                    allExtractedContent.push(`\n\n=== ERRO AO PROCESSAR PDF "${file.name}" ===\nNão foi possível extrair o texto do PDF. Por favor, forneça informações adicionais sobre o documento.\n=== FIM ===\n`);
                  }
                } else {
                  throw new Error(`Erro HTTP ${pdfResponse.status}`);
                }
              } catch (pdfError) {
                console.error(`Error extracting PDF ${file.name}:`, pdfError);
                allExtractedContent.push(`\n\n=== ERRO AO PROCESSAR PDF "${file.name}" ===\nNão foi possível extrair o texto do PDF: ${pdfError.message}. Por favor, forneça informações adicionais sobre o documento.\n=== FIM ===\n`);
              }
            } else {
              // Para outros tipos de documento
              console.log(`Unsupported document type: ${file.name} (${file.type})`);
              allExtractedContent.push(`\n\n=== ARQUIVO ANEXADO: "${file.name}" ===\nArquivo do tipo ${file.type} foi anexado mas não pôde ser lido diretamente. Por favor, forneça mais detalhes sobre o conteúdo ou questões específicas sobre este documento.\n=== FIM ===\n`);
            }
          } catch (extractError) {
            console.error(`Error extracting content from ${file.name}:`, extractError);
            allExtractedContent.push(`\n\n=== ERRO AO PROCESSAR "${file.name}" ===\nNão foi possível extrair o conteúdo deste arquivo (${file.type}). Por favor, forneça informações adicionais sobre o documento ou reformule sua pergunta.\n=== FIM ===\n`);
          }
        }
        
        // Criar prompt combinado com conteúdo extraído
        const combinedPrompt = `${message || 'Analise o(s) arquivo(s) anexado(s) e forneça uma análise jurídica.'}\n\n${allExtractedContent.join('\n')}`;
        
        promptContent = combinedPrompt;
        promptTokens = estimateTokens(combinedPrompt);
        
        console.log('Making Chat Completions request with extracted file content');
        
        const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: `Você é um assistente jurídico especializado em direito brasileiro. 

Analise o conteúdo dos arquivos fornecidos e responda de forma clara, precisa e didática, seguindo estas diretrizes:

1. Se conseguir identificar o conteúdo dos arquivos, forneça uma análise jurídica completa
2. Cite artigos de lei relevantes quando aplicável
3. Identifique questões jurídicas importantes no documento
4. Aponte possíveis problemas ou cláusulas que merecem atenção
5. Estruture sua resposta de forma organizada
6. Se não conseguir ler algum arquivo, explique isso claramente e peça mais informações específicas

Seja sempre preciso e profissional em suas análises.`
              },
              {
                role: 'user',
                content: combinedPrompt
              }
            ],
            max_tokens: 4000,
            temperature: 0.3,
          }),
        });

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text();
          console.error('Error with Chat Completions fallback:', errorText);
          throw new Error(`Erro na análise dos arquivos: ${errorText}`);
        }

        const chatData = await chatResponse.json();
        aiMessage = chatData.choices[0].message.content;
        
        console.log('Chat Completions fallback successful');
      }
      
      // Cleanup: deletar arquivos temporários
      for (const fileId of fileIds) {
        try {
          await fetch(`https://api.openai.com/v1/files/${fileId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${openAIKey}`,
            },
          });
        } catch (error) {
          console.error(`Error deleting file ${fileId}:`, error);
        }
      }
      
    } else {
      // Fallback: usar Chat Completions para mensagens sem arquivos
      console.log('Using Chat Completions API (no files)');
      
      promptContent = message || 'Como posso ajudá-lo?';
      promptTokens = estimateTokens(promptContent);
      
      console.log('Making Chat Completions request to OpenAI');
      
      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente jurídico especializado em direito brasileiro. Responda de forma clara, precisa e didática, citando artigos de lei quando relevante.'
            },
            {
              role: 'user',
              content: promptContent
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error('Error with Chat Completions:', {
          status: chatResponse.status,
          statusText: chatResponse.statusText,
          error: errorText,
          headers: Object.fromEntries(chatResponse.headers.entries()),
          prompt: promptContent.substring(0, 100) + '...'
        });
        
        if (chatResponse.status === 401) {
          return new Response(JSON.stringify({ error: 'Erro de autenticação OpenAI: Verifique a chave API' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (chatResponse.status === 429) {
          return new Response(JSON.stringify({ error: 'Limite de rate da OpenAI excedido. Tente novamente em alguns minutos.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else if (chatResponse.status >= 500) {
          return new Response(JSON.stringify({ error: `Erro interno da OpenAI (${chatResponse.status}). Tente novamente.` }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ error: 'Erro na consulta jurídica' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      const chatData = await chatResponse.json();
      aiMessage = chatData.choices[0].message.content;
      console.log('Chat Completions response received successfully');
    }
    
    console.log('AI response received:', aiMessage.substring(0, 100) + '...');

    // Calcular tokens reais da resposta
    const responseTokens = estimateTokens(aiMessage);
    const totalTokens = promptTokens + responseTokens;
    
    console.log(`Tokens totais: ${totalTokens} (prompt: ${promptTokens}, response: ${responseTokens})`);

    // Usar os tokens após resposta bem-sucedida
    const { error: tokensError } = await supabase.rpc('use_tokens', {
      p_user_id: userId,
      p_tokens: totalTokens, // Usar tokens reais consumidos
      p_description: `Consulta jurídica (${totalTokens} tokens)`
    });

    if (tokensError) {
      console.error('Error using tokens:', tokensError);
      // Continua mesmo com erro nos tokens, pois a resposta já foi gerada
    }

    // Salvar no histórico de consultas com session_id para agrupar conversas
    const effectiveSessionId = sessionId || self.crypto.randomUUID(); // Usar sessionId fornecido ou gerar novo
    const { error: historyError } = await supabase
      .from('query_history')
      .insert({
        user_id: userId,
        session_id: effectiveSessionId,
        prompt_text: promptContent,
        response_text: aiMessage,
        credits_consumed: Math.ceil(totalTokens / 1000), // Compatibilidade com histórico
        message_type: 'ai_response',
        attached_files: attachedFiles?.length > 0 ? attachedFiles : null
      });

    if (historyError) {
      console.error('Error saving query history:', historyError);
    }

    // Retornar resposta da IA
    return new Response(JSON.stringify({ 
      response: aiMessage,
      success: true,
      tokensConsumed: totalTokens, // Retornar os tokens consumidos para o frontend
      totalTokens: totalTokens
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in legal-ai-chat function:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      requestInfo: {
        userId: req.headers.get('user-id'),
        userAgent: req.headers.get('user-agent'),
        origin: req.headers.get('origin')
      }
    });
    
    // Tratamento específico para diferentes tipos de erro
    let errorMessage = 'Erro interno do servidor';
    let statusCode = 500;
    
    if (error.message.includes('autenticação OpenAI')) {
      errorMessage = 'Erro de configuração: Chave da OpenAI inválida';
      statusCode = 503;
    } else if (error.message.includes('rate')) {
      errorMessage = 'Limite de uso da OpenAI excedido. Tente novamente em alguns minutos.';
      statusCode = 429;
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Tempo limite excedido. O processamento está demorando mais que o esperado.';
      statusCode = 408;
    } else if (error.message.includes('Assistant não encontrado')) {
      errorMessage = 'Erro de configuração do assistente. Entre em contato com o suporte.';
      statusCode = 503;
    } else if (error.message.includes('Tokens insuficientes')) {
      errorMessage = 'Tokens insuficientes para realizar a consulta.';
      statusCode = 402;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
