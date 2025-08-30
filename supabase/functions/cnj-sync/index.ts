import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { numero, userId } = await req.json();
    
    if (!numero || !userId) {
      return new Response(
        JSON.stringify({ error: "numero e userId são obrigatórios" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sincronizando processo ${numero} para usuário ${userId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // DataJud API call - formato simplificado para exemplo
    // Em produção, usar a API oficial do DataJud por tribunal
    const numeroLimpo = numero.replace(/\D/g, '');
    console.log(`Consultando DataJud para processo: ${numeroLimpo}`);

    // Simulação da consulta DataJud (substituir pela API real)
    const mockDataJudResponse = {
      dados: [{
        numeroProcesso: numero,
        tribunal: "TJ-SP",
        classe: "Procedimento Comum Cível",
        assunto: ["Danos morais", "Responsabilidade civil"],
        partes: {
          requerentes: ["João Silva"],
          requeridos: ["Maria Santos"]
        },
        movimentos: [
          {
            dataHora: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias no futuro
            descricao: "Audiência de instrução e julgamento designada para 05/02/2025 às 14:00",
            local: "Sala de Audiências 3"
          },
          {
            dataHora: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias no futuro
            descricao: "Prazo para manifestação sobre documentos juntados",
            local: null
          }
        ]
      }]
    };

    const meta = mockDataJudResponse?.dados?.[0];
    if (!meta) {
      return new Response(
        JSON.stringify({ ok: true, found: false, message: "Processo não encontrado no DataJud" }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert processo
    const { error: processoError } = await supabase
      .from('processos')
      .upsert([{
        numero_cnj: numero,
        tribunal: meta.tribunal,
        classe: meta.classe,
        assunto: meta.assunto || [],
        partes: meta.partes || null
      }], { 
        onConflict: 'numero_cnj',
        ignoreDuplicates: false 
      });

    if (processoError) {
      console.error('Erro ao inserir processo:', processoError);
      throw new Error(`Erro ao salvar processo: ${processoError.message}`);
    }

    // Vincular ao usuário
    const { error: vinculoError } = await supabase
      .from('processos_usuarios')
      .upsert([{ 
        user_id: userId, 
        processo_numero: numero 
      }], { 
        onConflict: 'user_id,processo_numero',
        ignoreDuplicates: true 
      });

    if (vinculoError) {
      console.error('Erro ao vincular processo:', vinculoError);
      throw new Error(`Erro ao vincular processo: ${vinculoError.message}`);
    }

    // Mapear movimentações → eventos
    const movimentos: any[] = meta.movimentos || [];
    const eventos = movimentos
      .map((m) => {
        const texto: string = m?.descricao || "";
        const dt = m?.dataHora ? new Date(m.dataHora) : null;
        
        // Detecção de tipo de evento
        const isAudiencia = /audi[eê]ncia/i.test(texto);
        const isPrazo = /prazo|intima[cç][aã]o|juntada|manifesta[cç][aã]o/i.test(texto);
        
        if (!dt || (!isAudiencia && !isPrazo)) return null;
        
        return {
          processo_numero: numero,
          user_id: userId,
          tipo: isAudiencia ? "audiencia" : "prazo",
          titulo: isAudiencia ? "Audiência" : "Prazo Processual",
          descricao: texto,
          local: m?.local || null,
          inicio: dt.toISOString()
        };
      })
      .filter(Boolean);

    let eventosCriados = 0;
    if (eventos.length > 0) {
      const { error: eventosError } = await supabase
        .from('eventos_processo')
        .insert(eventos);

      if (eventosError) {
        console.error('Erro ao inserir eventos:', eventosError);
        // Não falha se eventos já existem
        if (!eventosError.message.includes('duplicate')) {
          throw new Error(`Erro ao salvar eventos: ${eventosError.message}`);
        }
      } else {
        eventosCriados = eventos.length;
      }
    }

    console.log(`Sincronização concluída: ${eventosCriados} eventos criados`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        found: true, 
        eventosCriados,
        processo: {
          numero: numero,
          tribunal: meta.tribunal,
          classe: meta.classe
        }
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização CNJ:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});