import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    console.log(`[CANCEL-SUBSCRIPTION] Processing cancellation for user: ${user.email}`);

    // Atualizar o status da assinatura para "cancelled" no Supabase
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        subscription_status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[CANCEL-SUBSCRIPTION] Error updating profile:", updateError);
      throw new Error("Erro ao atualizar status da assinatura");
    }

    console.log(`[CANCEL-SUBSCRIPTION] Successfully cancelled subscription for user: ${user.email}`);

    // Aqui você pode adicionar uma chamada para a API da Cakto para cancelar pagamentos recorrentes
    // Exemplo: await cancelCaktoSubscription(user.email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Assinatura cancelada com sucesso",
        subscription_status: "cancelled"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("[CANCEL-SUBSCRIPTION] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro interno do servidor" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});