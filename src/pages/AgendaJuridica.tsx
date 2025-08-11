import { useState, useEffect } from "react";
import { 
  Calendar, 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  FileText, 
  Users, 
  Calendar as CalendarIcon, 
  Zap, 
  Target, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Check, 
  X 
} from "lucide-react";
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
import CalendarView from "@/components/CalendarView";
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";
import UserMenu from "@/components/UserMenu";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";

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
  const { logFeatureUsage } = useFeatureUsage();
  
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
  const [selectedCommitment, setSelectedCommitment] = useState<LegalCommitment | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  // Estados para editar compromisso
  const [editCommitment, setEditCommitment] = useState<{
    title: string;
    description: string;
    commitment_type: 'prazo_processual' | 'audiencia' | 'reuniao' | 'personalizado';
    deadline_type: string;
    commitment_date: string;
    end_date: string;
    location: string;
    is_virtual: boolean;
    process_number: string;
    client_name: string;
    priority: 'baixa' | 'normal' | 'alta' | 'urgente';
  }>({
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

  // Converte 'datetime-local' (local) para ISO UTC
  const toIsoUtc = (value: string) => value ? new Date(value).toISOString() : null;

  // Carregar compromissos de forma otimizada
  const loadCommitments = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Query otimizada com filtros e índices
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      
      const { data, error } = await supabase
        .from('legal_commitments' as any)
        .select('*')
        .eq('user_id', user.id)
        .gte('commitment_date', monthStart.toISOString())
        .lte('commitment_date', monthEnd.toISOString())
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
  }, [user, currentMonth]);

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
      const isSubscriber = (profile?.plan_type && profile.plan_type !== 'gratuito');
      if (!isSubscriber) {
        const { count, error: countError } = await supabase
          .from('legal_commitments' as any)
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'pendente');
        if (countError) throw countError;
        if ((count ?? 0) >= 5) {
          toast({
            title: 'Limite atingido',
            description: 'No plano gratuito, você pode manter até 5 compromissos pendentes simultaneamente. Assine o Plano Essencial para ilimitado.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Verificar conflito de horário (mesmo horário já agendado)
      const desiredStart = toIsoUtc(newCommitment.commitment_date);
      if (!desiredStart) {
        throw new Error('Data/Hora inválida');
      }
      const { data: existingAtSameTime, error: conflictError } = await supabase
        .from('legal_commitments' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .eq('commitment_date', desiredStart)
        .limit(1);
      if (conflictError) throw conflictError;
      if (existingAtSameTime && existingAtSameTime.length > 0) {
        toast({
          title: 'Horário indisponível',
          description: 'Já existe um compromisso neste horário. Escolha outro horário ou dia.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('legal_commitments' as any)
        .insert({
          user_id: user.id,
          ...newCommitment,
          commitment_date: desiredStart,
          end_date: newCommitment.end_date ? toIsoUtc(newCommitment.end_date) : null,
          status: 'pendente',
          auto_detected: false,
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compromisso criado com sucesso!",
      });

      // Log feature usage
      logFeatureUsage('commitment_created', {
        type: newCommitment.commitment_type,
        priority: newCommitment.priority
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

  // Abrir modal de edição
  const handleEditCommitment = (commitment: LegalCommitment) => {
    setSelectedCommitment(commitment);
    setEditCommitment({
      title: commitment.title,
      description: commitment.description || "",
      commitment_type: commitment.commitment_type,
      deadline_type: commitment.deadline_type || "",
      commitment_date: commitment.commitment_date.slice(0, 16), // Format for datetime-local
      end_date: commitment.end_date?.slice(0, 16) || "",
      location: commitment.location || "",
      is_virtual: commitment.is_virtual || false,
      process_number: commitment.process_number || "",
      client_name: commitment.client_name || "",
      priority: commitment.priority,
    });
    setShowEditDialog(true);
  };

  // Salvar edição do compromisso
  const handleSaveEdit = async () => {
    if (!selectedCommitment || !editCommitment.title || !editCommitment.commitment_date) {
      toast({
        title: "Erro",
        description: "Preencha os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const desiredStart = toIsoUtc(editCommitment.commitment_date);
      if (!desiredStart) throw new Error('Data/Hora inválida');
      const { data: existingAtSameTime, error: conflictError } = await supabase
        .from('legal_commitments' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .eq('commitment_date', desiredStart)
        .neq('id', selectedCommitment.id)
        .limit(1);
      if (conflictError) throw conflictError;
      if (existingAtSameTime && existingAtSameTime.length > 0) {
        toast({
          title: 'Horário indisponível',
          description: 'Já existe um compromisso neste horário. Escolha outro horário ou dia.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('legal_commitments' as any)
        .update({
          ...editCommitment,
          commitment_date: desiredStart,
          end_date: editCommitment.end_date ? toIsoUtc(editCommitment.end_date) : null,
        })
        .eq('id', selectedCommitment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compromisso atualizado com sucesso!",
      });

      setShowEditDialog(false);
      setSelectedCommitment(null);
      loadCommitments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o compromisso.",
        variant: "destructive",
      });
    }
  };

  // Cancelar compromisso
  const handleCancelCommitment = async (commitment: LegalCommitment) => {
    try {
      const { error } = await supabase
        .from('legal_commitments' as any)
        .update({ status: 'cancelado' })
        .eq('id', commitment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compromisso cancelado com sucesso!",
      });

      loadCommitments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o compromisso.",
        variant: "destructive",
      });
    }
  };

  // Concluir compromisso
  const handleCompleteCommitment = async (commitment: LegalCommitment) => {
    try {
      const { error } = await supabase
        .from('legal_commitments' as any)
        .update({ status: 'concluido' })
        .eq('id', commitment.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Compromisso marcado como concluído!",
      });

      loadCommitments();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Não foi possível concluir o compromisso.",
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
      
      // Log feature usage
      logFeatureUsage('deadline_extraction_used', {
        deadlines_found: data.deadlinesSaved,
        text_length: extractText.length
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

                  {/* Dialog de Edição */}
                  <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Compromisso</DialogTitle>
                        <DialogDescription>
                          Faça as alterações necessárias no compromisso.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-title">Título *</Label>
                          <Input
                            id="edit-title"
                            value={editCommitment.title}
                            onChange={(e) => setEditCommitment({...editCommitment, title: e.target.value})}
                            placeholder="Ex: Prazo para contestação - Processo 123456"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-type">Tipo *</Label>
                          <Select 
                            value={editCommitment.commitment_type} 
                            onValueChange={(value: any) => setEditCommitment({...editCommitment, commitment_type: value})}
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-date">Data/Hora *</Label>
                            <Input
                              id="edit-date"
                              type="datetime-local"
                              value={editCommitment.commitment_date}
                              onChange={(e) => setEditCommitment({...editCommitment, commitment_date: e.target.value})}
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-priority">Prioridade</Label>
                            <Select 
                              value={editCommitment.priority} 
                              onValueChange={(value: any) => setEditCommitment({...editCommitment, priority: value})}
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

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-process">Número do Processo</Label>
                            <Input
                              id="edit-process"
                              value={editCommitment.process_number}
                              onChange={(e) => setEditCommitment({...editCommitment, process_number: e.target.value})}
                              placeholder="Ex: 0001234-56.2024.8.26.0001"
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-client">Cliente</Label>
                            <Input
                              id="edit-client"
                              value={editCommitment.client_name}
                              onChange={(e) => setEditCommitment({...editCommitment, client_name: e.target.value})}
                              placeholder="Nome do cliente"
                            />
                          </div>
                        </div>

                        {(['audiencia', 'reuniao'].includes(editCommitment.commitment_type)) && (
                          <div className="grid gap-2">
                            <Label htmlFor="edit-location">Local</Label>
                            <Input
                              id="edit-location"
                              value={editCommitment.location}
                              onChange={(e) => setEditCommitment({...editCommitment, location: e.target.value})}
                              placeholder="Ex: Fórum da Comarca de São Paulo"
                            />
                          </div>
                        )}

                        <div className="grid gap-2">
                          <Label htmlFor="edit-description">Descrição</Label>
                          <Textarea
                            id="edit-description"
                            value={editCommitment.description}
                            onChange={(e) => setEditCommitment({...editCommitment, description: e.target.value})}
                            placeholder="Detalhes adicionais sobre o compromisso"
                            className="min-h-[80px]"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit}>
                          Salvar Alterações
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
                  <Card className="h-full flex flex-col bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 h-full">
                      <CalendarView 
                        filteredCommitments={filteredCommitments}
                        onCommitmentSelect={handleEditCommitment}
                      />
                    </CardContent>
                  </Card>
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
                             <div key={commitment.id} className="group p-3 md:p-4 rounded-lg border border-slate-600 bg-slate-700/30 hover:border-slate-500/50 hover:bg-slate-700/50 transition-all space-y-3">
                               <div className="flex items-start gap-3">
                                 <div className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${getCommitmentColor(commitment.commitment_type, commitment.priority)}`} />
                                 <div className="flex-1 min-w-0">
                                   <h4 className="font-medium text-sm text-white leading-tight mb-1">{commitment.title}</h4>
                                   <p className="text-xs text-slate-400 flex items-center gap-1">
                                     <Clock className="h-3 w-3 flex-shrink-0" />
                                     {format(parseISO(commitment.commitment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                   </p>
                                 </div>
                               </div>

                               {/* Badges em linha separada para mobile */}
                               <div className="flex flex-wrap gap-1">
                                 <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-300">
                                   {typeLabels[commitment.commitment_type]}
                                 </Badge>
                                 <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'} className="text-xs">
                                   {priorityLabels[commitment.priority]}
                                 </Badge>
                                 <Badge variant={commitment.status === 'pendente' ? 'default' : commitment.status === 'concluido' ? 'secondary' : 'destructive'} className="text-xs">
                                   {statusLabels[commitment.status]}
                                 </Badge>
                               </div>

                               {commitment.description && (
                                 <p className="text-xs text-slate-400 line-clamp-2">{commitment.description}</p>
                               )}

                               {/* Informações adicionais */}
                               {(commitment.process_number || commitment.client_name || commitment.location) && (
                                 <div className="space-y-1 text-xs text-slate-400">
                                   {commitment.process_number && (
                                     <div className="truncate">
                                       <span className="font-medium">Processo:</span> {commitment.process_number}
                                     </div>
                                   )}
                                   {commitment.client_name && (
                                     <div className="truncate">
                                       <span className="font-medium">Cliente:</span> {commitment.client_name}
                                     </div>
                                   )}
                                   {commitment.location && (
                                     <div className="flex items-center gap-1 truncate">
                                       <MapPin className="h-3 w-3 flex-shrink-0" />
                                       {commitment.location}
                                     </div>
                                   )}
                                 </div>
                               )}
                                 
                               {/* Ações do compromisso - sempre visível no mobile para pendentes */}
                               {commitment.status === 'pendente' && (
                                  <div className={`flex flex-wrap gap-2 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditCommitment(commitment)}
                                      className="h-8 px-3 text-xs border-slate-600 hover:bg-slate-600 flex-1 min-w-0"
                                    >
                                      <Edit className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">Editar</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCompleteCommitment(commitment)}
                                      className="h-8 px-3 text-xs border-green-600 text-green-400 hover:bg-green-600/10 flex-1 min-w-0"
                                    >
                                      <Check className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">Concluir</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCancelCommitment(commitment)}
                                      className="h-8 px-3 text-xs border-red-600 text-red-400 hover:bg-red-600/10 flex-1 min-w-0"
                                    >
                                      <X className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">Cancelar</span>
                                     </Button>
                                   </div>
                                 )}
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
                             <div key={commitment.id} className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center space-x-4'} p-3 rounded-lg border border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 transition-colors`}>
                               {/* Número da ordem */}
                               <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0 ${isMobile ? 'self-start' : ''}`}>
                                 {index + 1}
                               </div>
                               
                               {/* Conteúdo principal */}
                               <div className="flex-1 min-w-0 space-y-2">
                                 <h4 className="font-medium text-sm text-white">{commitment.title}</h4>
                                 <p className="text-xs text-slate-400 flex items-center gap-1">
                                   <Clock className="h-3 w-3 flex-shrink-0" />
                                   {format(parseISO(commitment.commitment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                 </p>
                                 {commitment.process_number && (
                                   <p className="text-xs text-slate-500">
                                     Processo: {commitment.process_number}
                                   </p>
                                 )}
                                 
                                 {/* Badges - organizadas para mobile */}
                                 <div className={`flex gap-1 ${isMobile ? 'flex-wrap' : 'flex-shrink-0'}`}>
                                   <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-300">
                                     {typeLabels[commitment.commitment_type]}
                                   </Badge>
                                   <Badge variant={commitment.priority === 'urgente' ? 'destructive' : 'default'} className="text-xs">
                                     {priorityLabels[commitment.priority]}
                                   </Badge>
                                 </div>
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