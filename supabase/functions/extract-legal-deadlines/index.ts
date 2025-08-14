import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface DeadlineExtractRequest {
  text: string;
  userId: string;
}

interface ExtractedDeadline {
  title: string;
  description: string;
  commitmentType: 'prazo_processual' | 'audiencia' | 'reuniao' | 'personalizado';
  deadlineType?: 'recursal' | 'contestacao' | 'replicas' | 'outras';
  commitmentDate: string;
  endDate?: string;
  location?: string;
  isVirtual?: boolean;
  processNumber?: string;
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, userId }: DeadlineExtractRequest = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Extracting deadlines from text for user:', userId);

    // Prompt especializado para extração de prazos jurídicos brasileiros
    const prompt = `
Você é um especialista em direito processual civil brasileiro. Analise o texto fornecido e extraia TODOS os prazos processuais, audiências e compromissos jurídicos mencionados.

REGRAS IMPORTANTES:
1. Considere APENAS o Novo CPC (Lei 13.105/2015)
2. Para prazos em dias úteis, conte apenas os dias de segunda a sexta-feira, excluindo feriados
3. Identifique o tipo exato do prazo (recursal, contestação, tréplica, etc.)
4. Para audiências, extraia data, hora e tipo
5. Se não houver data específica, calcule baseado na data atual: ${new Date().toISOString().split('T')[0]}

TIPOS DE PRAZOS COMUNS:
- Contestação: 15 dias úteis
- Recursal: 15 dias úteis 
- Tréplica: 15 dias úteis
- Manifestação sobre documentos: 15 dias úteis
- Impugnação ao valor da causa: 15 dias úteis
- Cumprimento de sentença: conforme determinado

Retorne um JSON válido com array de objetos contendo:
{
  "deadlines": [
    {
      "title": "Título claro do compromisso",
      "description": "Descrição detalhada extraída do texto",
      "commitmentType": "prazo_processual" | "audiencia" | "reuniao" | "personalizado",
      "deadlineType": "recursal" | "contestacao" | "replicas" | "outras" (apenas para prazos processuais),
      "commitmentDate": "YYYY-MM-DD" | "YYYY-MM-DDTHH:MM:SS",
      "endDate": "YYYY-MM-DD" (opcional, para audiências com duração),
      "location": "Local da audiência" (opcional),
      "isVirtual": true/false (opcional),
      "processNumber": "Número do processo se mencionado",
      "priority": "baixa" | "normal" | "alta" | "urgente"
    }
  ]
}

TEXTO PARA ANÁLISE:
${text}
`;

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
            content: 'Você é um especialista em direito processual civil brasileiro. Sempre retorne JSON válido.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('AI Response:', aiResponse);

    let extractedData;
    try {
      // Remove markdown code blocks if present
      let cleanResponse = aiResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      extractedData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', aiResponse);
      throw new Error('Invalid response format from AI');
    }

    // Validar e processar os prazos extraídos
    const validDeadlines = extractedData.deadlines?.filter((deadline: any) => {
      return deadline.title && deadline.commitmentDate && deadline.commitmentType;
    }) || [];

    console.log(`Found ${validDeadlines.length} valid deadlines`);

    // Salvar no banco de dados se houver prazos válidos
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    const savedDeadlines = [];

    for (const deadline of validDeadlines) {
      try {
        const { data: saved, error } = await supabase
          .from('legal_commitments')
          .insert({
            user_id: userId,
            title: deadline.title,
            description: deadline.description,
            commitment_type: deadline.commitmentType,
            deadline_type: deadline.deadlineType,
            commitment_date: deadline.commitmentDate,
            end_date: deadline.endDate,
            location: deadline.location,
            is_virtual: deadline.isVirtual || false,
            process_number: deadline.processNumber,
            priority: deadline.priority || 'normal',
            auto_detected: true,
            extracted_text: text,
            status: 'pendente'
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving deadline:', error);
        } else {
          savedDeadlines.push(saved);
          console.log('Saved deadline:', saved.title);
        }
      } catch (saveError) {
        console.error('Error saving individual deadline:', saveError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deadlinesFound: validDeadlines.length,
        deadlinesSaved: savedDeadlines.length,
        deadlines: savedDeadlines,
        extractedText: text
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in extract-legal-deadlines function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});