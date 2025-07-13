
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

    // Preparar dados para enviar ao webhook do n8n (formato simplificado)
    const webhookPayload = {
      pushName: "Usuário Legal AI",
      key: {
        remoteJid: userId,
        id: `msg_${Date.now()}`
      },
      messageType: "conversation",
      message: {
        conversation: message,
        extendedTextMessage: {
          text: message
        }
      },
      // Campos diretos para o Switch do n8n
      nome: "Usuário Legal AI",
      telefone: `user_${userId}`,
      texto: message,
      user_id: userId,
      attached_files: attachedFiles || [],
      timestamp: new Date().toISOString(),
      // Campos para identificação no n8n
      apikey: "legal_ai_chat",
      instance: "LegalAI",
      server_url: "https://legal-ai.com"
    };

    // Obter URL e token do webhook da configuração
    const webhookUrl = Deno.env.get('LEGAL_AI_WEBHOOK_URL');
    const webhookToken = Deno.env.get('LEGAL_AI_WEBHOOK_TOKEN');
    
    if (!webhookUrl) {
      console.error('LEGAL_AI_WEBHOOK_URL not configured');
      return new Response(JSON.stringify({ error: 'Webhook não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Sending request to webhook:', webhookUrl);
    console.log('Using token:', webhookToken ? 'Token configured' : 'No token - webhook will be called without authentication');
    
    // Preparar headers para o webhook
    const webhookHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Adicionar token se configurado
    if (webhookToken) {
      webhookHeaders['Authorization'] = `Bearer ${webhookToken}`;
    }

    console.log('Webhook headers:', Object.keys(webhookHeaders));

    // Enviar para o webhook da ferramenta
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: webhookHeaders,
      body: JSON.stringify(webhookPayload),
    });

    console.log('Webhook response status:', webhookResponse.status);
    console.log('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error details:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
        errorText: errorText,
        url: webhookUrl
      });

      // Tratar diferentes tipos de erro
      let errorMessage = 'Erro na comunicação com a IA';
      
      if (webhookResponse.status === 401 || webhookResponse.status === 403) {
        errorMessage = 'Erro de autorização no webhook. Verifique o token de acesso.';
      } else if (webhookResponse.status === 404) {
        errorMessage = 'Webhook não encontrado. Verifique a URL configurada.';
      } else if (webhookResponse.status >= 500) {
        errorMessage = 'Erro interno do servidor no webhook.';
      }

      return new Response(JSON.stringify({ 
        error: errorMessage,
        details: `Status: ${webhookResponse.status} - ${webhookResponse.statusText}`,
        webhookError: errorText,
        webhookStatus: webhookResponse.status
      }), {
        status: 200, // Retornar 200 para que o frontend receba a resposta
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let aiResponse;
    try {
      aiResponse = await webhookResponse.json();
      console.log('AI response received:', aiResponse);
    } catch (jsonError) {
      console.error('Error parsing webhook response as JSON:', jsonError);
      const responseText = await webhookResponse.text();
      console.log('Raw webhook response:', responseText);
      
      return new Response(JSON.stringify({ 
        error: 'Resposta inválida do webhook',
        details: 'A resposta não está em formato JSON válido',
        webhookResponse: responseText
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
      response: aiResponse.message || aiResponse.response || aiResponse.text || 'Resposta recebida da IA',
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
