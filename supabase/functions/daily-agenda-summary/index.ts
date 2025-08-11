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

    // Filter users by profile flag
    const userIds = Array.from(new Set(commitments.map((c) => c.user_id)));
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, full_name, receber_notificacao_agenda")
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

    const grouped = groupBy(filtered, "user_id");

    // Helper to get user email via Admin API
    async function getUserEmail(userId: string): Promise<string | null> {
      try {
        const { data, error } = await supabase.auth.admin.getUserById(userId);
        if (error) return null;
        return data.user?.email ?? null;
      } catch (_) {
        return null;
      }
    }

    let sent = 0;
    const results: Record<string, any> = {};

    for (const [userId, items] of Object.entries(grouped)) {
      const profile = profiles?.find((p) => p.user_id === userId);
      const email = await getUserEmail(userId);
      if (!email) {
        results[userId] = { status: "skipped_no_email", count: items.length };
        continue;
      }

      const html = await renderEmailHTML(profile?.full_name || "", items as any[]);

      try {
        const { error: emailError } = await resend.emails.send({
          from: "Cakto Agenda <onboarding@resend.dev>",
          to: [email],
          subject: "Resumo diário da sua agenda",
          html,
        });
        if (emailError) {
          results[userId] = { status: "email_error", error: String(emailError) };
        } else {
          sent += 1;
          results[userId] = { status: "sent", count: (items as any[]).length };
        }
      } catch (e) {
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
