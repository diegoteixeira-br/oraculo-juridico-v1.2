import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const testEmail = body.test_email;

    console.log("Teste com Resend para:", testEmail);

    if (!testEmail) {
      return new Response(JSON.stringify({ error: "Email de teste é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Verificar se é o email verificado no Resend (apenas para testes)
    const verifiedEmail = "dieguinhoteixeira@gmail.com";
    if (testEmail !== verifiedEmail) {
      return new Response(JSON.stringify({ 
        error: `Para testes, use apenas o email verificado: ${verifiedEmail}`,
        note: "Após verificar seu domínio no Resend, poderá enviar para qualquer email"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Buscar template personalizado dos settings (se existir)
    let emailHTML = "";
    try {
      const { data: settings } = await supabase
        .from('landing_page_settings')
        .select('agenda_email_template')
        .limit(1)
        .single();
      
      if (settings?.agenda_email_template) {
        console.log("Usando template personalizado salvo");
        // Usar template personalizado com dados de exemplo
        emailHTML = settings.agenda_email_template;
        
        // Substituir variáveis do template
        const sampleData = {
          '{{SITE_NAME}}': 'Oráculo Jurídico',
          '{{USER_NAME}}': 'Usuário de Teste',
          '{{COMMITMENTS}}': `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="color: #2563eb; margin: 0 0 10px 0;">📅 Compromisso de Teste</h3>
              <p><strong>Data:</strong> ${new Date(Date.now() + 2*60*60*1000).toLocaleString('pt-BR')}</p>
              <p><strong>Local:</strong> Fórum Central (TESTE)</p>
              <p><strong>Processo:</strong> 0001234-56.2025.8.26.0000</p>
              <p><strong>Cliente:</strong> Cliente de Teste</p>
            </div>
          `
        };
        
        Object.entries(sampleData).forEach(([key, value]) => {
          emailHTML = emailHTML.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
      }
    } catch (error) {
      console.log("Erro ao buscar template personalizado, usando template padrão:", error);
    }
    
    // Se não encontrou template personalizado, usar template padrão
    if (!emailHTML) {
      console.log("Usando template padrão");
      emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Teste Agenda Jurídica</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">📅 Agenda Jurídica - Teste</h1>
          <p>Este é um email de teste do sistema de agenda jurídica.</p>
          <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>🎯 Teste Funcionou!</h3>
              <p>Se você está lendo esta mensagem, significa que:</p>
              <ul>
                  <li>✅ A função Supabase está funcionando</li>
                  <li>✅ A integração com Resend está ativa</li>
                  <li>✅ Os emails da agenda estão prontos para funcionar</li>
              </ul>
          </div>
          <p>Em breve você receberá automaticamente os resumos da sua agenda jurídica!</p>
          <hr style="margin: 30px 0;">
          <small style="color: #6b7280;">Este é um email automático do Oráculo Jurídico</small>
      </body>
      </html>`;
    }

    console.log("Enviando email via Resend...");

    // Enviar email via Resend usando o domínio padrão enquanto o personalizado não está verificado
    const { data, error } = await resend.emails.send({
      from: "Agenda Jurídica <onboarding@resend.dev>",
      to: [testEmail],
      subject: "📅 Teste - Agenda Jurídica Funcionando!",
      html: emailHTML,
    });

    if (error) {
      console.error("Erro do Resend:", error);
      throw new Error(`Falha no Resend: ${error.message}`);
    }

    console.log("Email enviado com sucesso:", data?.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: `✅ Email enviado com sucesso para ${testEmail}!`,
      email_id: data?.id,
      sent: 1,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error) {
    console.error("Erro completo:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Verifique se a RESEND_API_KEY está configurada"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});