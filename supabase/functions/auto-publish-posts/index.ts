import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[AUTO-PUBLISH] Verificando posts agendados para publicação...');

    // Executar a função de auto-publicação
    const { error } = await supabase.rpc('auto_publish_scheduled_posts');

    if (error) {
      console.error('[AUTO-PUBLISH] Erro ao executar auto-publicação:', error);
      throw error;
    }

    // Buscar posts que foram publicados para log
    const { data: recentlyPublished, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, title, scheduled_for')
      .eq('is_published', true)
      .not('scheduled_for', 'is', null)
      .gte('updated_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Últimos 5 minutos

    if (fetchError) {
      console.error('[AUTO-PUBLISH] Erro ao buscar posts publicados:', fetchError);
    } else {
      console.log(`[AUTO-PUBLISH] ${recentlyPublished?.length || 0} posts publicados automaticamente`);
      
      if (recentlyPublished && recentlyPublished.length > 0) {
        recentlyPublished.forEach(post => {
          console.log(`[AUTO-PUBLISH] Post publicado: "${post.title}" (agendado para: ${post.scheduled_for})`);
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        published_count: recentlyPublished?.length || 0,
        message: 'Auto-publicação executada com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[AUTO-PUBLISH] Erro na edge function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});