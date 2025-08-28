import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify admin access using the existing is_admin function
    const { data: authUser } = await supabaseClient.auth.getUser()
    if (!authUser.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_admin', {
      p_user_id: authUser.user.id
    });

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for additional data
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get users from auth.users
    const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get secure masked profile data using the new secure function
    const { data: maskedProfiles, error: profilesError } = await supabaseClient.rpc('get_admin_user_list');
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user roles
    const { data: roleRows, error: rolesError } = await adminClient.from('user_roles').select('user_id, role');
    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    // Create a map for quick lookups
    const profileMap = new Map(maskedProfiles?.map(p => [p.user_id, p]) || []);
    const roleMap = new Map();
    roleRows?.forEach(r => {
      if (!roleMap.has(r.user_id)) {
        roleMap.set(r.user_id, []);
      }
      roleMap.get(r.user_id).push(r.role);
    });

    // Combine data with masked sensitive information
    const enrichedUsers = users.users.map(user => {
      const profile = profileMap.get(user.id);
      const roles = roleMap.get(user.id) || [];
      
      return {
        id: user.id,
        email: user.email,
        name: profile?.masked_full_name || 'Unknown', // Masked name
        cpf: profile?.masked_cpf || null, // Masked CPF
        role: roles.length > 0 ? roles[0] : 'user',
        is_active: profile?.is_active ?? true,
        tokens: profile?.tokens || 0,
        plan_type: profile?.plan_type || 'gratuito',
        created_at: profile?.created_at || user.created_at,
        subscription_activated_at: profile?.subscription_activated_at
      };
    });

    return new Response(
      JSON.stringify(enrichedUsers),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in admin-list-users-secure:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})