
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

Sempre indique quando uma situação exige consultoria jurídica presencial.`;

    // Chamar a API da OpenAI
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
