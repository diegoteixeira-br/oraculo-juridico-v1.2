
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

    console.log('Making request to OpenAI API...');

    // Preparar prompt para consulta jurídica
    const systemPrompt = `Você é um assistente jurídico especializado em direito brasileiro. Forneça respostas precisas, baseadas na legislação vigente e jurisprudência consolidada. Suas respostas devem ser:

1. Claras e objetivas
2. Baseadas em fontes confiáveis do direito brasileiro
3. Incluir referências legais quando aplicável
4. Apontar quando uma questão requer análise mais aprofundada por um advogado
5. Usar linguagem acessível, mas tecnicamente correta

Quando arquivos PDF ou imagens forem fornecidos, analise-os detalhadamente e forneça uma explicação completa sobre o conteúdo, incluindo:
- Resumo do documento
- Pontos principais e relevantes
- Análise jurídica do conteúdo
- Implicações legais
- Recomendações práticas

Sempre indique quando uma situação exige consultoria jurídica presencial.`;

    // Preparar mensagens para a OpenAI
    let messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Processar mensagem do usuário
    if (attachedFiles && attachedFiles.length > 0) {
      // Se há arquivos anexados, usar gpt-4o para melhor suporte a imagens e OCR
      const userMessage = {
        role: 'user',
        content: [
          { type: 'text', text: message || 'Analise os documentos anexados conforme as instruções do sistema.' }
        ]
      };

      // Adicionar arquivos à mensagem
      for (const file of attachedFiles) {
        if (file.type.startsWith('image/')) {
          // Para imagens, usar vision do GPT-4o
          userMessage.content.push({
            type: 'image_url',
            image_url: {
              url: file.data
            }
          });
          
          // Adicionar contexto específico para imagens
          userMessage.content.push({
            type: 'text',
            text: `[IMAGEM ANEXADA: ${file.name}]

Esta imagem pode conter:
- Documentos escaneados que precisam de análise OCR
- Contratos, petições ou outros documentos jurídicos
- Certidões, alvarás ou documentos oficiais
- Prints de tela ou capturas de documentos

Por favor, analise todo o texto visível na imagem e forneça:
1. Transcrição completa do conteúdo legível
2. Análise jurídica detalhada
3. Identificação do tipo de documento
4. Pontos importantes e cláusulas relevantes
5. Implicações legais
6. Recomendações práticas

Use suas capacidades de OCR para extrair e analisar todo o texto presente na imagem.`
          });
        } else if (file.type === 'application/pdf') {
          // Para PDFs, orientar o GPT-4o sobre como processar
          userMessage.content.push({
            type: 'text',
            text: `[PDF ANEXADO: ${file.name}]

Este PDF pode ser:
- Um documento com texto selecionável (PDF nativo)
- Um documento escaneado (PDF com imagens)
- Um documento híbrido (parte texto, parte imagem)

IMPORTANTE: Como não posso processar PDFs diretamente, preciso que você:

1. Informe ao usuário que PDFs não podem ser processados diretamente
2. Oriente o usuário sobre as alternativas:
   - Para PDFs com texto: converter para .txt e reenviar
   - Para PDFs escaneados: converter cada página em imagem (PNG/JPG) e reenviar
   - Usar ferramentas de OCR externas para extrair o texto

3. Caso o usuário descreva o conteúdo do PDF, forneça análise baseada na descrição

Explique essas limitações de forma clara e ofereça suporte para quando o usuário retornar com o conteúdo em formato adequado.`
          });
        }
      }

      messages.push(userMessage);
    } else {
      // Mensagem simples sem arquivos
      messages.push({ role: 'user', content: message });
    }

    console.log('Messages prepared for OpenAI:', messages.length, 'messages');

    // Chamar a API da OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: attachedFiles && attachedFiles.length > 0 ? 'gpt-4o' : 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    console.log('OpenAI response status:', openAIResponse.status);

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        errorText: errorText
      });

      let errorMessage = 'Erro na comunicação com a IA';
      
      if (openAIResponse.status === 401) {
        errorMessage = 'Erro de autenticação com a OpenAI. Verifique a chave da API.';
      } else if (openAIResponse.status === 429) {
        errorMessage = 'Limite de uso da API excedido. Tente novamente em alguns minutos.';
      } else if (openAIResponse.status >= 500) {
        errorMessage = 'Erro interno da OpenAI. Tente novamente.';
      }

      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: `Status: ${openAIResponse.status} - ${openAIResponse.statusText}`,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let aiResponse;
    try {
      aiResponse = await openAIResponse.json();
      console.log('OpenAI response received successfully');
    } catch (jsonError) {
      console.error('Error parsing OpenAI response as JSON:', jsonError);
      
      return new Response(JSON.stringify({ 
        error: 'Resposta inválida da OpenAI',
        details: 'A resposta não está em formato JSON válido'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extrair a resposta da IA
    const aiMessage = aiResponse.choices?.[0]?.message?.content || 'Desculpe, não foi possível gerar uma resposta.';
    console.log('AI message extracted:', aiMessage.substring(0, 100) + '...');

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
