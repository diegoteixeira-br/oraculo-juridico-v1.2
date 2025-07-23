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
    console.log("🚀 Iniciando criação de pagamento...");
    
    const { packageId } = await req.json();
    console.log("📦 Package ID recebido:", packageId);
    
    // Validate package
    const packages = {
      "basico": { name: "Plano Básico", tokens: 75000, price: 5990, planType: "basico" },
      "premium": { name: "Plano Premium", tokens: 150000, price: 9700, planType: "premium" }
    };

    const selectedPackage = packages[packageId as keyof typeof packages];
    if (!selectedPackage) {
      throw new Error("Pacote de tokens inválido");
    }
    
    console.log("✅ Pacote selecionado:", selectedPackage);

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

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { 
              name: selectedPackage.name,
              description: `${selectedPackage.tokens.toLocaleString()} tokens para o Oráculo Jurídico`
            },
            unit_amount: selectedPackage.price, // Preço em centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/comprar-creditos`,
      metadata: {
        user_id: user.id,
        package_id: packageId,
        tokens: selectedPackage.tokens.toString(),
        plan_type: selectedPackage.planType
      }
    });

    console.log("💳 Sessão de checkout criada:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Erro ao criar pagamento:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});