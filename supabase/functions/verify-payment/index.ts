import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔍 Iniciando verificação de pagamento...");
    
    const { session_id } = await req.json();
    console.log("📝 Session ID recebido:", session_id);

    if (!session_id) {
      console.error("❌ Session ID não fornecido");
      throw new Error("Session ID é obrigatório");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("❌ STRIPE_SECRET_KEY não configurada");
      throw new Error("Chave do Stripe não configurada");
    }
    
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });
    console.log("💳 Stripe inicializado com sucesso");

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("📋 Sessão recuperada:", {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata
    });

    if (session.payment_status === 'paid') {
      console.log("✅ Pagamento confirmado!");
      
      const { user_id, tokens, package_id, plan_type } = session.metadata || {};
      console.log("📦 Metadata da sessão:", { user_id, tokens, package_id, plan_type });

      if (!user_id || !tokens) {
        throw new Error("Metadata da sessão incompleta");
      }

      // Create Supabase client with service role key
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      console.log("🔑 Cliente Supabase criado com service role");

      // Check for existing transaction to prevent duplicates
      const { data: existingTransactions } = await supabaseClient
        .from('credit_transactions')
        .select('id')
        .eq('cakto_transaction_id', session.id);

      if (existingTransactions && existingTransactions.length > 0) {
        console.log("⚠️ Transação já processada:", session.id, "- Total encontradas:", existingTransactions.length);
        return new Response(JSON.stringify({
          success: true,
          message: "Pagamento já processado",
          tokens_added: parseInt(tokens),
          already_processed: true
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Add tokens to user
      console.log("🔄 Chamando add_tokens_to_user...");
      const { data: addTokensResult, error: addTokensError } = await supabaseClient
        .rpc('add_tokens_to_user', {
          p_user_id: user_id,
          p_tokens: parseInt(tokens),
          p_plan_type: plan_type || 'basico',
          p_transaction_id: session.id,
          p_description: `Compra de ${tokens} tokens - ${package_id}`
        });

      if (addTokensError) {
        console.error("❌ Erro ao adicionar tokens:", addTokensError);
        throw addTokensError;
      }

      console.log("✅ Tokens adicionados com sucesso:", addTokensResult);

      return new Response(JSON.stringify({
        success: true,
        message: "Tokens adicionados com sucesso",
        tokens_added: parseInt(tokens),
        transaction_id: session.id
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.log("⏳ Pagamento ainda não confirmado:", session.payment_status);
      return new Response(JSON.stringify({
        success: false,
        message: "Pagamento ainda não foi confirmado",
        payment_status: session.payment_status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("❌ Erro na verificação de pagamento:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});