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
    console.log("🎫 Session ID recebido:", session_id);
    
    if (!session_id) {
      throw new Error("Session ID não fornecido");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log("💳 Status do pagamento:", session.payment_status);
        console.log("📋 Metadata da sessão:", session.metadata);
        
        if (session.payment_status === "paid") {
      // Create Supabase client with service role for bypassing RLS
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const userId = session.metadata?.user_id;
      const tokens = parseInt(session.metadata?.tokens || "0");
      const packageId = session.metadata?.package_id;
      const planType = session.metadata?.plan_type || 'gratuito';

      console.log("📝 Dados extraídos:", { userId, tokens, packageId, planType });

      if (!userId || !tokens) {
        throw new Error("Dados de pagamento incompletos");
      }

      if (userId && tokens > 0) {
        // Check if this transaction was already processed
        const { data: existingTransaction } = await supabaseClient
          .from('credit_transactions')
          .select('id')
          .eq('cakto_transaction_id', session.id)
          .maybeSingle();
        
        if (existingTransaction) {
          console.log("⚠️ Transação já processada anteriormente");
          return new Response(JSON.stringify({ 
            success: true, 
            tokens_added: tokens,
            plan_type: planType,
            transaction_id: session_id,
            already_processed: true
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }

        // Add tokens to user using RPC function
        console.log("🚀 Chamando add_tokens_to_user com:", {
          p_user_id: userId,
          p_tokens: tokens,
          p_plan_type: planType,
          p_transaction_id: session_id,
          p_description: `Compra de ${tokens.toLocaleString()} tokens - ${packageId}`
        });

        const { data: result, error: rpcError } = await supabaseClient.rpc('add_tokens_to_user', {
          p_user_id: userId,
          p_tokens: tokens,
          p_plan_type: planType,
          p_transaction_id: session_id,
          p_description: `Compra de ${tokens.toLocaleString()} tokens - ${packageId}`
        });

        if (rpcError) {
          console.error("❌ Erro ao adicionar tokens:", rpcError);
          throw new Error("Erro ao processar tokens");
        }

        if (!result) {
          throw new Error("Falha ao adicionar tokens");
        }

        console.log("✅ Tokens adicionados com sucesso!");

        console.log("✅ Tokens adicionados com sucesso! Resultado:", result);

        return new Response(JSON.stringify({ 
          success: true, 
          tokens_added: tokens,
          plan_type: planType,
          transaction_id: session_id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } else {
      console.log("⏳ Pagamento ainda não confirmado");
      return new Response(JSON.stringify({ 
        success: false, 
        payment_status: session.payment_status 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

  } catch (error) {
    console.error("Erro ao verificar pagamento:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});