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
    console.log('=== WEBHOOK RECEBIDO ===');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    console.log('Body completo:', JSON.stringify(body, null, 2));
    console.log('========================');

    // Validar webhook secret (assumindo que vem no header ou no body)
    const webhookSecret = req.headers.get('x-webhook-secret') || body.webhook_secret || body.secret;
    console.log('Webhook secret recebido:', webhookSecret);
    console.log('Webhook secret esperado:', CAKTO_WEBHOOK_SECRET);
    
    if (webhookSecret !== CAKTO_WEBHOOK_SECRET) {
      console.error('Invalid webhook secret - Recebido:', webhookSecret, 'Esperado:', CAKTO_WEBHOOK_SECRET);
      return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    // Verificar se o pagamento foi aprovado
    const validStatuses = ['approved', 'paid', 'completed', 'success', 'payment_approved'];
    const paymentStatus = body.status || body.payment_status || body.state;
    console.log('Status do pagamento:', paymentStatus);
    
    if (!validStatuses.includes(paymentStatus)) {
      console.log('Payment not approved, status:', paymentStatus);
      return new Response('Payment not approved', { status: 200, headers: corsHeaders });
    }

    // Buscar usuário pelo email ou ID fornecido pelo webhook
    const userEmail = body.customer_email || body.email || body.buyer_email || body.payer_email;
    console.log('Email do cliente:', userEmail);
    
    if (!userEmail) {
      console.error('No customer email in webhook - Campos disponíveis:', Object.keys(body));
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

    // Mapear produtos Cakto para créditos baseado no nome ou ID
    const productCreditsMap: { [key: string]: number } = {
      'qx2hqko_472740': 50,  // Pacote Básico
      'qnjypg7_472753': 100, // Pacote Premium
      'qx2hqko': 50,         // ID curto Básico
      'qnjypg7': 100,        // ID curto Premium
      'Pacote Básico 50 créditos-Oráculo Jurídico': 50,
      'Pacote Premium 100 créditos-Oráculo Jurídico': 100,
      'Pacote Básico': 50,
      'Pacote Premium': 100,
      'basic': 50,
      'premium': 100,
    };

    // Extrair ID do produto, nome do produto ou valor para determinar créditos
    const productId = body.product_id || body.item_id || body.checkout_url?.split('/')?.pop()?.split('_')[0];
    const productName = body.product_name || body.name || body.item_name || body.description;
    const amount = body.amount || body.value || body.total || body.price;
    const productRef = body.product_ref || body.ref || body.utm_source || body.utm_campaign;
    
    console.log('=== INFORMAÇÕES DO PRODUTO ===');
    console.log('Product ID:', productId);
    console.log('Product Name:', productName);
    console.log('Amount:', amount);
    console.log('Product Ref:', productRef);
    console.log('UTM Source:', body.utm_source);
    console.log('UTM Campaign:', body.utm_campaign);
    console.log('URL completa:', body.checkout_url);
    console.log('==============================');
    
    let credits = 0;
    
    // Tentar mapear por ID, nome, ref ou UTM
    if (productId && productCreditsMap[productId]) {
      credits = productCreditsMap[productId];
      console.log('Créditos mapeados por Product ID:', productId, '→', credits);
    } else if (productName && productCreditsMap[productName]) {
      credits = productCreditsMap[productName];
      console.log('Créditos mapeados por Product Name:', productName, '→', credits);
    } else if (productRef && productCreditsMap[productRef]) {
      credits = productCreditsMap[productRef];
      console.log('Créditos mapeados por Product Ref:', productRef, '→', credits);
    } else if (body.utm_campaign && productCreditsMap[body.utm_campaign]) {
      credits = productCreditsMap[body.utm_campaign];
      console.log('Créditos mapeados por UTM Campaign:', body.utm_campaign, '→', credits);
    } else if (amount) {
      // Mapear por valor se não encontrar por outros métodos
      const amountValue = parseFloat(amount.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
      console.log('Tentando mapear por valor:', amountValue);
      if (amountValue >= 90 && amountValue <= 100) {
        credits = 100; // Pacote Premium
        console.log('Créditos mapeados por valor (Premium):', amountValue, '→', credits);
      } else if (amountValue >= 50 && amountValue <= 65) {
        credits = 50; // Pacote Básico
        console.log('Créditos mapeados por valor (Básico):', amountValue, '→', credits);
      }
    }

    if (credits === 0) {
      console.error('=== PRODUTO NÃO MAPEADO ===');
      console.error('Product ID:', productId);
      console.error('Product Name:', productName);
      console.error('Product Ref:', productRef);
      console.error('Amount:', amount);
      console.error('UTM Campaign:', body.utm_campaign);
      console.error('Todos os campos do body:', Object.keys(body));
      console.error('========================');
      return new Response('Product not found', { status: 400, headers: corsHeaders });
    }

    // Adicionar créditos ao usuário usando a função do banco
    const { data: result, error: creditError } = await supabase
      .rpc('add_credits_to_user', {
        p_user_id: user.id,
        p_credits: credits,
        p_transaction_id: body.transaction_id || body.id,
        p_description: `Compra de ${credits} créditos via Cakto`
      });

    if (creditError || !result) {
      console.error('Error adding credits:', creditError);
      return new Response('Error adding credits', { status: 500, headers: corsHeaders });
    }

    console.log('Successfully added credits to user:', userEmail, 'Credits:', credits);
    return new Response('Credits added successfully', { 
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