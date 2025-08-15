import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") as string;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

interface CronJobData {
  user_id: string;
  email_time: string; // formato HH:MM
  timezone: string;
}

function timeStringToUTC(timeString: string, timezone: string): { hour: number; minute: number } {
  // Convert time string (HH:MM) to UTC considering timezone
  // Simplificação: para horário de Brasília, subtraímos 3 horas no UTC
  // Para uma implementação completa, seria necessário usar uma lib de timezone
  const [hours, minutes] = timeString.split(':').map(Number);
  
  let utcHour = hours;
  
  // Conversão simplificada para timezone brasileiro (UTC-3)
  if (timezone === 'America/Sao_Paulo') {
    utcHour = hours + 3; // Adiciona 3 horas para converter para UTC
    if (utcHour >= 24) utcHour -= 24;
  }
  
  return { hour: utcHour, minute: minutes };
}

async function cleanupOldCronJobs(supabase: any) {
  console.log("🧹 Limpando cron jobs antigos...");
  
  try {
    // Buscar todos os jobs de agenda existentes
    const { data: existingJobs, error } = await supabase.rpc('exec_sql', {
      sql: "SELECT jobname FROM cron.job WHERE jobname LIKE 'daily-agenda-%'"
    });

    if (error) {
      console.error("Erro ao buscar jobs existentes:", error);
      return;
    }

    // Remover cada job
    if (existingJobs && existingJobs.length > 0) {
      for (const job of existingJobs) {
        try {
          await supabase.rpc('exec_sql', {
            sql: `SELECT cron.unschedule('${job.jobname}')`
          });
          console.log(`✅ Removido: ${job.jobname}`);
        } catch (e) {
          console.log(`⚠️ Falha ao remover ${job.jobname}:`, e);
        }
      }
    }
  } catch (error) {
    console.error("Erro durante limpeza:", error);
  }
}

async function createCronJobsForActiveUsers(supabase: any) {
  console.log("🔄 Criando novos cron jobs...");

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
  const groupedByTime: Record<string, CronJobData[]> = {};

  for (const user of usersData || []) {
    const emailTime = user.notification_settings?.[0]?.agenda_email_time || '08:00';
    const timezone = user.timezone || user.notification_settings?.[0]?.agenda_timezone || 'America/Sao_Paulo';
    
    const { hour, minute } = timeStringToUTC(emailTime, timezone);
    const timeKey = `${minute}-${hour}`;
    
    if (!groupedByTime[timeKey]) {
      groupedByTime[timeKey] = [];
    }
    
    groupedByTime[timeKey].push({
      user_id: user.user_id,
      email_time: emailTime,
      timezone: timezone
    });
  }

  console.log(`⏰ Criando ${Object.keys(groupedByTime).length} grupos de horários únicos`);

  // Criar um cron job para cada horário único
  for (const [timeKey, users] of Object.entries(groupedByTime)) {
    const [minute, hour] = timeKey.split('-').map(Number);
    const jobName = `daily-agenda-${timeKey}-${Date.now()}`;
    
    // Cron schedule: minuto hora * * * (daily)
    const cronSchedule = `${minute} ${hour} * * *`;
    
    const cronSQL = `
      SELECT cron.schedule(
        '${jobName}',
        '${cronSchedule}',
        $$
        SELECT net.http_post(
          url := 'https://uujoxoxsbvhcmcgfvpvi.supabase.co/functions/v1/daily-agenda-summary',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}"}'::jsonb,
          body := '{"source": "pg_cron", "scheduled_time": "${timeKey}"}'::jsonb
        ) as request_id;
        $$
      );
    `;

    try {
      await supabase.rpc('exec_sql', { sql: cronSQL });
      console.log(`✅ Criado job "${jobName}" para ${users.length} usuários às ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} UTC`);
    } catch (error) {
      console.error(`❌ Erro ao criar job "${jobName}":`, error);
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  try {
    console.log("🚀 Iniciando gerenciamento de cron jobs da agenda...");

    // Etapa 1: Limpar jobs antigos
    await cleanupOldCronJobs(supabase);

    // Etapa 2: Criar novos jobs baseados nas configurações atuais
    await createCronJobsForActiveUsers(supabase);

    console.log("✨ Gerenciamento de cron jobs concluído com sucesso!");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Cron jobs atualizados com sucesso",
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    console.error("💥 Erro no gerenciamento de cron jobs:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: String(error) 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});