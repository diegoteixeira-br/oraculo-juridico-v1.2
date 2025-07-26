import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    // Extrair parâmetros da query string
    const url = new URL(req.url);
    const palavraChave = url.searchParams.get('palavraChave');
    const tribunal = url.searchParams.get('tribunal');

    // Validar parâmetro obrigatório
    if (!palavraChave) {
      return new Response(
        JSON.stringify({ 
          error: 'Parâmetro palavraChave é obrigatório',
          resultados: [] 
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Construir query para a API da LexML
    let query = palavraChave.trim();
    if (tribunal) {
      query += ` AND ${tribunal.trim()}`;
    }

    console.log(`Buscando jurisprudência: ${query}`);

    // Fazer requisição para a API da LexML
    const lexmlUrl = `https://www.lexml.gov.br/busca/search?query=${encodeURIComponent(query)}&format=json`;
    
    const response = await fetch(lexmlUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Oraculo-Juridico/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Erro na API LexML: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao consultar API LexML',
          resultados: [] 
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await response.json();
    console.log('Resposta da LexML recebida');

    // Processar resultados da LexML
    let resultados = [];
    
    if (data && data.response && data.response.docs && Array.isArray(data.response.docs)) {
      // Pegar apenas os 3 primeiros resultados
      const docs = data.response.docs.slice(0, 3);
      
      resultados = docs.map((doc: any) => ({
        titulo: doc.title_s || doc.titulo_s || 'Título não disponível',
        ementa: doc.ementa_s || doc.texto_s || doc.content_s || 'Ementa não disponível',
        link: doc.url_s || doc.link_s || doc.urn_s || '#'
      }));
    }

    console.log(`Retornando ${resultados.length} resultados`);

    return new Response(
      JSON.stringify({ 
        resultados,
        total: resultados.length,
        query: query
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Erro na função buscar-juris:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        resultados: [] 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});