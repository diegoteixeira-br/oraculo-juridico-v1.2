import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ChevronRight, RefreshCw, Plus, Bell, BellOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths, getDate, getDaysInMonth, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAccessControl } from "@/hooks/useAccessControl";
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

const CalendarAgendaWidget = () => {
  const {
    user, profile
  } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { isTrialExpired } = useAccessControl();
  const userTimezone = (profile as any)?.timezone || 'America/Sao_Paulo';

  const [commitments, setCommitments] = useState<LegalCommitment[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: false,
    email_time: '09:00'
  });

  const MAX_ITEMS = 5;

  useEffect(() => {
    if (user?.id) {
    loadCommitments();
    loadNotificationSettings();
    }
  }, [user?.id, currentMonth]);

  const loadNotificationSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_settings' as any)
        .select('email_enabled, agenda_email_time, agenda_timezone')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setNotificationSettings({
          email_enabled: (data as any).email_enabled || false,
          email_time: (data as any).agenda_email_time || '09:00'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de notificação:', error);
    }
  };

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

  const getItemAppearance = (type: string, priority: string) => {
    // Fundo e borda do item (estilo ficha colorida)
    if (priority === 'urgente') return 'bg-red-500/15 border-red-500/30';
    if (priority === 'alta') return 'bg-orange-500/15 border-orange-500/30';
    switch (type) {
      case 'prazo_processual':
        return 'bg-blue-500/15 border-blue-500/30';
      case 'audiencia':
        return 'bg-red-500/15 border-red-500/30';
      case 'reuniao':
        return 'bg-green-500/15 border-green-500/30';
      default:
        return 'bg-slate-700/30 border-slate-600/40';
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
    const dayCommitments = commitments.filter(c => isSameDay(parseISO(c.commitment_date), date));
    
    // Ordenar por horário - tratando 00:00 como final do dia
    return dayCommitments.sort((a, b) => {
      const dateA = parseISO(a.commitment_date);
      const dateB = parseISO(b.commitment_date);
      
      // Extrair horas para comparação
      const hourA = dateA.getHours();
      const hourB = dateB.getHours();
      
      // Tratar 00:00 como final do dia (24:00)
      const adjustedHourA = hourA === 0 ? 24 : hourA;
      const adjustedHourB = hourB === 0 ? 24 : hourB;
      
      // Se as horas ajustadas forem diferentes, ordenar por hora
      if (adjustedHourA !== adjustedHourB) {
        return adjustedHourA - adjustedHourB;
      }
      
      // Se as horas forem iguais, ordenar por minutos
      return dateA.getMinutes() - dateB.getMinutes();
    });
  };

  const selectedDateCommitments = getCommitmentsForDate(selectedDate);
  const displayedCommitments = showAll ? selectedDateCommitments : selectedDateCommitments.slice(0, MAX_ITEMS);

  useEffect(() => { setShowAll(false); }, [selectedDate, commitments]);

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

  return (
    <div className="relative">
      <Card className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <CardTitle className="text-lg text-blue-200">Seus Próximos Compromissos</CardTitle>
            <Button onClick={() => navigate('/agenda-juridica')} size="sm" className="text-white bg-black hover:bg-stone-800 px-2 mx-2 text-xs sm:text-sm whitespace-nowrap">
              <span className="hidden sm:inline">Ver Agenda Completa</span>
              <span className="sm:hidden">Ver Agenda</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-blue-300 font-medium">Próximos 30 Dias</span>
          <div className="flex items-center gap-2 ml-auto">
            {notificationSettings.email_enabled ? (
              <div title="Notificações ativas">
                <Bell className="h-4 w-4 text-blue-300 fill-current" />
              </div>
            ) : (
              <div title="Notificações desativadas">
                <BellOff className="h-4 w-4 text-blue-400" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
          
          {/* Calendário */}
          <div className={isMobile ? 'order-1' : ''}>
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
          <div className={`space-y-3 ${isMobile ? 'order-2' : ''}`}>
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
                {commitments.length === 0 && !isTrialExpired && (
                  <Button
                    onClick={() => navigate('/agenda-juridica?new=true')}
                    size="sm"
                    className="mt-3 text-white bg-black hover:bg-stone-800"
                  >
                    Criar primeiro compromisso
                  </Button>
                )}
              </div> : <>
                <div className="space-y-2">
                  {displayedCommitments.map((commitment) => (
                    <div key={commitment.id} className={`p-3 rounded-xl border ${getItemAppearance(commitment.commitment_type, commitment.priority)}`}>
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-sm text-blue-200 truncate">{commitment.title}</h5>
                          <p className="text-xs text-blue-300/80 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            {formatInTimeZone(parseISO(commitment.commitment_date), userTimezone, 'HH:mm', { locale: ptBR })}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs border-blue-400/30 text-blue-300">
                              {typeLabels[commitment.commitment_type]}
                            </Badge>
                            {commitment.priority !== 'normal' && (
                              <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'} className="text-xs">
                                {priorityLabels[commitment.priority]}
                              </Badge>
                            )}
                          </div>
                          {(commitment.process_number || commitment.client_name || commitment.location) && (
                            <div className="mt-2 space-y-1 text-xs text-blue-300/70">
                              {commitment.process_number && <div className="truncate">Processo: {commitment.process_number}</div>}
                              {commitment.client_name && <div className="truncate">Cliente: {commitment.client_name}</div>}
                              {commitment.location && (
                                <div className="flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  {commitment.location}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedDateCommitments.length > MAX_ITEMS && (
                  <div className="mt-3">
                    {!showAll ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAll(true)}
                        className="border-blue-400/30 text-blue-300 hover:bg-blue-600/10"
                      >
                        Ver mais
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(false)}
                        className="text-blue-300 hover:bg-blue-600/10"
                      >
                        Ver menos
                      </Button>
                    )}
                  </div>
                )}
              </>
            }
          </div>
        </div>
      </CardContent>
      {isTrialExpired && (
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
          <p className="text-white font-medium">Acesso bloqueado</p>
          <p className="text-slate-300 text-xs px-6 text-center">Assine para ver e gerenciar seus compromissos.</p>
          <Button onClick={() => navigate('/comprar-creditos')} className="bg-primary hover:bg-primary/90">Assinar agora</Button>
        </div>
      )}
    </Card>

    </div>
  );
};

export default CalendarAgendaWidget;