import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { AgendaSummaryEmail } from "./_templates/agenda-summary.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agenda-secret",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
const AGENDA_SECRET = Deno.env.get("DAILY_AGENDA_SECRET") as string;
const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

// Util: group by user_id
function groupBy<T extends Record<string, any>>(rows: T[], key: keyof T) {
  return rows.reduce((acc: Record<string, T[]>, row: T) => {
    const k = String(row[key]);
    if (!acc[k]) acc[k] = [];
    acc[k].push(row);
    return acc;
  }, {});
}

async function renderEmailHTML(fullName: string, items: any[]) {
  return await renderAsync(
    React.createElement(AgendaSummaryEmail, { fullName, items })
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  let payload: any = {};
  try {
    if (req.body) payload = await req.json();
  } catch (_) {}

  const url = new URL(req.url);
  const qsSecret = url.searchParams.get("secret") ?? "";
  const isPreview = ["1", "true", "yes"].includes((url.searchParams.get("preview") ?? "").toLowerCase());

  const providedSecret = req.headers.get("x-agenda-secret") || payload.secret || qsSecret;
  const source = payload?.source ?? "manual";

  // Authorization strategy:
  // - Prefer DAILY_AGENDA_SECRET via header, body or query param
  // - Allow pg_cron scheduled calls (they set source="pg_cron" in the body via migration)
  const authorized = (AGENDA_SECRET && providedSecret === AGENDA_SECRET) || source === "pg_cron";

  // Preview endpoint: returns the HTML template for quick visual check
  if (isPreview) {
    if (!authorized) {
      return new Response("Unauthorized preview", {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "text/plain" },
      });
    }
    const now = new Date();
    const sampleItems = [
      { title: "Audiência de conciliação", commitment_date: new Date(now.getTime() + 2*60*60*1000), location: "Fórum Central", process_number: "0001234-56.2025.8.26.0000", client_name: "Maria Silva" },
      { title: "Prazo: contestação", commitment_date: new Date(now.getTime() + 6*60*60*1000), location: "", process_number: "0009876-54.2025.8.26.0000", client_name: "João Souza" },
    ];
    const html = await renderEmailHTML("Exemplo", sampleItems);
    return new Response(html, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/html" },
    });
  }

  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Get commitments for next 24h, pending status
    const { data: commitments, error: commitmentsError } = await supabase
      .from("legal_commitments")
      .select("user_id, title, commitment_date, location, process_number, client_name")
      .gte("commitment_date", now.toISOString())
      .lt("commitment_date", in24h.toISOString())
      .eq("status", "pendente");

    if (commitmentsError) throw commitmentsError;

    if (!commitments || commitments.length === 0) {
      return new Response(JSON.stringify({ message: "No commitments in next 24h", sent: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Filter users by profile flag and get timezone info
    const userIds = Array.from(new Set(commitments.map((c) => c.user_id)));
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, receber_notificacao_agenda, timezone")
      .in("user_id", userIds)
      .eq("receber_notificacao_agenda", true);

    if (profilesError) throw profilesError;

    const allowedUserIds = new Set((profiles ?? []).map((p) => p.user_id));
    const filtered = commitments.filter((c) => allowedUserIds.has(c.user_id));

    if (filtered.length === 0) {
      return new Response(JSON.stringify({ message: "No opted-in users to notify", sent: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get notification settings for users who have commitments
    const { data: notificationSettings } = await supabase
      .from("notification_settings") 
      .select("user_id, agenda_email_time, agenda_timezone")
      .in("user_id", Array.from(allowedUserIds));

    // Create timezone mapping for users
    const userTimezones = new Map<string, { emailTime: string; timezone: string }>();
    profiles?.forEach(profile => {
      const timezone = profile.timezone || 'America/Sao_Paulo';
      const settings = notificationSettings?.find(s => s.user_id === profile.user_id);
      const emailTime = settings?.agenda_email_time || '09:00';
      userTimezones.set(profile.user_id, { emailTime, timezone });
    });

    // Group by user
    const grouped = groupBy(filtered, "user_id");

    // Send emails
    const results: Record<string, any> = {};
    let sent = 0;

    for (const [userId, items] of Object.entries(grouped)) {
      try {
        const profile = profiles?.find(p => p.user_id === userId);
        const userTimeInfo = userTimezones.get(userId);
        const timezone = userTimeInfo?.timezone || 'America/Sao_Paulo';
        const emailTime = userTimeInfo?.emailTime || '09:00';
        
        // Format current time in user's timezone for display
        const userCurrentTime = new Intl.DateTimeFormat('pt-BR', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }).format(now);

        const { data: user } = await supabase.auth.admin.getUserById(userId);
        if (!user.user?.email) continue;

        const html = await renderEmailHTML(profile?.full_name || "", items as any[]);

        const { data, error } = await resend.emails.send({
          from: "Oráculo Jurídico <agenda@oracurojuridico.com.br>",
          to: [user.user.email],
          subject: `📅 Resumo da Agenda - ${userCurrentTime.split(' ')[0]} (${timezone.replace('America/', '').replace('_', ' ')})`,
          html,
        });

        if (error) throw error;
        results[userId] = { status: "sent", email_id: data?.id };
        sent++;
      } catch (e) {
        console.error("Error sending email to user", userId, e);
        results[userId] = { status: "email_exception", error: String(e) };
      }
    }

    return new Response(
      JSON.stringify({ processed_users: Object.keys(grouped).length, sent, results }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("daily-agenda-summary error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});