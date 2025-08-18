import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";

interface LegalCommitment {
  id: string;
  title: string;
  description?: string;
  commitment_type: 'prazo_processual' | 'audiencia' | 'reuniao' | 'personalizado';
  commitment_date: string;
  location?: string;
  process_number?: string;
  client_name?: string;
  status: 'pendente' | 'concluido' | 'cancelado';
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
}

const AgendaWidget = () => {
  const { user, profile } = useAuth();
  const [weekCommitments, setWeekCommitments] = useState<LegalCommitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const userTimezone = (profile as any)?.timezone || 'America/Sao_Paulo';

  useEffect(() => {
    if (user?.id) {
      loadWeekCommitments();
    }
  }, [user?.id]);

  const loadWeekCommitments = async () => {
    if (!user) return;
    
    const isRefresh = refreshing;
    if (!isRefresh) setLoading(true);
    
    try {
      const now = new Date();
      const nextWeek = addDays(now, 30); // Próximos 30 dias para garantir que apareça

      const { data, error } = await supabase
        .from('legal_commitments' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .gte('commitment_date', now.toISOString())
        .lte('commitment_date', nextWeek.toISOString())
        .order('commitment_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      
      // Aplicar ordenação local adicional para tratar 00:00 como final do dia
      const sortedData = (data as unknown as LegalCommitment[])?.sort((a, b) => {
        const dateA = parseISO(a.commitment_date);
        const dateB = parseISO(b.commitment_date);
        
        // Se forem dias diferentes, usar ordenação normal
        const dayA = format(dateA, 'yyyy-MM-dd');
        const dayB = format(dateB, 'yyyy-MM-dd');
        if (dayA !== dayB) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // Se forem o mesmo dia, aplicar lógica especial para horários
        const hourA = dateA.getHours();
        const hourB = dateB.getHours();
        
        // Tratar 00:00 como final do dia (24:00)
        const adjustedHourA = hourA === 0 ? 24 : hourA;
        const adjustedHourB = hourB === 0 ? 24 : hourB;
        
        if (adjustedHourA !== adjustedHourB) {
          return adjustedHourA - adjustedHourB;
        }
        
        return dateA.getMinutes() - dateB.getMinutes();
      }) || [];
      
      setWeekCommitments(sortedData);
      
      console.log('Compromissos carregados:', data?.length || 0);
      console.log('Período:', now.toISOString(), 'até', nextWeek.toISOString());
    } catch (error) {
      console.error('Erro ao carregar compromissos da semana:', error);
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWeekCommitments();
  };

  const getCommitmentColor = (type: string, priority: string) => {
    if (priority === 'urgente') return 'bg-red-500';
    if (priority === 'alta') return 'bg-orange-500';
    
    switch (type) {
      case 'prazo_processual': return 'bg-blue-500';
      case 'audiencia': return 'bg-red-500';
      case 'reuniao': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const typeLabels = {
    'prazo_processual': 'Prazo',
    'audiencia': 'Audiência',
    'reuniao': 'Reunião',
    'personalizado': 'Personalizado'
  };

  // Componente de header com botão de refresh
  const AgendaHeader = () => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-400" />
        <h4 className="font-medium text-sm text-blue-200">Próximos 30 Dias</h4>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
        className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
        title="Atualizar compromissos"
      >
        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );

  const priorityLabels = {
    'baixa': 'Baixa',
    'normal': 'Normal',
    'alta': 'Alta',
    'urgente': 'Urgente'
  };

  if (loading) {
    return (
      <div>
        <AgendaHeader />
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-sm text-blue-300">Carregando compromissos...</span>
        </div>
      </div>
    );
  }

  if (weekCommitments.length === 0) {
    return (
      <div>
        <AgendaHeader />
        <div className="text-center py-6">
          <Calendar className="w-12 h-12 text-blue-400/50 mx-auto mb-3" />
          <p className="text-sm text-blue-300/80">
            Nenhum compromisso nos próximos 30 dias
          </p>
          <p className="text-xs text-blue-300/60 mt-1">
            Sua agenda está livre!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AgendaHeader />
      <div className="space-y-3">
      {weekCommitments.map((commitment) => (
        <div key={commitment.id} className="flex items-start space-x-3 p-3 rounded-lg bg-blue-600/10 border border-blue-500/20">
          <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-sm text-blue-200 truncate">{commitment.title}</h4>
                <p className="text-xs text-blue-300/80 flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  {formatInTimeZone(parseISO(commitment.commitment_date), userTimezone, 'dd/MM - HH:mm', { locale: ptBR })}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                  {typeLabels[commitment.commitment_type]}
                </Badge>
                {commitment.priority !== 'normal' && (
                  <Badge 
                    variant={commitment.priority === 'urgente' ? 'destructive' : 'default'} 
                    className="text-xs"
                  >
                    {priorityLabels[commitment.priority]}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-blue-300/70">
              {commitment.process_number && (
                <span className="truncate">Processo: {commitment.process_number}</span>
              )}
              {commitment.client_name && (
                <span className="truncate">Cliente: {commitment.client_name}</span>
              )}
              {commitment.location && (
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {commitment.location}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {weekCommitments.length === 10 && (
        <div className="text-center pt-2">
          <p className="text-xs text-blue-300/60">
            Mostrando os próximos 10 compromissos
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default AgendaWidget;