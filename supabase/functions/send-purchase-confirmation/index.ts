import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseConfirmationRequest {
  user_id: string;
  user_email: string;
  user_name: string;
  tokens_added: number;
  plan_type: string;
  transaction_id: string;
  purchase_type: 'subscription' | 'tokens';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      user_id, 
      user_email, 
      user_name, 
      tokens_added, 
      plan_type, 
      transaction_id,
      purchase_type 
    }: PurchaseConfirmationRequest = await req.json();

    console.log('Enviando confirmação de compra:', { user_email, tokens_added, plan_type, purchase_type });

    // Criar conteúdo do email baseado no tipo de compra
    let subject = "";
    let content = "";

    if (purchase_type === 'subscription') {
      subject = "✅ Assinatura Ativada - Oráculo Jurídico";
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Assinatura Ativada!</h1>
            <p style="color: #666; font-size: 18px;">Bem-vindo ao plano ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)}</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Detalhes da sua assinatura:</h2>
            <p><strong>Plano:</strong> ${plan_type.charAt(0).toUpperCase() + plan_type.slice(1)}</p>
            <p><strong>Tokens recebidos:</strong> ${tokens_added.toLocaleString('pt-BR')} tokens</p>
            <p><strong>ID da transação:</strong> ${transaction_id}</p>
          </div>

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #059669; margin-top: 0;">✨ Agora você tem acesso a:</h3>
            <ul style="color: #374151;">
              <li>🤖 Chat ilimitado com IA jurídica</li>
              <li>📅 Agenda jurídica avançada</li>
              <li>🧮 Calculadoras jurídicas especializadas</li>
              <li>📚 Biblioteca de documentos jurídicos</li>
              <li>📁 Gerenciamento de arquivos</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://oraculojuridico.com.br/dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Acessar Plataforma
            </a>
          </div>

          <p style="color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Se você tiver alguma dúvida, entre em contato conosco em contato@oraculojuridico.com.br
          </p>
        </div>
      `;
    } else {
      subject = "✅ Tokens Adicionados - Oráculo Jurídico";
      content = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">💎 Tokens Adicionados!</h1>
            <p style="color: #666; font-size: 18px;">Sua compra foi processada com sucesso</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Detalhes da compra:</h2>
            <p><strong>Tokens adicionados:</strong> ${tokens_added.toLocaleString('pt-BR')} tokens</p>
            <p><strong>ID da transação:</strong> ${transaction_id}</p>
          </div>

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #059669; margin-top: 0;">🚀 Continue aproveitando:</h3>
            <ul style="color: #374151;">
              <li>🤖 Chat com IA jurídica especializada</li>
              <li>📊 Análises e consultas personalizadas</li>
              <li>⚡ Respostas rápidas e precisas</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://oraculojuridico.com.br/chat" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Usar Tokens
            </a>
          </div>

          <p style="color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
            Se você tiver alguma dúvida, entre em contato conosco em contato@oraculojuridico.com.br
          </p>
        </div>
      `;
    }

    // Enviar email de confirmação
    const emailResponse = await resend.emails.send({
      from: "Oráculo Jurídico <contato@oraculojuridico.com.br>",
      to: [user_email],
      subject: subject,
      html: content,
    });

    console.log("Email de confirmação de compra enviado:", emailResponse);
    
    if (emailResponse.error) {
      console.error("Erro ao enviar confirmação de compra:", emailResponse.error);
      throw new Error(`Erro ao enviar email: ${emailResponse.error.message}`);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      email_id: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar confirmação de compra:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);