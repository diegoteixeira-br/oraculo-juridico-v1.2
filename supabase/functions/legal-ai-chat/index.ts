
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

    const fileUploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      const errorText = await fileUploadResponse.text();
      throw new Error(`Falha ao fazer upload do arquivo ${fileName}: ${errorText}`);
    }

    const uploadedFile = await fileUploadResponse.json();
    console.log(`File uploaded successfully: ${fileName}, ID: ${uploadedFile.id}`);
    
    return uploadedFile.id; // Retorna o file_id para usar no Assistant
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, error);
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

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, userId, attachedFiles } = await req.json();
    
    console.log('Processing legal query:', { message, userId, attachedFilesCount: attachedFiles?.length || 0 });

    // Verificar se o usuário tem tokens suficientes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tokens, daily_tokens, plan_tokens, plan_type')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const availableTokens = profile.plan_type === 'gratuito' 
      ? (profile.daily_tokens || 0)
      : (profile.plan_tokens || 0);
      
    if (availableTokens < 100) {
      return new Response(JSON.stringify({ error: 'Tokens insuficientes' }), {
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
        throw new Error(`Failed to create thread: ${await threadResponse.text()}`);
      }
      
      const thread = await threadResponse.json();
      console.log('Thread created:', thread.id);
      
      // Adicionar mensagem com file_ids na thread
      const messageContent = message || 'Segue um arquivo para análise.';
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
          file_ids: fileIds
        })
      });
      
      if (!messageResponse.ok) {
        throw new Error(`Failed to add message: ${await messageResponse.text()}`);
      }
      
      console.log('Message added to thread with file_ids');
      
      // Executar o assistant (você deve ter um assistant_id configurado)
      const assistantId = Deno.env.get('OPENAI_ASSISTANT_ID') || 'asst_default';
      
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          instructions: 'Você é um assistente jurídico especializado em direito brasileiro. Analise o(s) arquivo(s) anexado(s) e forneça uma resposta jurídica completa, citando artigos de lei quando relevante. Estruture sua resposta de forma organizada.'
        })
      });
      
      if (!runResponse.ok) {
        // Se não conseguir usar Assistant, fallback para Chat Completions
        console.log('Assistant API failed, falling back to Chat Completions');
        throw new Error('Assistant not available');
      }
      
      const run = await runResponse.json();
      console.log('Run started:', run.id);
      
      // Aguardar conclusão da execução
      let runStatus = run.status;
      let attempts = 0;
      while (runStatus === 'queued' || runStatus === 'in_progress') {
        if (attempts > 60) { // 60 segundos de timeout
          throw new Error('Assistant execution timeout');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });
        
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        attempts++;
      }
      
      if (runStatus !== 'completed') {
        throw new Error(`Assistant execution failed: ${runStatus}`);
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
        console.error('Error with Chat Completions:', errorText);
        return new Response(JSON.stringify({ error: 'Erro na consulta jurídica' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const chatData = await chatResponse.json();
      aiMessage = chatData.choices[0].message.content;
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

    // Salvar no histórico de consultas
    const { error: historyError } = await supabase
      .from('query_history')
      .insert({
        user_id: userId,
        prompt_text: promptContent,
        response_text: aiMessage,
        credits_consumed: Math.ceil(totalTokens / 1000), // Compatibilidade com histórico
        message_type: 'legal_consultation'
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
    console.error('Error in legal-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
