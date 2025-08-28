import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // listar usuários via Admin API
    const { data: usersPage } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

    // Use secure function to get masked profile data
    const { data: profiles, error: profilesError } = await authClient.rpc('get_admin_user_list');
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const roleRows = await adminClient.from('user_roles').select('user_id, role');

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    const roleMap = new Map((roleRows.data || []).filter((r: any) => r.role === 'admin').map((r: any) => [r.user_id, 'admin']));

    const users = (usersPage?.users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      name: profileMap.get(u.id)?.masked_full_name, // Use masked name for security
      cpf: profileMap.get(u.id)?.masked_cpf, // Include masked CPF
      is_active: profileMap.get(u.id)?.is_active ?? true,
      role: roleMap.get(u.id) || 'user',
      tokens: profileMap.get(u.id)?.tokens || 0,
      plan_type: profileMap.get(u.id)?.plan_type || 'gratuito',
      subscription_activated_at: profileMap.get(u.id)?.subscription_activated_at,
    }));

    return new Response(JSON.stringify({ users }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
