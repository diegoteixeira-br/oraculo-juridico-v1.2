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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { product_type_id } = await req.json();
    console.log("[create-checkout] Received product_type_id:", product_type_id);
    if (!product_type_id) throw new Error("product_type_id is required");

    // Buscar informações do produto
    const { data: productType, error: productError } = await supabaseClient
      .from('product_types')
      .select('*')
      .eq('id', product_type_id)
      .eq('is_active', true)
      .single();

    console.log("[create-checkout] Product query result:", { productType, productError });
    if (productError || !productType) throw new Error(`Product type not found or inactive: ${productError?.message || 'No product found'}`);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://oraculojuridico.com.br";

    // Configurar sessão baseada no tipo de produto
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: productType.price_currency.toLowerCase(),
            product_data: { 
              name: productType.name,
              description: productType.description
            },
            unit_amount: productType.price_cents,
          },
          quantity: 1,
        },
      ],
      cancel_url: `${origin}/comprar-creditos`,
      metadata: {
        user_id: user.id,
        product_type_id: product_type_id,
        tokens: productType.tokens_included.toString(),
      },
    };

    // Configurar baseado na categoria do produto
    if (productType.category === 'subscription') {
      sessionConfig.mode = "subscription";
      sessionConfig.line_items[0].price_data.recurring = { interval: productType.billing_period };
      sessionConfig.success_url = `${origin}/payment-success?subscription=1&session_id={CHECKOUT_SESSION_ID}`;
      sessionConfig.metadata.plan = productType.name.toLowerCase();
    } else {
      sessionConfig.mode = "payment";
      sessionConfig.success_url = `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
      sessionConfig.metadata.package_type = productType.name.toLowerCase();
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[create-checkout] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
