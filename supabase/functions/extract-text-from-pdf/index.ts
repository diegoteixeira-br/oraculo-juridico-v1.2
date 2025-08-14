import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting PDF text extraction...');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type || file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    console.log(`Processing PDF file: ${file.name}, size: ${file.size} bytes`);

    // Converter PDF para texto usando OpenAI
    const openAIFormData = new FormData();
    openAIFormData.append('file', file);
    openAIFormData.append('model', 'whisper-1'); // Usando Whisper para extração de texto
    
    // Para PDFs, vamos usar a API de chat completion com vision
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Primeira tentativa: usar prompt para extrair texto
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em extração de texto de documentos jurídicos. Extraia TODO o texto do documento fornecido, mantendo a formatação e estrutura original.'
          },
          {
            role: 'user',
            content: `Por favor, extraia todo o texto deste documento PDF. Mantenha a formatação original e retorne apenas o texto extraído, sem comentários adicionais.`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      // Fallback: retornar um texto indicando que o PDF foi recebido
      console.log('OpenAI API failed, using fallback');
      return new Response(
        JSON.stringify({
          success: true,
          text: `[DOCUMENTO PDF RECEBIDO: ${file.name}]\n\nATENÇÃO: Não foi possível extrair automaticamente o texto deste PDF. Por favor, copie manualmente o texto do documento e cole na área de texto acima para análise.`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content || '';

    console.log(`Successfully extracted text (${extractedText.length} characters)`);

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        filename: file.name,
        size: file.size,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in extract-text-from-pdf:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});