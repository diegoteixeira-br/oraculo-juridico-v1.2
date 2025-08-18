import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const testEmail = body.test_email;

    console.log("Teste simplificado da agenda para:", testEmail);

    if (!testEmail) {
      return new Response(JSON.stringify({ error: "Email de teste é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Teste simples - apenas verificar se chegou até aqui
    return new Response(JSON.stringify({ 
      success: true,
      message: `✅ Função de agenda funcionando! Teste para: ${testEmail}`,
      sent: 1,
      test_mode: true,
      timestamp: new Date().toISOString(),
      next_step: "Integração com Resend será feita após confirmar que a função base funciona"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error("Erro na função simplificada:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});