import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, Clock, MapPin, Plus, Search, Filter, AlertCircle, FileText, Users, Calendar as CalendarIcon, Zap, Target, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import UserMenu from "@/components/UserMenu";
import { useScrollDirection } from "@/hooks/useScrollDirection";

interface LegalCommitment {
  id: string;
  title: string;
  description?: string;
  commitment_type: 'prazo_processual' | 'audiencia' | 'reuniao' | 'personalizado';
  deadline_type?: 'recursal' | 'contestacao' | 'replicas' | 'outras';
  commitment_date: string;
  end_date?: string;
  location?: string;
  is_virtual?: boolean;
  process_number?: string;
  client_name?: string;
  status: 'pendente' | 'concluido' | 'cancelado';
  priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  auto_detected: boolean;
  created_at: string;
}

const AgendaJuridica = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { visible: menuVisible } = useScrollDirection();
  
  const [commitments, setCommitments] = useState<LegalCommitment[]>([]);
  const [filteredCommitments, setFilteredCommitments] = useState<LegalCommitment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showExtractDialog, setShowExtractDialog] = useState(false);
  const [extractText, setExtractText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  // Estados para formulário de novo compromisso
  const [newCommitment, setNewCommitment] = useState({
    title: "",
    description: "",
    commitment_type: "prazo_processual" as const,
    deadline_type: "",
    commitment_date: "",
    end_date: "",
    location: "",
    is_virtual: false,
    process_number: "",
    client_name: "",
    priority: "normal" as const,
  });

  // Carregar compromissos
  const loadCommitments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Usando a query raw para acessar a tabela que ainda não está nos types
      const { data, error } = await supabase
        .from('legal_commitments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('commitment_date', { ascending: true });

      if (error) throw error;
      setCommitments((data as unknown as LegalCommitment[]) || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os compromissos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    let filtered = commitments;

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.process_number?.includes(searchTerm) ||
        c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter(c => c.commitment_type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    setFilteredCommitments(filtered);
  }, [commitments, searchTerm, filterType, filterStatus]);

  useEffect(() => {
    loadCommitments();
  }, [user]);

  // Criar novo compromisso
  const handleCreateCommitment = async () => {
    if (!user || !newCommitment.title || !newCommitment.commitment_date) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('legal_commitments' as any)
        .insert({
          user_id: user.id,
          ...newCommitment,
          end_date: newCommitment.end_date || null,
          status: 'pendente',
          auto_detected: false,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compromisso criado com sucesso!",
      });

      setShowAddDialog(false);
      setNewCommitment({
        title: "",
        description: "",
        commitment_type: "prazo_processual",
        deadline_type: "",
        commitment_date: "",
        end_date: "",
        location: "",
        is_virtual: false,
        process_number: "",
        client_name: "",
        priority: "normal",
      });
      loadCommitments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o compromisso.",
        variant: "destructive",
      });
    }
  };

  // Extrair prazos automaticamente
  const handleExtractDeadlines = async () => {
    if (!user || !extractText.trim()) {
      toast({
        title: "Erro",
        description: "Digite o texto para análise.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-legal-deadlines', {
        body: {
          text: extractText,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `${data.deadlinesSaved} prazos detectados e salvos automaticamente!`,
        });
        setShowExtractDialog(false);
        setExtractText("");
        loadCommitments();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível extrair os prazos.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Obter cor do compromisso
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

  // Obter compromissos do dia
  const getCommitmentsForDate = (date: Date) => {
    return filteredCommitments.filter(c => 
      isSameDay(parseISO(c.commitment_date), date)
    );
  };

  const typeLabels = {
    'prazo_processual': 'Prazo Processual',
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

  const statusLabels = {
    'pendente': 'Pendente',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado'
  };

  const totalTokens = (profile?.daily_tokens || 0) + (profile?.plan_tokens || 0);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-slate-700"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Agenda Jurídica
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Organize seus prazos processuais e compromissos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Contador de tokens */}
              <div className="hidden md:flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white">
                  {Math.floor(totalTokens).toLocaleString()}
                </span>
                <span className="text-xs text-slate-300">tokens</span>
              </div>
              
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de informações sobre a agenda */}
          <Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600/20 rounded-xl">
                    <Target className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Gestão de Prazos</h3>
                    <p className="text-sm text-slate-300">
                      Organize e monitore todos os seus compromissos jurídicos
                    </p>
                  </div>
                </div>
                <Badge className="bg-indigo-600 text-white">
                  {filteredCommitments.length} compromissos
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">Prazos</div>
                  <div className="text-xs text-slate-400">Processuais</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-red-400">Audiências</div>
                  <div className="text-xs text-slate-400">Presenciais/Virtuais</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-green-400">Reuniões</div>
                  <div className="text-xs text-slate-400">Clientes/Equipe</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">IA</div>
                  <div className="text-xs text-slate-400">Extração Automática</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros e Ações */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Busca */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar por processo, cliente, título..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                </div>
                
                {/* Filtros */}
                <div className="flex gap-2 w-full lg:w-auto">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full lg:w-[140px] bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full lg:w-[120px] bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-2 w-full lg:w-auto">
                  <Dialog open={showExtractDialog} onOpenChange={setShowExtractDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 lg:flex-none border-slate-600 hover:bg-slate-700">
                        <FileText className="h-4 w-4 mr-2" />
                        Extrair IA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Extrair Prazos Automaticamente</DialogTitle>
                        <DialogDescription>
                          Cole o texto de uma decisão, despacho ou intimação para extrair prazos automaticamente.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Cole aqui o texto da decisão, despacho ou intimação..."
                          value={extractText}
                          onChange={(e) => setExtractText(e.target.value)}
                          className="min-h-[200px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowExtractDialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleExtractDeadlines} disabled={isExtracting}>
                            {isExtracting ? "Analisando..." : "Extrair Prazos"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 lg:flex-none bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Criar Novo Compromisso</DialogTitle>
                        <DialogDescription>
                          Adicione um novo prazo processual, audiência ou compromisso jurídico.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid gap-2">
                          <Label htmlFor="title">Título *</Label>
                          <Input
                            id="title"
                            value={newCommitment.title}
                            onChange={(e) => setNewCommitment({...newCommitment, title: e.target.value})}
                            placeholder="Ex: Prazo para contestação - Processo 123456"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="type">Tipo *</Label>
                          <Select 
                            value={newCommitment.commitment_type} 
                            onValueChange={(value: any) => setNewCommitment({...newCommitment, commitment_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(typeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {newCommitment.commitment_type === 'prazo_processual' && (
                          <div className="grid gap-2">
                            <Label htmlFor="deadline_type">Tipo de Prazo</Label>
                            <Select 
                              value={newCommitment.deadline_type} 
                              onValueChange={(value) => setNewCommitment({...newCommitment, deadline_type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de prazo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="recursal">Recursal</SelectItem>
                                <SelectItem value="contestacao">Contestação</SelectItem>
                                <SelectItem value="replicas">Tréplica</SelectItem>
                                <SelectItem value="outras">Outras</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="date">Data/Hora *</Label>
                            <Input
                              id="date"
                              type="datetime-local"
                              value={newCommitment.commitment_date}
                              onChange={(e) => setNewCommitment({...newCommitment, commitment_date: e.target.value})}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="priority">Prioridade</Label>
                            <Select 
                              value={newCommitment.priority} 
                              onValueChange={(value: any) => setNewCommitment({...newCommitment, priority: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(priorityLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {(['audiencia', 'reuniao'].includes(newCommitment.commitment_type)) && (
                          <>
                            <div className="grid gap-2">
                              <Label htmlFor="location">Local</Label>
                              <Input
                                id="location"
                                value={newCommitment.location}
                                onChange={(e) => setNewCommitment({...newCommitment, location: e.target.value})}
                                placeholder="Ex: Fórum da Comarca de São Paulo"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="virtual"
                                checked={newCommitment.is_virtual}
                                onCheckedChange={(checked) => setNewCommitment({...newCommitment, is_virtual: checked})}
                              />
                              <Label htmlFor="virtual">Evento virtual</Label>
                            </div>
                          </>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="process">Número do Processo</Label>
                            <Input
                              id="process"
                              value={newCommitment.process_number}
                              onChange={(e) => setNewCommitment({...newCommitment, process_number: e.target.value})}
                              placeholder="Ex: 0001234-56.2024.8.26.0001"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="client">Cliente</Label>
                            <Input
                              id="client"
                              value={newCommitment.client_name}
                              onChange={(e) => setNewCommitment({...newCommitment, client_name: e.target.value})}
                              placeholder="Nome do cliente"
                            />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            value={newCommitment.description}
                            onChange={(e) => setNewCommitment({...newCommitment, description: e.target.value})}
                            placeholder="Detalhes adicionais sobre o compromisso"
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateCommitment}>
                          Criar Compromisso
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo Principal com Tabs */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="list" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0 bg-slate-800/50 border border-slate-700">
                <TabsTrigger value="calendar" className="gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Próximos</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden mt-4">
                <TabsContent value="calendar" className="h-full m-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                    {/* Calendário */}
                    <Card className="flex flex-col bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-white">
                            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                          </CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-slate-600 hover:bg-slate-700"
                              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 border-slate-600 hover:bg-slate-700"
                              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            >
                              <ChevronLeft className="h-4 w-4 rotate-180" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-hidden">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          month={currentMonth}
                          onMonthChange={setCurrentMonth}
                          className="rounded-md border-0 w-full"
                          locale={ptBR}
                        />
                      </CardContent>
                    </Card>

                    {/* Compromissos do Dia */}
                    <Card className="flex flex-col bg-slate-800/50 border-slate-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-white">
                          {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                        </CardTitle>
                        <CardDescription>
                          {getCommitmentsForDate(selectedDate).length} compromisso(s)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-y-auto">
                        <div className="space-y-3">
                          {getCommitmentsForDate(selectedDate).length === 0 ? (
                            <div className="text-center py-8">
                              <CalendarIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                              <p className="text-sm text-slate-400">
                                Nenhum compromisso para este dia.
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                Sua agenda está livre!
                              </p>
                            </div>
                          ) : (
                            getCommitmentsForDate(selectedDate).map((commitment) => (
                              <div key={commitment.id} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm truncate text-white">{commitment.title}</h4>
                                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    {format(parseISO(commitment.commitment_date), 'HH:mm')} - {typeLabels[commitment.commitment_type]}
                                  </p>
                                  {commitment.location && (
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{commitment.location}</span>
                                    </p>
                                  )}
                                  {commitment.process_number && (
                                    <p className="text-xs text-slate-400 mt-1 truncate">
                                      Processo: {commitment.process_number}
                                    </p>
                                  )}
                                </div>
                                <Badge variant={commitment.status === 'pendente' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                                  {statusLabels[commitment.status]}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="list" className="h-full m-0">
                  <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg text-white">Todos os Compromissos</CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          {filteredCommitments.length} compromisso(s) encontrado(s)
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      <div className="space-y-3">
                        {filteredCommitments.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="p-4 bg-slate-700/30 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                              <Calendar className="w-10 h-10 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">
                              Nenhum compromisso encontrado
                            </h3>
                            <p className="text-sm text-slate-400 max-w-md mx-auto">
                              {searchTerm || filterType !== "all" || filterStatus !== "all" 
                                ? "Tente ajustar os filtros para encontrar seus compromissos"
                                : "Você ainda não possui compromissos agendados. Comece criando um novo!"
                              }
                            </p>
                            
                            {!searchTerm && filterType === "all" && filterStatus === "all" && (
                              <div className="mt-6">
                                <Button 
                                  onClick={() => setShowAddDialog(true)}
                                  className="bg-primary hover:bg-primary/90"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Criar Primeiro Compromisso
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          filteredCommitments.map((commitment) => (
                            <div key={commitment.id} className="group flex items-start space-x-4 p-4 rounded-lg border border-slate-600 bg-slate-700/30 hover:border-slate-500/50 hover:bg-slate-700/50 transition-all">
                              <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm text-white">{commitment.title}</h4>
                                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3 flex-shrink-0" />
                                      {format(parseISO(commitment.commitment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-1 flex-shrink-0">
                                    <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-300">
                                      {typeLabels[commitment.commitment_type]}
                                    </Badge>
                                    <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'} className="text-xs">
                                      {priorityLabels[commitment.priority]}
                                    </Badge>
                                  </div>
                                </div>
                                {commitment.description && (
                                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">{commitment.description}</p>
                                )}
                                <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
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
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="timeline" className="h-full m-0">
                  <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg text-white">Próximos Prazos</CardTitle>
                        </div>
                        <CardDescription className="text-sm">
                          Ordenados por urgência
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto">
                      <div className="space-y-3">
                        {filteredCommitments
                          .filter(c => c.status === 'pendente')
                          .sort((a, b) => new Date(a.commitment_date).getTime() - new Date(b.commitment_date).getTime())
                          .slice(0, 10)
                          .map((commitment, index) => (
                            <div key={commitment.id} className="flex items-center space-x-4 p-3 rounded-lg border border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate text-white">{commitment.title}</h4>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 flex-shrink-0" />
                                  {format(parseISO(commitment.commitment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </p>
                                {commitment.process_number && (
                                  <p className="text-xs text-slate-500 mt-1 truncate">
                                    Processo: {commitment.process_number}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-300">
                                  {typeLabels[commitment.commitment_type]}
                                </Badge>
                                <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'} className="text-xs">
                                  {priorityLabels[commitment.priority]}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        
                        {filteredCommitments.filter(c => c.status === 'pendente').length === 0 && (
                          <div className="text-center py-12">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-white mb-2">
                              Tudo em dia!
                            </h3>
                            <p className="text-sm text-slate-400">
                              Você não possui prazos pendentes no momento.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Informações sobre a agenda */}
          <Card className="bg-blue-900/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-200 mb-2">Dicas para Organização</h4>
                  <div className="space-y-1 text-sm text-blue-300/80">
                    <p>• <strong>Extração IA:</strong> Cole textos de decisões para detectar prazos automaticamente</p>
                    <p>• <strong>Prioridades:</strong> Use urgente para prazos críticos e alta para importantes</p>
                    <p>• <strong>Calendário:</strong> Visualize seus compromissos de forma organizada</p>
                    <p>• <strong>Filtros:</strong> Use a busca para encontrar rapidamente processos específicos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AgendaJuridica;