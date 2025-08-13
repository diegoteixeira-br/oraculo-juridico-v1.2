import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY não configurada");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) throw new Error("Assinatura Stripe não encontrada");
    
    console.log("[STRIPE-WEBHOOK] Processando evento...");
    
    let event: Stripe.Event;
    try {
      // Em produção, use seu endpoint secret do Stripe
      event = stripe.webhooks.constructEvent(body, signature, Deno.env.get("STRIPE_WEBHOOK_SECRET") || "");
    } catch (err) {
      console.error("[STRIPE-WEBHOOK] Erro de verificação:", err);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    console.log(`[STRIPE-WEBHOOK] Evento recebido: ${event.type}`);

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case "charge.dispute.created":
      case "payment_intent.payment_failed":
      case "invoice.payment_failed":
        await handleRefundEvent(supabase, event);
        break;
      
      case "customer.subscription.deleted":
      case "customer.subscription.updated":
        await handleSubscriptionEvent(supabase, stripe, event);
        break;
        
      default:
        console.log(`[STRIPE-WEBHOOK] Evento não processado: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[STRIPE-WEBHOOK] Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleRefundEvent(supabase: any, event: Stripe.Event) {
  console.log("[STRIPE-WEBHOOK] Processando estorno/disputa...");
  
  const object = event.data.object as any;
  let customerId: string | null = null;
  let amount = 0;
  
  // Extrair informações baseado no tipo de evento
  if (event.type === "charge.dispute.created") {
    customerId = object.charge?.customer;
    amount = object.amount;
  } else if (event.type === "payment_intent.payment_failed") {
    customerId = object.customer;
    amount = object.amount;
  }
  
  if (!customerId) {
    console.log("[STRIPE-WEBHOOK] Customer ID não encontrado");
    return;
  }
  
  // Encontrar usuário pelo customer ID do Stripe
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, tokens, plan_tokens")
    .eq("stripe_customer_id", customerId)
    .single();
    
  if (profileError || !profile) {
    console.log("[STRIPE-WEBHOOK] Usuário não encontrado para customer:", customerId);
    return;
  }
  
  // Calcular tokens a serem removidos (baseado na taxa de conversão do sistema)
  const tokensToRemove = Math.floor(amount / 100); // Ajustar conforme sua taxa
  
  // Processar estorno usando a função existente
  const { error: refundError } = await supabase.rpc("process_refund", {
    p_user_id: profile.user_id,
    p_refunded_credits: tokensToRemove,
    p_transaction_id: object.id,
    p_description: `Estorno automático - ${event.type}`
  });
  
  if (refundError) {
    console.error("[STRIPE-WEBHOOK] Erro ao processar estorno:", refundError);
    return;
  }
  
  // Enviar notificação ao usuário
  await supabase.from("notifications").insert({
    user_id: profile.user_id,
    title: "Estorno Processado",
    body: `Um estorno de ${tokensToRemove} tokens foi processado em sua conta devido a: ${event.type}`,
    url: "/dashboard"
  });
  
  console.log(`[STRIPE-WEBHOOK] Estorno processado: ${tokensToRemove} tokens removidos do usuário ${profile.user_id}`);
}

async function handleSubscriptionEvent(supabase: any, stripe: Stripe, event: Stripe.Event) {
  console.log("[STRIPE-WEBHOOK] Processando evento de assinatura...");
  
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  
  // Encontrar usuário
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();
    
  if (profileError || !profile) {
    console.log("[STRIPE-WEBHOOK] Usuário não encontrado para customer:", customerId);
    return;
  }
  
  if (event.type === "customer.subscription.deleted") {
    // Assinatura cancelada
    await supabase
      .from("profiles")
      .update({
        subscription_status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", profile.user_id);
      
    await supabase.from("notifications").insert({
      user_id: profile.user_id,
      title: "Assinatura Cancelada",
      body: "Sua assinatura foi cancelada. Para continuar usando as ferramentas premium, renove sua assinatura.",
      url: "/comprar-creditos"
    });
    
    console.log(`[STRIPE-WEBHOOK] Assinatura cancelada para usuário ${profile.user_id}`);
  }
}