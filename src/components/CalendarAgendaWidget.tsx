import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, RefreshCw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, getDate, getDaysInMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
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
const CalendarAgendaWidget = () => {
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [commitments, setCommitments] = useState<LegalCommitment[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (user?.id) {
      loadCommitments();
    }
  }, [user?.id, currentMonth]);
  const loadCommitments = async () => {
    if (!user) return;
    const isRefresh = refreshing;
    if (!isRefresh) setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const {
        data,
        error
      } = await supabase.from('legal_commitments' as any).select('*').eq('user_id', user.id).eq('status', 'pendente').gte('commitment_date', monthStart.toISOString()).lte('commitment_date', monthEnd.toISOString()).order('commitment_date', {
        ascending: true
      });
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
    return commitments.filter(c => isSameDay(parseISO(c.commitment_date), date));
  };
  const selectedDateCommitments = getCommitmentsForDate(selectedDate);
  const renderCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, {
      weekStartsOn: 0
    });
    const calendarEnd = endOfWeek(monthEnd, {
      weekStartsOn: 0
    });
    const days = [];
    let currentDate = calendarStart;
    while (currentDate <= calendarEnd) {
      const day = currentDate;
      const dayCommitments = getCommitmentsForDate(day);
      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
      const isToday = isSameDay(day, new Date());
      const isSelected = isSameDay(day, selectedDate);
      const hasCommitments = dayCommitments.length > 0;
      days.push(<button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={`
            relative p-2 text-sm h-12 w-full border border-slate-600/30 transition-colors
            ${isCurrentMonth ? 'text-white' : 'text-slate-500'}
            ${isToday ? 'bg-primary/20 border-primary/50 font-bold' : ''}
            ${isSelected ? 'bg-blue-600/30 border-blue-500' : 'hover:bg-slate-700/50'}
            ${!isCurrentMonth ? 'bg-slate-800/30' : ''}
          `}>
          <span>{getDate(day)}</span>
          {hasCommitments && <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
              {dayCommitments.slice(0, 3).map((commitment, index) => <div key={commitment.id} className={`w-1.5 h-1.5 rounded-full ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />)}
              {dayCommitments.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
            </div>}
        </button>);
      currentDate = addDays(currentDate, 1);
    }
    return days;
  };
  const CalendarHeader = () => <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-blue-200">
          {format(currentMonth, 'MMMM yyyy', {
          locale: ptBR
        })}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={refreshing} className="text-blue-400 hover:text-blue-300 hover:bg-blue-600/10" title="Atualizar compromissos">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>;
  if (loading) {
    return <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-sm text-blue-300">Carregando agenda...</span>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-blue-200">Seus Próximos Compromissos</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-600 text-white">
              {commitments.length} este mês
            </Badge>
            <Button onClick={() => navigate('/agenda-juridica')} size="sm" className="text-white bg-stone-900 hover:bg-stone-800">
              <Plus className="w-4 h-4 mr-1" />
              Novo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
          
          {/* Calendário */}
          <div className={isMobile ? 'order-2' : 'lg:col-span-2'}>
            <CalendarHeader />
            
            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-center text-xs font-medium text-slate-400 p-2">
                  {day}
                </div>)}
            </div>
            
            {/* Grade do calendário */}
            <div className="grid grid-cols-7 bg-slate-800/30 rounded-lg overflow-hidden">
              {renderCalendarDays()}
            </div>
            
            <div className="mt-4 text-xs text-blue-300/70 text-center">
              Clique em um dia para ver os compromissos
            </div>
          </div>

          {/* Lista de compromissos do dia selecionado */}
          <div className={`space-y-3 ${isMobile ? 'order-1' : ''}`}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="font-medium text-blue-200">
                {format(selectedDate, 'dd/MM/yyyy', {
                locale: ptBR
              })}
              </h4>
              {isSameDay(selectedDate, new Date()) && <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                  Hoje
                </Badge>}
            </div>

            {selectedDateCommitments.length === 0 ? <div className="text-center py-6">
                <CalendarIcon className="w-8 h-8 text-blue-400/50 mx-auto mb-2" />
                <p className="text-sm text-blue-300/80">
                  Nenhum compromisso neste dia
                </p>
              </div> : <div className="space-y-2 max-h-80 overflow-y-auto">
                {selectedDateCommitments.map(commitment => <div key={commitment.id} className="p-3 rounded-lg bg-blue-600/10 border border-blue-500/20">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm text-blue-200 truncate">{commitment.title}</h5>
                        <p className="text-xs text-blue-300/80 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          {format(parseISO(commitment.commitment_date), 'HH:mm', {
                      locale: ptBR
                    })}
                        </p>
                        
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                            {typeLabels[commitment.commitment_type]}
                          </Badge>
                          {commitment.priority !== 'normal' && <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'} className="text-xs">
                              {priorityLabels[commitment.priority]}
                            </Badge>}
                        </div>
                        
                        {(commitment.process_number || commitment.client_name || commitment.location) && <div className="mt-2 space-y-1 text-xs text-blue-300/70">
                            {commitment.process_number && <div className="truncate">Processo: {commitment.process_number}</div>}
                            {commitment.client_name && <div className="truncate">Cliente: {commitment.client_name}</div>}
                            {commitment.location && <div className="flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                {commitment.location}
                              </div>}
                          </div>}
                      </div>
                    </div>
                  </div>)}
              </div>}
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default CalendarAgendaWidget;