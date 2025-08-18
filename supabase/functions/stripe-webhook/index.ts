import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  console.log(`[STRIPE-WEBHOOK] ${req.method} request recebido`);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("[STRIPE-WEBHOOK] STRIPE_SECRET_KEY não configurada");
      throw new Error("STRIPE_SECRET_KEY não configurada");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    console.log(`[STRIPE-WEBHOOK] Body length: ${body.length}, Signature present: ${!!signature}`);
    
    let event: Stripe.Event;
    
    // Verificar se tem o webhook secret configurado
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        console.log("[STRIPE-WEBHOOK] Assinatura verificada com sucesso");
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Erro de verificação de assinatura:", err);
        return new Response(`Webhook signature verification failed: ${err.message}`, { 
          status: 400,
          headers: corsHeaders 
        });
      }
    } else {
      // Se não tem webhook secret configurado, tenta fazer parsing manual (apenas para desenvolvimento)
      console.log("[STRIPE-WEBHOOK] STRIPE_WEBHOOK_SECRET não configurado, fazendo parsing manual");
      try {
        event = JSON.parse(body);
      } catch (err) {
        console.error("[STRIPE-WEBHOOK] Erro ao fazer parsing do body:", err);
        return new Response("Invalid JSON body", { 
          status: 400,
          headers: corsHeaders 
        });
      }
    }

    console.log(`[STRIPE-WEBHOOK] Evento recebido: ${event.type} - ID: ${event.id}`);

    // Processar diferentes tipos de eventos
    switch (event.type) {
      case "checkout.session.completed":
        await handlePaymentSuccess(supabase, stripe, event);
        break;
      case "invoice.payment_succeeded":
        await handleSubscriptionPayment(supabase, stripe, event);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(supabase, stripe, event);
        break;
      case "charge.dispute.created":
      case "payment_intent.payment_failed":
      case "invoice.payment_failed":
        await handleRefundEvent(supabase, event);
        break;
      default:
        console.log(`[STRIPE-WEBHOOK] Evento não processado: ${event.type}`);
    }

    console.log(`[STRIPE-WEBHOOK] Evento ${event.type} processado com sucesso`);
    
    return new Response(JSON.stringify({ received: true, event_type: event.type }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[STRIPE-WEBHOOK] Erro geral:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handlePaymentSuccess(supabase: any, stripe: Stripe, event: Stripe.Event) {
  console.log("[STRIPE-WEBHOOK] Processando pagamento bem-sucedido...");
  
  const session = event.data.object as Stripe.Checkout.Session;
  console.log(`[STRIPE-WEBHOOK] Session ID: ${session.id}, Customer: ${session.customer}, Payment Status: ${session.payment_status}`);
  
  if (session.payment_status !== "paid") {
    console.log("[STRIPE-WEBHOOK] Pagamento não foi confirmado ainda");
    return;
  }

  try {
    // Buscar customer details
    const customer = await stripe.customers.retrieve(session.customer as string);
    console.log(`[STRIPE-WEBHOOK] Customer email: ${customer.email}`);

    if (!customer.email) {
      console.error("[STRIPE-WEBHOOK] Customer sem email");
      return;
    }

    // Buscar usuário pelo email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(customer.email);
    if (authError || !authUser.user) {
      console.error("[STRIPE-WEBHOOK] Usuário não encontrado:", authError);
      return;
    }

    // Atualizar profile com customer ID do Stripe
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: session.customer })
      .eq("user_id", authUser.user.id);

    if (updateError) {
      console.error("[STRIPE-WEBHOOK] Erro ao atualizar profile:", updateError);
    }

    console.log(`[STRIPE-WEBHOOK] Pagamento processado para usuário ${authUser.user.id}`);
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Erro ao processar pagamento:", error);
  }
}

async function handleSubscriptionPayment(supabase: any, stripe: Stripe, event: Stripe.Event) {
  console.log("[STRIPE-WEBHOOK] Processando pagamento de assinatura...");
  
  const invoice = event.data.object as Stripe.Invoice;
  const customerId = invoice.customer as string;
  
  try {
    const customer = await stripe.customers.retrieve(customerId);
    console.log(`[STRIPE-WEBHOOK] Subscription payment para customer: ${customer.email}`);

    if (!customer.email) {
      console.error("[STRIPE-WEBHOOK] Customer sem email");
      return;
    }

    // Buscar usuário pelo email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(customer.email);
    if (authError || !authUser.user) {
      console.error("[STRIPE-WEBHOOK] Usuário não encontrado:", authError);
      return;
    }

    // Atualizar profile com customer ID
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        stripe_customer_id: customerId,
        subscription_status: "active" 
      })
      .eq("user_id", authUser.user.id);

    if (updateError) {
      console.error("[STRIPE-WEBHOOK] Erro ao atualizar profile:", updateError);
    }

    console.log(`[STRIPE-WEBHOOK] Pagamento de assinatura processado para usuário ${authUser.user.id}`);
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Erro ao processar pagamento de assinatura:", error);
  }
}

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
  
  try {
    // Buscar customer details
    const customer = await stripe.customers.retrieve(customerId);
    console.log(`[STRIPE-WEBHOOK] Subscription event para customer: ${customer.email}`);

    if (!customer.email) {
      console.error("[STRIPE-WEBHOOK] Customer sem email");
      return;
    }

    // Buscar usuário pelo email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(customer.email);
    if (authError || !authUser.user) {
      console.error("[STRIPE-WEBHOOK] Usuário não encontrado:", authError);
      return;
    }

    // Atualizar profile com customer ID se não existir
    const { error: updateCustomerError } = await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", authUser.user.id)
      .is("stripe_customer_id", null);

    if (updateCustomerError) {
      console.error("[STRIPE-WEBHOOK] Erro ao atualizar customer ID:", updateCustomerError);
    }

    // Processar diferentes tipos de eventos de assinatura
    let subscriptionStatus = "active";
    let notificationTitle = "";
    let notificationBody = "";

    switch (event.type) {
      case "customer.subscription.created":
        subscriptionStatus = "active";
        notificationTitle = "Assinatura Ativada";
        notificationBody = "Sua assinatura foi ativada com sucesso! Aproveite todos os recursos premium.";
        break;
      case "customer.subscription.updated":
        subscriptionStatus = subscription.status === "active" ? "active" : subscription.status;
        notificationTitle = "Assinatura Atualizada";
        notificationBody = `Sua assinatura foi atualizada. Status atual: ${subscription.status}`;
        break;
      case "customer.subscription.deleted":
        subscriptionStatus = "cancelled";
        notificationTitle = "Assinatura Cancelada";
        notificationBody = "Sua assinatura foi cancelada. Para continuar usando as ferramentas premium, renove sua assinatura.";
        break;
    }

    // Atualizar status da assinatura
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        subscription_status: subscriptionStatus,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", authUser.user.id);

    if (updateError) {
      console.error("[STRIPE-WEBHOOK] Erro ao atualizar status da assinatura:", updateError);
    }
    
    // Enviar notificação se necessário
    if (notificationTitle) {
      await supabase.from("notifications").insert({
        user_id: authUser.user.id,
        title: notificationTitle,
        body: notificationBody,
        url: "/dashboard"
      });
    }
    
    console.log(`[STRIPE-WEBHOOK] ${event.type} processado para usuário ${authUser.user.id}`);
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Erro ao processar evento de assinatura:", error);
  }
}