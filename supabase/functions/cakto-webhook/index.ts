import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAKTO_WEBHOOK_SECRET = "8b02ef4d-a6a0-42e6-87f5-7e8e12e7fd17";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se é POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    console.log('Webhook received:', body);

    // Validar webhook secret (assumindo que vem no header ou no body)
    const webhookSecret = req.headers.get('x-webhook-secret') || body.webhook_secret;
    if (webhookSecret !== CAKTO_WEBHOOK_SECRET) {
      console.error('Invalid webhook secret');
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Verificar se o pagamento foi aprovado
    if (body.status !== 'approved' && body.status !== 'paid') {
      console.log('Payment not approved, status:', body.status);
      return new Response('Payment not approved', { status: 200, headers: corsHeaders });
    }

    // Buscar usuário pelo email ou ID fornecido pelo webhook
    const userEmail = body.customer_email || body.email;
    if (!userEmail) {
      console.error('No customer email in webhook');
      return new Response('No customer email', { status: 400, headers: corsHeaders });
    }

    // Conectar ao Supabase com service role para bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Buscar o perfil do usuário pelo email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error listing users:', authError);
      return new Response('Error finding user', { status: 500, headers: corsHeaders });
    }

    const user = authUsers.users.find(u => u.email === userEmail);
    if (!user) {
      console.error('User not found with email:', userEmail);
      return new Response('User not found', { status: 404, headers: corsHeaders });
    }

    // Atualizar o perfil do usuário para ativo
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 mês de acesso

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_end_date: subscriptionEndDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response('Error updating profile', { status: 500, headers: corsHeaders });
    }

    console.log('Successfully activated user:', userEmail);
    return new Response('User activated successfully', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});