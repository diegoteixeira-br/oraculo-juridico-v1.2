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

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Token de autorização necessário");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error("Erro de autenticação");
    
    const user = userData.user;
    if (!user) throw new Error("Usuário não autenticado");

    // Verificar se é admin
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin", {
      p_user_id: user.id
    });
    
    if (adminError || !isAdmin) {
      throw new Error("Acesso negado: privilégios de administrador necessários");
    }

    const { user_id, tokens_amount, reason, transaction_id } = await req.json();
    
    if (!user_id || !tokens_amount) {
      throw new Error("user_id e tokens_amount são obrigatórios");
    }

    console.log(`[ADMIN-REFUND] Admin ${user.email} processando estorno de ${tokens_amount} tokens para usuário ${user_id}`);

    // Processar estorno
    const { data: success, error: refundError } = await supabase.rpc("process_refund", {
      p_user_id: user_id,
      p_refunded_credits: parseInt(tokens_amount),
      p_transaction_id: transaction_id || null,
      p_description: reason || "Estorno manual processado por administrador"
    });

    if (refundError || !success) {
      throw new Error(`Erro ao processar estorno: ${refundError?.message || "Falha desconhecida"}`);
    }

    // Buscar informações do usuário para notificação
    const { data: targetProfile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, user_id")
      .eq("user_id", user_id)
      .single();

    // Enviar notificação ao usuário
    await supabase.from("notifications").insert({
      user_id: user_id,
      title: "Estorno Processado",
      body: `Um estorno de ${tokens_amount} tokens foi processado em sua conta. Motivo: ${reason || "Estorno administrativo"}`,
      url: "/dashboard"
    });

    // Log da ação administrativa
    await supabase.from("credit_transactions").insert({
      user_id: user.id, // Admin que fez a ação
      transaction_type: "admin_action",
      amount: 0,
      description: `Processou estorno de ${tokens_amount} tokens para usuário ${targetProfile?.full_name || user_id}. Motivo: ${reason || "Não especificado"}`,
      status: "completed"
    });

    console.log(`[ADMIN-REFUND] Estorno processado com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      message: "Estorno processado com sucesso",
      refunded_tokens: tokens_amount,
      user_affected: targetProfile?.full_name || user_id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("[ADMIN-REFUND] Erro:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});