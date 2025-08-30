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
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    console.log(`[CANCEL-SUBSCRIPTION] Processing cancellation for user: ${user.email}`);

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Buscar customer no Stripe pelo email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      console.log(`[CANCEL-SUBSCRIPTION] Found Stripe customer: ${customerId}`);
      
      // Buscar assinaturas ativas e em trial do customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all", // Buscar todas, incluindo trialing
      });
      
      // Cancelar todas as assinaturas (ativas e em trial)
      let cancelledCount = 0;
      for (const subscription of subscriptions.data) {
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          console.log(`[CANCEL-SUBSCRIPTION] Cancelling subscription: ${subscription.id} (status: ${subscription.status})`);
          await stripe.subscriptions.cancel(subscription.id);
          cancelledCount++;
        }
      }
      
      console.log(`[CANCEL-SUBSCRIPTION] Cancelled ${cancelledCount} subscription(s)`);
    } else {
      console.log(`[CANCEL-SUBSCRIPTION] No Stripe customer found for ${user.email}`);
    }

    // Atualizar status da assinatura no perfil (manter dados para controle de trial)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: 'cancelled',
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[CANCEL-SUBSCRIPTION] Error updating profile:', updateError);
      throw updateError;
    }

    // Deletar o usuário do Supabase Auth (perfil permanece para controle de trial)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('[CANCEL-SUBSCRIPTION] Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log(`[CANCEL-SUBSCRIPTION] Successfully cancelled subscription for user: ${user.email}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Conta excluída com sucesso" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error: any) {
    console.error("[CANCEL-SUBSCRIPTION] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});