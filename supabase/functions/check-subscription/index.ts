import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type CheckResponse = {
  subscribed: boolean;
  subscription_tier?: string | null;
  subscription_end?: string | null;
  monthly_grant_applied?: boolean;
  message?: string;
};

const log = (msg: string, data?: unknown) => console.log(`[check-subscription] ${msg}`, data ?? "");

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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find or create customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      log("No stripe customer found");
      // Mark as unsubscribed
      await supabase.from('profiles').update({
        subscription_status: 'expired',
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      const res: CheckResponse = { subscribed: false, message: 'No Stripe customer' };
      return new Response(JSON.stringify(res), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 });
    const hasActiveSub = subscriptions.data.length > 0;

    let subscriptionTier: string | null = null;
    let subscriptionEnd: string | null = null;
    let periodStartISO: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      periodStartISO = new Date(subscription.current_period_start * 1000).toISOString();
      // Determine tier by price amount
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      subscriptionTier = amount <= 3790 ? 'Essencial' : 'Profissional';

      // Update profile basic subscription fields
      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_end_date: subscriptionEnd,
        plan_type: 'essencial',
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);
    } else {
      await supabase.from('profiles').update({
        subscription_status: 'expired',
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      const res: CheckResponse = { subscribed: false };
      return new Response(JSON.stringify(res), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // If there is an active sub, check and grant the monthly 30k if needed
    let monthlyGrantApplied = false;
    if (hasActiveSub && periodStartISO) {
      // Read profile to check last grant date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('monthly_tokens_last_grant')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const lastGrant = profile?.monthly_tokens_last_grant ? new Date(profile.monthly_tokens_last_grant) : null;
      const currentPeriodStart = new Date(periodStartISO);

      if (!lastGrant || lastGrant.getTime() < currentPeriodStart.getTime()) {
        // Grant 30,000 tokens to plan and total
        const addAmount = 30000;
        const nowISO = new Date().toISOString();

        // Update profile counters
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            tokens: (undefined as any), // placeholder to force partial update via PostgREST prefer not required
          })
          .eq('user_id', user.id);
        // We cannot do arithmetic directly with PostgREST in a simple update; perform a fetch then update

        const { data: currentProfile, error: readError } = await supabase
          .from('profiles')
          .select('tokens, plan_tokens')
          .eq('user_id', user.id)
          .maybeSingle();
        if (readError) throw readError;

        const newTokens = (currentProfile?.tokens || 0) + addAmount;
        const newPlanTokens = (currentProfile?.plan_tokens || 0) + addAmount;

        const { error: finalUpdateError } = await supabase
          .from('profiles')
          .update({
            tokens: newTokens,
            plan_tokens: newPlanTokens,
            plan_type: 'essencial',
            monthly_tokens_last_grant: currentPeriodStart.toISOString(),
            updated_at: nowISO,
          })
          .eq('user_id', user.id);
        if (finalUpdateError) throw finalUpdateError;

        // Log transaction as monthly grant
        const { error: txError } = await supabase.from('credit_transactions').insert({
          user_id: user.id,
          transaction_type: 'monthly_grant',
          amount: addAmount,
          description: 'Franquia mensal da assinatura (30.000 tokens)',
          status: 'completed',
        });
        if (txError) throw txError;

        monthlyGrantApplied = true;
      }
    }

    const res: CheckResponse = {
      subscribed: true,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd,
      monthly_grant_applied: monthlyGrantApplied,
    };

    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[check-subscription] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
