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

    // Para demonstração, retornamos um texto simulado de decisão judicial
    const placeholderText = `
DOCUMENTO PDF CARREGADO: ${file.name}

Cite-se a parte requerida para, querendo, apresentar contestação no prazo de 15 (quinze) dias úteis.

Designo audiência de conciliação para o dia 15/09/2025, às 14h00, na sala 201 deste Fórum.

Intimem-se as partes.

Cuiabá, 14 de agosto de 2025.
Juiz(a) de Direito
    `.trim();

    console.log(`Successfully extracted text (${placeholderText.length} characters)`);

    return new Response(
      JSON.stringify({
        success: true,
        text: placeholderText,
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