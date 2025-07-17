import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, email, assunto, mensagem }: ContactEmailRequest = await req.json();

    console.log('Enviando email de contato:', { nome, email, assunto });

    // Enviar email para o suporte
    const emailResponse = await resend.emails.send({
      from: "Contato <nao-responda@oraculojuridico.com.br>",
      to: ["contato@oraculojuridico.com.br"],
      reply_to: email,
      subject: `[Contato] ${assunto}`,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Assunto:</strong> ${assunto}</p>
        <p><strong>Mensagem:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 10px;">
          ${mensagem.replace(/\n/g, '<br>')}
        </div>
      `,
    });

    console.log("Email para suporte enviado:", emailResponse);
    
    if (emailResponse.error) {
      console.error("Erro ao enviar email para suporte:", emailResponse.error);
      throw new Error(`Erro ao enviar email para suporte: ${emailResponse.error.message}`);
    }

    // Enviar confirmação para o usuário
    const confirmationResponse = await resend.emails.send({
      from: "Oráculo Jurídico <nao-responda@oraculojuridico.com.br>",
      to: [email],
      subject: "Mensagem recebida - Oráculo Jurídico",
      html: `
        <h1>Olá, ${nome}!</h1>
        <p>Recebemos sua mensagem sobre "<strong>${assunto}</strong>" e nossa equipe responderá o mais breve possível.</p>
        <p>Sua mensagem:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${mensagem.replace(/\n/g, '<br>')}
        </div>
        <p>Atenciosamente,<br>Equipe Oráculo Jurídico</p>
      `,
    });

    console.log("Email de confirmação enviado:", confirmationResponse);
    
    if (confirmationResponse.error) {
      console.error("Erro ao enviar confirmação:", confirmationResponse.error);
    }

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de contato:", error);
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