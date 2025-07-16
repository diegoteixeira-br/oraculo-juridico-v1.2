
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    if (totalCredits < 1) {
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

    console.log('Making request to OpenAI Assistant API...');

    // Criar ou obter assistant jurídico
    const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        name: 'Assistente Jurídico Brasileiro',
        instructions: `Você é um assistente jurídico especializado em direito brasileiro. Forneça respostas precisas, baseadas na legislação vigente e jurisprudência consolidada. Suas respostas devem ser:

1. Claras e objetivas
2. Baseadas em fontes confiáveis do direito brasileiro
3. Incluir referências legais quando aplicável
4. Apontar quando uma questão requer análise mais aprofundada por um advogado
5. Usar linguagem acessível, mas tecnicamente correta

Quando arquivos PDF ou documentos forem fornecidos, analise-os detalhadamente e forneça uma explicação completa sobre o conteúdo, incluindo:
- Resumo do documento
- Pontos principais e relevantes
- Análise jurídica do conteúdo
- Implicações legais
- Recomendações práticas

Sempre indique quando uma situação exige consultoria jurídica presencial.`,
        model: 'gpt-4o',
        tools: [
          {
            type: 'file_search'
          }
        ],
      }),
    });

    if (!assistantResponse.ok) {
      const errorText = await assistantResponse.text();
      console.error('Error creating assistant:', errorText);
      return new Response(JSON.stringify({ error: 'Erro ao criar assistente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const assistant = await assistantResponse.json();
    console.log('Assistant created:', assistant.id);

    // Criar thread
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      const errorText = await threadResponse.text();
      console.error('Error creating thread:', errorText);
      return new Response(JSON.stringify({ error: 'Erro ao criar thread' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const thread = await threadResponse.json();
    console.log('Thread created:', thread.id);

    // Processar arquivos anexados
    const fileIds = [];
    if (attachedFiles && attachedFiles.length > 0) {
      for (const file of attachedFiles) {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
          try {
            console.log(`Uploading file: ${file.name}`);
            
            // Converter base64 para blob
            const base64Data = file.data.split(',')[1];
            const binaryData = atob(base64Data);
            const bytes = new Uint8Array(binaryData.length);
            for (let i = 0; i < binaryData.length; i++) {
              bytes[i] = binaryData.charCodeAt(i);
            }
            
            const formData = new FormData();
            formData.append('file', new Blob([bytes], { type: file.type }), file.name);
            formData.append('purpose', 'assistants');

            const fileUploadResponse = await fetch('https://api.openai.com/v1/files', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIKey}`,
              },
              body: formData,
            });

            if (fileUploadResponse.ok) {
              const uploadedFile = await fileUploadResponse.json();
              fileIds.push(uploadedFile.id);
              console.log(`File uploaded successfully: ${uploadedFile.id}`);
            } else {
              const errorText = await fileUploadResponse.text();
              console.error(`Error uploading file ${file.name}:`, errorText);
            }
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
          }
        }
      }
    }

    // Adicionar mensagem à thread
    const messageData: any = {
      role: 'user',
      content: message || 'Analise os documentos anexados e forneça uma análise jurídica completa.'
    };

    if (fileIds.length > 0) {
      messageData.attachments = fileIds.map(fileId => ({
        file_id: fileId,
        tools: [{ type: 'file_search' }]
      }));
    }

    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify(messageData),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      console.error('Error creating message:', errorText);
      return new Response(JSON.stringify({ error: 'Erro ao criar mensagem' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Executar assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: assistant.id,
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Error creating run:', errorText);
      return new Response(JSON.stringify({ error: 'Erro ao executar assistente' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const run = await runResponse.json();
    console.log('Run created:', run.id);

    // Aguardar conclusão do run
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 30;

    while (runStatus !== 'completed' && runStatus !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log(`Run status: ${runStatus}`);
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      console.error('Run did not complete:', runStatus);
      return new Response(JSON.stringify({ error: 'Tempo limite excedido ou erro no processamento' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obter mensagens da thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      console.error('Error fetching messages:', errorText);
      return new Response(JSON.stringify({ error: 'Erro ao buscar mensagens' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messages = await messagesResponse.json();
    console.log('Messages received:', messages.data.length);

    // Encontrar a resposta do assistente
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    if (!assistantMessage || !assistantMessage.content || assistantMessage.content.length === 0) {
      console.error('No assistant message found');
      return new Response(JSON.stringify({ error: 'Nenhuma resposta do assistente encontrada' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiMessage = assistantMessage.content[0].text.value;
    console.log('AI response received:', aiMessage.substring(0, 100) + '...');

    // Limpeza: deletar arquivos enviados
    for (const fileId of fileIds) {
      try {
        await fetch(`https://api.openai.com/v1/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${openAIKey}`,
          },
        });
        console.log(`File deleted: ${fileId}`);
      } catch (error) {
        console.error(`Error deleting file ${fileId}:`, error);
      }
    }

    // Usar os créditos após resposta bem-sucedida
    const { error: creditsError } = await supabase.rpc('use_credits', {
      p_user_id: userId,
      p_credits: 1,
      p_description: 'Consulta jurídica via chat'
    });

    if (creditsError) {
      console.error('Error using credits:', creditsError);
      // Continua mesmo com erro nos créditos, pois a resposta já foi gerada
    }

    // Retornar resposta da IA
    return new Response(JSON.stringify({ 
      response: aiMessage,
      success: true
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
