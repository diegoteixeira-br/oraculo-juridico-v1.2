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
    console.log("🚀 Iniciando criação de assinatura...");
    
    const { planType } = await req.json();
    console.log("📦 Plano ID recebido:", planType);
    
    // Validate plan
    const plans = {
      "basico": { 
        name: "Plano Básico", 
        price: 5990, 
        originalPrice: 11980,
        description: "30.000 tokens por mês + todas as funcionalidades",
        interval: "month"
      },
      "profissional": { 
        name: "Plano Profissional", 
        price: 9700, 
        originalPrice: 12125,
        description: "Tokens ilimitados + todas as funcionalidades",
        interval: "month"
      }
    };

    const selectedPlan = plans[planType as keyof typeof plans];
    if (!selectedPlan) {
      throw new Error("Plano de assinatura inválido");
    }
    
    console.log("✅ Plano selecionado:", selectedPlan);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Usuário não autenticado");
    
    console.log("👤 Usuário autenticado:", user.email);

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

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("🔍 Cliente existente encontrado:", customerId);
    } else {
      console.log("👤 Criando novo cliente...");
    }

    // Create a subscription session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { 
              name: selectedPlan.name,
              description: selectedPlan.description
            },
            unit_amount: selectedPlan.price, // Preço em centavos
            recurring: {
              interval: selectedPlan.interval as 'month'
            }
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/comprar-creditos`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        subscription_type: selectedPlan.name
      }
    });

    console.log("💳 Sessão de assinatura criada:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erro ao criar assinatura:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});