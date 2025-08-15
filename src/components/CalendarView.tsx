import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, getDate, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface CalendarViewProps {
  filteredCommitments?: LegalCommitment[];
  onCommitmentSelect?: (commitment: LegalCommitment) => void;
  showActions?: boolean;
}

const CalendarView = ({ filteredCommitments, onCommitmentSelect, showActions = false }: CalendarViewProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [commitments, setCommitments] = useState<LegalCommitment[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Use filteredCommitments if provided, otherwise load our own
  const displayCommitments = filteredCommitments || commitments;

  useEffect(() => {
    if (user?.id && !filteredCommitments) {
      loadCommitments();
    }
  }, [user?.id, currentMonth, filteredCommitments]);

  const loadCommitments = async () => {
    if (!user) return;
    const isRefresh = refreshing;
    if (!isRefresh) setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      // Query otimizada usando índices criados
      const { data, error } = await supabase
        .from('legal_commitments' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .gte('commitment_date', monthStart.toISOString())
        .lte('commitment_date', monthEnd.toISOString())
        .order('commitment_date', { ascending: true })
        .limit(100); // Limitar resultados para melhor performance

      if (error) throw error;
      setCommitments(data as unknown as LegalCommitment[] || []);
    } catch (error) {
      console.error('Erro ao carregar compromissos:', error);
    } finally {
      if (!isRefresh) setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCommitments();
  };

  const getCommitmentColor = (type: string, priority: string) => {
    if (priority === 'urgente') return 'bg-red-500';
    if (priority === 'alta') return 'bg-orange-500';
    switch (type) {
      case 'prazo_processual':
        return 'bg-blue-500';
      case 'audiencia':
        return 'bg-red-500';
      case 'reuniao':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const typeLabels = {
    'prazo_processual': 'Prazo',
    'audiencia': 'Audiência',
    'reuniao': 'Reunião',
    'personalizado': 'Personalizado'
  };

  const priorityLabels = {
    'baixa': 'Baixa',
    'normal': 'Normal',
    'alta': 'Alta',
    'urgente': 'Urgente'
  };

  const getCommitmentsForDate = (date: Date) => {
    return displayCommitments.filter(c => isSameDay(parseISO(c.commitment_date), date));
  };

  const selectedDateCommitments = getCommitmentsForDate(selectedDate);

  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    const days = [];
    let currentDate = calendarStart;
    
    while (currentDate <= calendarEnd) {
      const day = currentDate;
      const dayCommitments = getCommitmentsForDate(day);
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
      const isToday = isSameDay(day, new Date());
      const isSelected = isSameDay(day, selectedDate);
      const hasCommitments = dayCommitments.length > 0;
      
      days.push(
        <button
          key={day.toISOString()}
          onClick={() => setSelectedDate(day)}
          className={`
            relative p-2 text-sm h-12 w-full border border-slate-600/30 transition-colors
            ${isCurrentMonth ? 'text-white' : 'text-slate-500'}
            ${isToday ? 'bg-primary/20 border-primary/50 font-bold' : ''}
            ${isSelected ? 'bg-blue-600/30 border-blue-500' : 'hover:bg-slate-700/50'}
            ${!isCurrentMonth ? 'bg-slate-800/30' : ''}
          `}
        >
          <span>{getDate(day)}</span>
          {hasCommitments && (
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              {dayCommitments.slice(0, 3).map((commitment) => (
                <div
                  key={commitment.id}
                  className={`w-1.5 h-1.5 rounded-full ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`}
                />
              ))}
              {dayCommitments.length > 3 && (
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              )}
            </div>
          )}
        </button>
      );
      currentDate = addDays(currentDate, 1);
    }
    return days;
  };

  const CalendarHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-200">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        {!filteredCommitments && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10"
            title="Atualizar compromissos"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-blue-300">Carregando agenda...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-slate-400 py-1">
            {day}
          </div>
        ))}
      </div>
      
      {/* Grade do calendário */}
      <div className="grid grid-cols-7 bg-slate-800/30 rounded-lg overflow-hidden flex-1 min-h-0">
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default CalendarView;