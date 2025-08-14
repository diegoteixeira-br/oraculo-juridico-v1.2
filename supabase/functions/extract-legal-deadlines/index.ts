import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const openAIAssistantId = Deno.env.get('OPENAI_DEADLINE_ASSISTANT_ID');
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

    if (!openAIApiKey || !openAIAssistantId) {
      throw new Error('OpenAI API key or Assistant ID not configured');
    }

    console.log('Extracting deadlines from text for user:', userId);

    // Criar thread para o Assistant
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({}),
    });

    if (!threadResponse.ok) {
      throw new Error(`Failed to create thread: ${threadResponse.statusText}`);
    }

    const thread = await threadResponse.json();
    console.log('Thread created:', thread.id);

    // Obter data atual no fuso horário do Brasil
    const now = new Date();
    const brasiliaOffset = -3; // UTC-3
    const brasiliaTime = new Date(now.getTime() + (brasiliaOffset * 60 * 60 * 1000));
    const currentDateBrasilia = brasiliaTime.toISOString().split('T')[0];

    // Adicionar a mensagem ao thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: `Data atual para cálculo de prazos (horário de Brasília): ${currentDateBrasilia}
Instruções importantes:
- Use SEMPRE o formato ISO 8601 para datas: YYYY-MM-DD
- Para audiências/reuniões com horário específico, use: YYYY-MM-DDTHH:MM:SS
- Calcule prazos considerando dias úteis quando aplicável
- Use a data atual como referência para cálculos de prazo

Texto jurídico para análise:

${text}`,
      }),
    });

    if (!messageResponse.ok) {
      throw new Error(`Failed to add message: ${messageResponse.statusText}`);
    }

    // Executar o Assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: openAIAssistantId,
      }),
    });

    if (!runResponse.ok) {
      throw new Error(`Failed to run assistant: ${runResponse.statusText}`);
    }

    const run = await runResponse.json();
    console.log('Run started:', run.id);

    // Aguardar conclusão da execução
    let runStatus = run.status;
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos timeout

    while (runStatus === 'queued' || runStatus === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('Assistant run timeout');
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      
      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`, {
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log('Run status:', runStatus);
      }
      
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus}`);
    }

    // Buscar mensagens do thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      throw new Error(`Failed to get messages: ${messagesResponse.statusText}`);
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0]) {
      throw new Error('No response from assistant');
    }

    const aiResponse = assistantMessage.content[0].text.value;

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