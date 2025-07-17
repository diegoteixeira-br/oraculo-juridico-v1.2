import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, plan } = body;

    if (!email || !plan) {
      return new Response('Email and plan are required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Simular webhook data da Cakto
    const webhookData = {
      status: 'paid',
      customer_email: email,
      product_name: plan === 'basic' ? 'Pacote Básico 50 créditos-Oráculo Jurídico' : 'Pacote Premium 100 créditos-Oráculo Jurídico',
      amount: plan === 'basic' ? 59.90 : 97.00,
      transaction_id: `test_${Date.now()}`,
      webhook_secret: "8b02ef4d-a6a0-42e6-87f5-7e8e12e7fd17"
    };

    console.log('Testing webhook with data:', webhookData);

    // Chamar o webhook
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/cakto-webhook`;
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookData.webhook_secret,
      },
      body: JSON.stringify(webhookData),
    });

    const result = await response.text();
    console.log('Webhook response:', result);

    return new Response(JSON.stringify({
      success: response.ok,
      status: response.status,
      result: result,
      webhookData: webhookData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});