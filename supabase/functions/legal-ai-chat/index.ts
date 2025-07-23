
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

// Função para calcular créditos baseado em tokens (1 crédito = 1.500 tokens)
function tokensToCredits(tokens: number): number {
  return Math.max(0.01, tokens / 1500); // Mínimo de 0.01 crédito
}

// Função para extrair texto de PDF usando API da OpenAI
async function extractTextFromPdf(fileData: string, fileName: string, openAIKey: string): Promise<string> {
  try {
    console.log(`Extracting text from PDF: ${fileName}`);
    
    // Validar se fileData existe
    if (!fileData || typeof fileData !== 'string') {
      throw new Error('Dados do arquivo PDF não encontrados ou inválidos');
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
    
    const formData = new FormData();
    formData.append('file', new Blob([bytes], { type: 'application/pdf' }), fileName);
    formData.append('purpose', 'assistants');

    const fileUploadResponse = await fetch('https://api.openai.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
      },
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      throw new Error(`Failed to upload file: ${await fileUploadResponse.text()}`);
    }

    const uploadedFile = await fileUploadResponse.json();
    
    // Usar o modelo GPT-4 para extrair texto do PDF
    const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `Extraia todo o texto do documento anexado. Retorne apenas o texto extraído sem comentários ou formatação adicional. Se o documento não contiver texto legível, retorne "ERRO_TEXTO_NAO_ENCONTRADO".`
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!extractionResponse.ok) {
      throw new Error(`Failed to extract text: ${await extractionResponse.text()}`);
    }

    const extractionData = await extractionResponse.json();
    const extractedText = extractionData.choices[0].message.content.trim();
    
    // Deletar arquivo temporário
    try {
      await fetch(`https://api.openai.com/v1/files/${uploadedFile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
        },
      });
    } catch (error) {
      console.error('Error deleting temporary file:', error);
    }
    
    if (extractedText === "ERRO_TEXTO_NAO_ENCONTRADO") {
      throw new Error('Não foi possível extrair texto do documento');
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
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

    // Verificar se o usuário tem créditos suficientes
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, daily_credits')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const totalCredits = (profile.daily_credits || 0) + (profile.credits || 0);
    if (totalCredits < 0.01) {
      return new Response(JSON.stringify({ error: 'Créditos insuficientes' }), {
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

    let textoExtraido = '';
    
    // Processar arquivos anexados para extrair texto
    if (attachedFiles && attachedFiles.length > 0) {
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
          
          if (file.type === 'application/pdf') {
            const texto = await extractTextFromPdf(file.data, file.name, openAIKey);
            textoExtraido += texto + '\n\n';
          } else if (file.type.startsWith('image/')) {
            const texto = await extractTextFromImage(file.data, file.name, openAIKey);
            textoExtraido += texto + '\n\n';
          } else if (file.type === 'text/plain' || file.type.includes('document') || file.type.includes('word')) {
            // Processar arquivos de texto (.txt, .doc, .docx)
            try {
              let textContent = '';
              if (file.data.includes(',')) {
                const base64Data = file.data.split(',')[1];
                textContent = atob(base64Data);
              } else {
                textContent = atob(file.data);
              }
              textoExtraido += `Conteúdo do arquivo ${file.name}:\n${textContent}\n\n`;
            } catch (error) {
              console.error(`Error decoding text file ${file.name}:`, error);
              // Para arquivos mais complexos como .docx, usar OpenAI para extrair
              const texto = await extractTextFromPdf(file.data, file.name, openAIKey);
              textoExtraido += texto + '\n\n';
            }
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return new Response(JSON.stringify({ 
            error: `Erro ao processar arquivo ${file.name}: ${error.message}. Por favor, certifique-se de que o arquivo contém texto legível.` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Preparar dados estruturados para o agente
    const dadosEstruturados = {
      texto_extraido_do_documento: textoExtraido.trim() || 'Nenhum documento foi anexado.',
      pergunta_do_usuario: message || 'Analise o documento anexado.'
    };

    console.log('Sending structured data to OpenAI:', dadosEstruturados);

    // Decidir qual modelo usar baseado no conteúdo
    const hasAttachedFiles = attachedFiles && attachedFiles.length > 0;
    const modelToUse = hasAttachedFiles ? 'gpt-4o' : 'gpt-4.1-2025-04-14'; // GPT-4o para arquivos/imagens, GPT-4.1 para texto
    
    // Calcular tokens do prompt
    const promptContent = `Baseado nos dados estruturados a seguir, forneça uma resposta jurídica completa:

${JSON.stringify(dadosEstruturados, null, 2)}`;
    
    const promptTokens = estimateTokens(promptContent);
    console.log(`Usando modelo: ${modelToUse}, Tokens do prompt: ${promptTokens}`);

    // Usar o modelo apropriado para a consulta
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: `Você é um assistente jurídico especializado em direito brasileiro. Responda de forma clara, precisa e didática, citando artigos de lei quando relevante. Estruture sua resposta de forma organizada com títulos e subtópicos quando necessário.`
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
      console.error('Error with GPT-4o:', errorText);
      return new Response(JSON.stringify({ error: 'Erro na consulta jurídica' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const chatData = await chatResponse.json();
    const aiMessage = chatData.choices[0].message.content;
    
    console.log('AI response received:', aiMessage.substring(0, 100) + '...');

    // Calcular tokens reais da resposta
    const responseTokens = estimateTokens(aiMessage);
    const totalTokens = promptTokens + responseTokens;
    const creditsConsumed = tokensToCredits(totalTokens);
    
    console.log(`Tokens totais: ${totalTokens} (prompt: ${promptTokens}, response: ${responseTokens}), Créditos consumidos: ${creditsConsumed}`);

    // Usar os créditos proporcionalmente após resposta bem-sucedida
    const { error: creditsError } = await supabase.rpc('use_credits', {
      p_user_id: userId,
      p_credits: creditsConsumed, // Valor exato calculado baseado em tokens
      p_description: `Consulta jurídica (${totalTokens} tokens)`
    });

    if (creditsError) {
      console.error('Error using credits:', creditsError);
      // Continua mesmo com erro nos créditos, pois a resposta já foi gerada
    }

    // Salvar no histórico de consultas
    const { error: historyError } = await supabase
      .from('query_history')
      .insert({
        user_id: userId,
        prompt_text: JSON.stringify(dadosEstruturados),
        response_text: aiMessage,
        credits_consumed: creditsConsumed, // Usar valor exato calculado
        message_type: 'legal_consultation'
      });

    if (historyError) {
      console.error('Error saving query history:', historyError);
    }

    // Retornar resposta da IA
    return new Response(JSON.stringify({ 
      response: aiMessage,
      success: true,
      creditsConsumed: creditsConsumed, // Retornar os créditos consumidos para o frontend
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
