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

    // Validar e mapear vozes para as vozes válidas da OpenAI
    const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    const selectedVoice = validVoices.includes(voice) ? voice : 'alloy'
    
    console.log(`Voice requested: ${voice}, using: ${selectedVoice}`)

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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    // Dividir texto em chunks se for muito longo (limite da OpenAI é 4096 caracteres)
    const maxChunkSize = 4000 // Deixar margem de segurança
    const chunks = []
    
    if (text.length <= maxChunkSize) {
      chunks.push(text)
    } else {
      // Dividir por frases para manter o contexto
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
      let currentChunk = ''
      
      for (const sentence of sentences) {
        const sentenceWithPunctuation = sentence.trim() + '.'
        if ((currentChunk + sentenceWithPunctuation).length <= maxChunkSize) {
          currentChunk += (currentChunk ? ' ' : '') + sentenceWithPunctuation
        } else {
          if (currentChunk) {
            chunks.push(currentChunk)
            currentChunk = sentenceWithPunctuation
          } else {
            // Se uma única frase for muito longa, dividir por caracteres
            for (let i = 0; i < sentenceWithPunctuation.length; i += maxChunkSize) {
              chunks.push(sentenceWithPunctuation.slice(i, i + maxChunkSize))
            }
          }
        }
      }
      if (currentChunk) {
        chunks.push(currentChunk)
      }
    }

    console.log(`Text-to-speech request: ${text.length} characters divided into ${chunks.length} chunks`)

    // Calcular tokens necessários baseado no tamanho total do texto (removendo limitação artificial)
    const tokensNeeded = Math.ceil(text.length / 10) // Reduzir custo por token para textos longos

    // Verificar se o usuário tem tokens suficientes
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('plan_tokens, tokens')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      throw new Error('Unable to fetch user profile')
    }

    const totalTokens = (profile.tokens || 0) + (profile.plan_tokens || 0)
    if (totalTokens < tokensNeeded) {
      throw new Error(`Insufficient tokens. Need ${tokensNeeded}, have ${totalTokens}`)
    }

    console.log(`User ${userId} requesting text-to-speech for ${tokensNeeded} tokens`)

    // Gerar áudio para cada chunk e concatenar
    const audioChunks = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`Processing chunk ${i + 1}/${chunks.length}: ${chunk.length} characters`)
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: chunk,
          voice: selectedVoice,
          response_format: 'mp3',
          speed: speed || 1.0
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `Failed to generate speech for chunk ${i + 1}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      audioChunks.push(new Uint8Array(arrayBuffer))
    }

    // Concatenar todos os chunks de áudio
    const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const combinedAudio = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of audioChunks) {
      combinedAudio.set(chunk, offset)
      offset += chunk.length
    }

    // Descontar tokens do usuário usando a função existente
    const { error: tokenError } = await supabaseClient.rpc('use_tokens', {
      p_user_id: userId,
      p_tokens: tokensNeeded,
      p_description: `Text-to-speech: ${text.length} caracteres em ${chunks.length} chunks`
    })

    if (tokenError) {
      console.error('Error deducting tokens:', tokenError)
      throw new Error('Failed to deduct tokens from user account')
    }

    console.log(`Successfully deducted ${tokensNeeded} tokens from user ${userId}`)

    // Convert audio buffer to base64
    let binaryString = ''
    const chunkSize = 32768
    for (let i = 0; i < combinedAudio.length; i += chunkSize) {
      const chunk = combinedAudio.slice(i, i + chunkSize)
      binaryString += String.fromCharCode.apply(null, Array.from(chunk))
    }
    const base64Audio = btoa(binaryString)

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        tokensUsed: tokensNeeded,
        charactersProcessed: text.length,
        chunksProcessed: chunks.length
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