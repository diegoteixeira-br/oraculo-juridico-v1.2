import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
  });
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const { data: isAdmin } = await adminClient.rpc('is_admin', { p_user_id: user.id });
    if (!isAdmin) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const { documentId, userIds } = await req.json();
    if (!documentId || !Array.isArray(userIds))
      return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const { data: doc, error: docErr } = await adminClient.from('documents_library').select('id,title').eq('id', documentId).maybeSingle();
    if (docErr || !doc) throw new Error('Documento não encontrado');

    for (const uid of userIds) {
      // in-app notification
      await adminClient.from('notifications').insert({ user_id: uid, title: 'Novo documento compartilhado', body: `Você recebeu acesso ao documento: ${doc.title}` });

      if (resend) {
        const { data: usr } = await adminClient.auth.admin.getUserById(uid);
        if (usr?.user?.email) {
          try {
            await resend.emails.send({
              from: "Cakto <no-reply@resend.dev>",
              to: [usr.user.email],
              subject: `Novo documento: ${doc.title}`,
              html: `<p>Um novo documento foi compartilhado com você.</p><p>Título: <strong>${doc.title}</strong></p>`
            });
          } catch (e) {
            console.error('Resend error', e);
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
