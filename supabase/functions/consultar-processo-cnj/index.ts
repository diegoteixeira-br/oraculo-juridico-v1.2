import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessoCNJ {
  numeroProcesso: string
  partes?: Array<{
    nome: string
    tipo: string
  }>
  movimentacoes?: Array<{
    dataMovimentacao: string
    descricao: string
    tipoMovimentacao?: string
  }>
  tribunal?: string
  grau?: string
  classe?: string
  assunto?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Iniciando consulta ao CNJ...')

    // Obter dados da requisição
    const { numeroProcesso } = await req.json()
    
    if (!numeroProcesso) {
      throw new Error('Número do processo é obrigatório')
    }

    console.log(`Consultando processo: ${numeroProcesso}`)

    // Obter credenciais da API CNJ dos secrets
    const cnjApiUrl = Deno.env.get('CNJ_API_URL')
    const cnjApiKey = Deno.env.get('CNJ_API_KEY')

    if (!cnjApiUrl || !cnjApiKey) {
      throw new Error('Credenciais da API CNJ não configuradas')
    }

    // Fazer requisição para a API do CNJ
    const response = await fetch(`${cnjApiUrl}/processos/${numeroProcesso}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `APIKey ${cnjApiKey}`,
        'Accept': 'application/json'
      }
    })

    console.log(`Status da resposta CNJ: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na API CNJ: ${response.status} - ${errorText}`)
      throw new Error(`Erro na consulta ao CNJ: ${response.status}`)
    }

    const dadosProcesso: ProcessoCNJ = await response.json()
    
    console.log('Processo encontrado com sucesso')

    // Formatear dados para retorno
    const processoFormatado = {
      numeroProcesso: dadosProcesso.numeroProcesso,
      tribunal: dadosProcesso.tribunal || 'Não informado',
      grau: dadosProcesso.grau || 'Não informado',
      classe: dadosProcesso.classe || 'Não informado',
      assunto: dadosProcesso.assunto || 'Não informado',
      partes: dadosProcesso.partes || [],
      movimentacoes: (dadosProcesso.movimentacoes || [])
        .sort((a, b) => new Date(b.dataMovimentacao).getTime() - new Date(a.dataMovimentacao).getTime())
        .slice(0, 3) // Últimas 3 movimentações
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processo: processoFormatado 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Erro na função consultar-processo-cnj:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor',
        details: 'Verifique se o número do processo está correto e se as credenciais da API CNJ estão configuradas'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})