import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
    const { text, voice, speed } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    // Calcular tokens necessários baseado no tamanho do texto
    // OpenAI cobra por caractere: tts-1-hd = $0.030 por 1K caracteres
    // Vamos converter para tokens: 1 token ≈ 4 caracteres, então 1K chars ≈ 250 tokens
    const textLength = text.length
    const tokensNeeded = Math.ceil(textLength / 4) // 1 token por 4 caracteres aproximadamente
    
    console.log(`Text-to-speech request: ${textLength} characters, ${tokensNeeded} tokens needed`)

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    // Criar cliente Supabase para verificar usuário e descontar tokens
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !userData.user) {
      throw new Error('Invalid authentication token')
    }

    const userId = userData.user.id
    console.log(`User ${userId} requesting text-to-speech for ${tokensNeeded} tokens`)

    // Verificar se o usuário tem tokens suficientes
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('daily_tokens, plan_tokens')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      throw new Error('Unable to fetch user profile')
    }

    const totalTokens = (profile.daily_tokens || 0) + (profile.plan_tokens || 0)
    if (totalTokens < tokensNeeded) {
      throw new Error(`Insufficient tokens. Need ${tokensNeeded}, have ${totalTokens}`)
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Generate speech from text
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text,
        voice: voice || 'alloy',
        response_format: 'mp3',
        speed: speed || 1.0
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    // Descontar tokens do usuário usando a função existente
    const { error: tokenError } = await supabaseClient.rpc('use_tokens', {
      p_user_id: userId,
      p_tokens: tokensNeeded,
      p_description: `Text-to-speech: ${textLength} caracteres`
    })

    if (tokenError) {
      console.error('Error deducting tokens:', tokenError)
      throw new Error('Failed to deduct tokens from user account')
    }

    console.log(`Successfully deducted ${tokensNeeded} tokens from user ${userId}`)

    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Process in chunks to avoid stack overflow
    let binaryString = ''
    const chunkSize = 32768
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      binaryString += String.fromCharCode.apply(null, Array.from(chunk))
    }
    const base64Audio = btoa(binaryString)

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        tokensUsed: tokensNeeded,
        charactersProcessed: textLength
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Text-to-speech error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})