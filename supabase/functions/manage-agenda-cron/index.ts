import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

interface UserNotificationConfig {
  user_id: string;
  email_time: string; // formato HH:MM
  timezone: string;
}

function timeStringToUTC(timeString: string, timezone: string): { hour: number; minute: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  
  let utcHour = hours;
  
  // Conversão para timezone brasileiro (UTC-3)
  if (timezone === 'America/Sao_Paulo') {
    utcHour = hours + 3; // Adiciona 3 horas para converter para UTC
    if (utcHour >= 24) utcHour -= 24;
  }
  
  return { hour: utcHour, minute: minutes };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    console.log("🚀 Análise de configurações de notificação...");

    // Buscar usuários que querem receber notificações com suas configurações
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select(`
        user_id, 
        timezone, 
        receber_notificacao_agenda,
        notification_settings(agenda_email_time, agenda_timezone)
      `)
      .eq('receber_notificacao_agenda', true);

    if (usersError) {
      console.error("Erro ao buscar usuários:", usersError);
      throw usersError;
    }

    console.log(`📊 Encontrados ${usersData?.length || 0} usuários ativos`);

    // Agrupar usuários por horário UTC para otimizar
    const groupedByTime: Record<string, UserNotificationConfig[]> = {};
    const analysis: any[] = [];

    for (const user of usersData || []) {
      const emailTime = user.notification_settings?.[0]?.agenda_email_time || '08:00';
      const timezone = user.timezone || user.notification_settings?.[0]?.agenda_timezone || 'America/Sao_Paulo';
      
      const { hour, minute } = timeStringToUTC(emailTime, timezone);
      const timeKey = `${minute.toString().padStart(2, '0')}-${hour.toString().padStart(2, '0')}`;
      
      if (!groupedByTime[timeKey]) {
        groupedByTime[timeKey] = [];
      }
      
      groupedByTime[timeKey].push({
        user_id: user.user_id,
        email_time: emailTime,
        timezone: timezone
      });

      analysis.push({
        user_id: user.user_id,
        local_time: emailTime,
        timezone: timezone,
        utc_time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        cron_group: timeKey
      });
    }

    // Análise de jobs necessários
    const requiredJobs = Object.entries(groupedByTime).map(([timeKey, users]) => {
      const [minute, hour] = timeKey.split('-').map(Number);
      return {
        timeKey,
        cronSchedule: `${minute} ${hour} * * *`,
        utcTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        userCount: users.length,
        users: users.map(u => ({ 
          user_id: u.user_id, 
          local_time: u.email_time, 
          timezone: u.timezone 
        }))
      };
    });

    console.log(`⏰ Necessários ${requiredJobs.length} grupos de horários únicos`);

    const response = {
      success: true,
      message: "Análise de configurações concluída",
      timestamp: new Date().toISOString(),
      statistics: {
        total_active_users: usersData?.length || 0,
        unique_time_slots: requiredJobs.length,
        timezone_distribution: analysis.reduce((acc: any, user) => {
          acc[user.timezone] = (acc[user.timezone] || 0) + 1;
          return acc;
        }, {})
      },
      required_cron_jobs: requiredJobs,
      user_analysis: analysis,
      recommendations: [
        "⚠️ Esta edge function faz apenas análise. Para implementar cron jobs automáticos:",
        "1. Configure um cron job único que chame daily-agenda-summary a cada hora",
        "2. A daily-agenda-summary já filtra usuários pelo horário correto",
        "3. Adicione lógica de timezone na daily-agenda-summary para envios precisos"
      ]
    };

    return new Response(JSON.stringify(response, null, 2), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("💥 Erro na análise:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error) 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});