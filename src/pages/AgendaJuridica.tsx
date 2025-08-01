import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, Clock, MapPin, Plus, Search, Filter, AlertCircle, FileText, Users, Calendar as CalendarIcon } from "lucide-react";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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

  // Obter compromissos do mês
  const getCommitmentsForMonth = (date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    return filteredCommitments.filter(c => {
      const commitmentDate = parseISO(c.commitment_date);
      return commitmentDate >= start && commitmentDate <= end;
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="h-10 w-10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Agenda Jurídica Inteligente
              </h1>
              <p className="text-muted-foreground">
                Organize seus prazos processuais, audiências e compromissos jurídicos
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={showExtractDialog} onOpenChange={setShowExtractDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Extrair Prazos
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
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
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Compromisso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Compromisso</DialogTitle>
                  <DialogDescription>
                    Adicione um novo prazo processual, audiência ou compromisso jurídico.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
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
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateCommitment}>
                      Criar Compromisso
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por processo, cliente, título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
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
          </CardContent>
        </Card>

        {/* Conteúdo Principal */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendário
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <Clock className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Próximos Prazos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendário */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    className="rounded-md border-0"
                    locale={ptBR}
                  />
                </CardContent>
              </Card>

              {/* Compromissos do Dia */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Compromissos de {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                  </CardTitle>
                  <CardDescription>
                    {getCommitmentsForDate(selectedDate).length} compromisso(s) agendado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getCommitmentsForDate(selectedDate).length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum compromisso agendado para este dia.
                      </p>
                    ) : (
                      getCommitmentsForDate(selectedDate).map((commitment) => (
                        <div key={commitment.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <div className={`w-3 h-3 rounded-full mt-1 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
                          <div className="flex-1">
                            <h4 className="font-medium">{commitment.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {format(parseISO(commitment.commitment_date), 'HH:mm')} - {typeLabels[commitment.commitment_type]}
                            </p>
                            {commitment.location && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {commitment.location}
                              </p>
                            )}
                            {commitment.process_number && (
                              <p className="text-sm text-muted-foreground">
                                Processo: {commitment.process_number}
                              </p>
                            )}
                          </div>
                          <Badge variant={commitment.status === 'pendente' ? 'default' : 'secondary'}>
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

          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Compromissos</CardTitle>
                <CardDescription>
                  {filteredCommitments.length} compromisso(s) encontrado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCommitments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum compromisso encontrado.
                    </p>
                  ) : (
                    filteredCommitments.map((commitment) => (
                      <div key={commitment.id} className="flex items-start space-x-4 p-4 rounded-lg border">
                        <div className={`w-4 h-4 rounded-full mt-1 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{commitment.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(commitment.commitment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">{typeLabels[commitment.commitment_type]}</Badge>
                              <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'}>
                                {priorityLabels[commitment.priority]}
                              </Badge>
                              <Badge variant={commitment.status === 'pendente' ? 'default' : 'secondary'}>
                                {statusLabels[commitment.status]}
                              </Badge>
                            </div>
                          </div>
                          {commitment.description && (
                            <p className="text-sm text-muted-foreground mt-2">{commitment.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            {commitment.process_number && (
                              <span>Processo: {commitment.process_number}</span>
                            )}
                            {commitment.client_name && (
                              <span>Cliente: {commitment.client_name}</span>
                            )}
                            {commitment.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {commitment.location}
                              </span>
                            )}
                            {commitment.auto_detected && (
                              <Badge variant="secondary" className="text-xs">Auto-detectado</Badge>
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

          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Próximos Prazos</CardTitle>
                <CardDescription>
                  Prazos e compromissos ordenados por urgência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCommitments
                    .filter(c => c.status === 'pendente')
                    .sort((a, b) => new Date(a.commitment_date).getTime() - new Date(b.commitment_date).getTime())
                    .slice(0, 10)
                    .map((commitment, index) => (
                      <div key={commitment.id} className="flex items-center space-x-4 p-4 rounded-lg border">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{commitment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(commitment.commitment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{typeLabels[commitment.commitment_type]}</Badge>
                          <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'}>
                            {priorityLabels[commitment.priority]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AgendaJuridica;