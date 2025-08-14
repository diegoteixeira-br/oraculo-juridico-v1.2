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
    console.log('Starting image text extraction...');
    
    const formData = await req.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      throw new Error('No image provided');
    }

    if (!image.type || !image.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    console.log(`Processing image: ${image.name}, size: ${image.size} bytes`);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Converter imagem para base64
    const arrayBuffer = await image.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const dataUrl = `data:${image.type};base64,${base64}`;

    // Usar GPT-4 Vision para extrair texto da imagem
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
            content: 'Você é um especialista em OCR para documentos jurídicos brasileiros. Extraia TODO o texto visível na imagem, mantendo a formatação e estrutura original. Preste atenção especial a datas, números de processo, nomes e prazos.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Por favor, extraia todo o texto visível nesta imagem de documento jurídico. Mantenha a formatação original e seja preciso com datas, números e nomes. Retorne apenas o texto extraído, sem comentários adicionais.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const extractedText = data.choices[0].message.content || '';

    console.log(`Successfully extracted text from image (${extractedText.length} characters)`);

    return new Response(
      JSON.stringify({
        success: true,
        text: extractedText,
        filename: image.name,
        size: image.size,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in extract-text-from-image:', error);
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