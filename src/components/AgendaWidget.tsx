import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, AlertTriangle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const { user } = useAuth();
  const [weekCommitments, setWeekCommitments] = useState<LegalCommitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      const nextWeek = addDays(now, 7); // Próximos 7 dias

      const { data, error } = await supabase
        .from('legal_commitments' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .gte('commitment_date', now.toISOString())
        .lte('commitment_date', nextWeek.toISOString())
        .order('commitment_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setWeekCommitments((data as unknown as LegalCommitment[]) || []);
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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h4 className="font-semibold text-blue-200">Próximos 7 Dias</h4>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
        className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
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
            Nenhum compromisso nos próximos 7 dias
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
                  {format(parseISO(commitment.commitment_date), 'dd/MM - HH:mm', { locale: ptBR })}
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
      
      {weekCommitments.length === 5 && (
        <div className="text-center pt-2">
          <p className="text-xs text-blue-300/60">
            Mostrando os próximos 5 compromissos
          </p>
        </div>
      )}
      </div>
    </div>
  );
};

export default AgendaWidget;