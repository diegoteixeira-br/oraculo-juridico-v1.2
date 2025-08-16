import { useState, useEffect } from "react";
import { CreditCard, History, Plus, MessageSquare, FileText, Calculator, Heart, DollarSign, Calendar, TrendingUp, Zap, Clock, Users, Award, Bell, BellOff, Wrench, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import UserMenu from "@/components/UserMenu";
import DocumentViewer from "@/components/DocumentViewer";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import CalendarAgendaWidget from "@/components/CalendarAgendaWidget";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDocumentCache } from "@/hooks/useDocumentCache";
import { useFeatureUsage } from "@/hooks/useFeatureUsage";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useAccessControl } from "@/hooks/useAccessControl";
import { TrialStatusCard } from "@/components/TrialStatusCard";


// CONFIGURAÇÃO DE MANUTENÇÃO - Altere para false quando quiser reativar
const DOCS_MAINTENANCE_MODE = true;
const LEGAL_DOCS_MAINTENANCE_MODE = true;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { visible: menuVisible } = useScrollDirection();
  const isMobile = useIsMobile();
const { documents: legalDocuments, loading: documentsLoading } = useDocumentCache();
const { logFeatureUsage } = useFeatureUsage();
const access = useAccessControl();
const { isBlocked, isTrialExpired, getCurrentPlanInfo, canPurchaseTokens, isEssentialSubscriber } = access;

const [userCredits, setUserCredits] = useState(0);
const [dailyCredits, setDailyCredits] = useState(0);
  const [totalCreditsPurchased, setTotalCreditsPurchased] = useState(0);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [savedDocs, setSavedDocs] = useState<any[]>([]);
  // Alias para compatibilidade com referências antigas
  const userDocs = savedDocs;

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email_enabled: false,
    email_time: '09:00'
  });

  // Informações do plano atual
  const currentPlan = getCurrentPlanInfo();

  const totalAvailableCredits = userCredits + dailyCredits;
  const { userTimezone } = useUserTimezone();
  
  // Calcular trial status em tempo real
  const isTrial = profile?.subscription_status === 'trial';
  const isPaid = profile?.subscription_status === 'active';
  const planType = profile?.plan_type || 'gratuito';
  
  const [daysRemaining, setDaysRemaining] = useState(7);
  
  useEffect(() => {
    const calculateDaysRemaining = () => {
      if (!profile?.trial_end_date) {
        setDaysRemaining(7);
        return;
      }

      try {
        const now = new Date();
        const trialEnd = new Date(profile.trial_end_date);
        
        // Converter para o timezone do usuário
        const nowInUserTz = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
        const trialEndInUserTz = new Date(trialEnd.toLocaleString('en-US', { timeZone: userTimezone }));
        
        // Definir hora como início do dia para cálculo correto
        nowInUserTz.setHours(0, 0, 0, 0);
        trialEndInUserTz.setHours(23, 59, 59, 999);
        
        const diffTime = trialEndInUserTz.getTime() - nowInUserTz.getTime();
        const days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        setDaysRemaining(days);

        console.log('Trial Timer Update:', {
          timezone: userTimezone,
          now: nowInUserTz.toISOString(),
          trialEnd: trialEndInUserTz.toISOString(),
          daysRemaining: days,
          subscription_status: profile?.subscription_status
        });
      } catch (error) {
        console.error('Error calculating trial days:', error);
        setDaysRemaining(7);
      }
    };

    // Calcular imediatamente
    calculateDaysRemaining();

    // Atualizar a cada minuto para garantir tempo real
    const interval = setInterval(calculateDaysRemaining, 60000);

    return () => clearInterval(interval);
  }, [profile?.trial_end_date, userTimezone, profile?.subscription_status]);

  // Redirecionar para comprar-creditos se conta estiver inativa
  useEffect(() => {
    if (profile && profile.is_active === false) {
      navigate('/comprar-creditos?reason=account_inactive');
    }
  }, [profile, navigate]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;

      try {
        // Carregar dados do perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('plan_tokens, token_balance, plan_type, subscription_status')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          const trialTokens = Number((profileData as any).token_balance || 0);
          const planTokens = Number((profileData as any).plan_tokens || 0);
          
          setUserCredits(planTokens);
          setDailyCredits(trialTokens);
          setTotalCreditsPurchased(planTokens);
        }

        // Calcular tokens usados
        const { data: transactions } = await supabase
          .from('credit_transactions')
          .select('amount, transaction_type')
          .eq('user_id', user.id);

        if (transactions) {
          let totalUsed = 0;
          transactions.forEach(transaction => {
            if (transaction.transaction_type === 'usage' || 
                transaction.transaction_type === 'daily_usage' ||
                transaction.transaction_type === 'trial_usage') {
              totalUsed += Math.abs(transaction.amount);
            }
          });
          setCreditsUsed(totalUsed);
        }

        // Carregar consultas recentes
        const { data: queries } = await supabase
          .from('query_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        setRecentQueries(queries || []);

        // Carregar documentos do usuário
        const { data: myDocs } = await supabase
          .from('user_documents')
          .select('id, title, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });
        setSavedDocs(myDocs || []);

      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    loadUserData();
    loadNotificationSettings();
  }, [user?.id]);

  const loadNotificationSettings = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        setNotificationSettings({
          email_enabled: (data as any).email_enabled || false,
          email_time: (data as any).email_time || '09:00'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de notificação:', error);
    }
  };

  // Atualiza "Meus Documentos" em tempo real quando salvar/editar
  useEffect(() => {
    if (!user?.id) return;

    const fetchUserDocs = async () => {
      const { data: myDocs } = await supabase
        .from('user_documents')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setSavedDocs(myDocs || []);
    };

    const channel = supabase
      .channel('realtime-user-docs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_documents', filter: `user_id=eq.${user.id}` }, () => {
        fetchUserDocs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleViewDocument = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setIsDocumentViewerOpen(true);
    
    // Log document viewing
    const document = legalDocuments.find(doc => doc.id === documentId);
    if (document) {
      logFeatureUsage('document_view', {
        document_id: documentId,
        document_title: document.title,
        document_category: document.category
      });
    }
  };

  const processTemplateToHtml = (text: string) => {
    return (text || '')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  };

const openTemplateEditor = async (documentId: string) => {
  if (isBlocked) {
    toast({ title: 'Acesso restrito', description: 'Ative sua assinatura para editar modelos.', variant: 'destructive' });
    navigate('/comprar-creditos');
    return;
  }
  setTemplateLoading(true);
  try {
      const { data, error } = await supabase
        .from('legal_documents')
        .select('id, title, content, category')
        .eq('id', documentId)
        .maybeSingle();
      if (error) throw error;
      const html = processTemplateToHtml((data as any)?.content || '');
      setTemplateTitle((data as any)?.title || 'Documento');
      setTemplateContent(html);
      setTemplateOpen(true);
      if (data) {
        logFeatureUsage('template_edit_started', {
          document_id: (data as any).id,
          document_title: (data as any).title,
          document_category: (data as any).category,
        });
      }
    } catch (e) {
      console.error('Erro ao carregar modelo:', e);
      toast({ title: 'Erro', description: 'Não foi possível abrir o modelo para edição', variant: 'destructive' });
    } finally {
      setTemplateLoading(false);
    }
  };

  const saveTemplateAsMyDoc = async () => {
    if (!user?.id) return;
    try {
      const title = templateTitle.trim() || 'Documento';
      const { error } = await supabase
        .from('user_documents')
        .insert({ user_id: user.id, title, content_md: templateContent });
      if (error) throw error;
      toast({ title: 'Documento salvo' });
      setTemplateOpen(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
    }
  };

  const renameSavedDoc = async (d: any) => {
    if (!user?.id) return;
    const newTitle = prompt('Novo título', d.title)?.trim();
    if (!newTitle || newTitle === d.title) return;
    const { error } = await supabase
      .from('user_documents')
      .update({ title: newTitle })
      .eq('id', d.id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível renomear', variant: 'destructive' });
    } else {
      toast({ title: 'Documento renomeado' });
    }
  };

  const duplicateSavedDoc = async (d: any) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('user_documents')
      .select('title, content_md, folder, tags')
      .eq('id', d.id)
      .maybeSingle();
    if (error || !data) {
      toast({ title: 'Erro', description: 'Não foi possível duplicar', variant: 'destructive' });
      return;
    }
    const { error: insError } = await supabase
      .from('user_documents')
      .insert({
        user_id: user.id,
        title: `Cópia de ${data.title}`,
        content_md: (data as any).content_md || '',
        folder: (data as any).folder ?? null,
        tags: (data as any).tags ?? []
      });
    if (insError) {
      toast({ title: 'Erro', description: 'Falha ao criar cópia', variant: 'destructive' });
    } else {
      toast({ title: 'Cópia criada' });
    }
  };

  const getUsagePercentage = () => {
    const total = totalAvailableCredits + creditsUsed;
    return total > 0 ? (creditsUsed / total) * 100 : 0;
  };
  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'premium': return 'bg-purple-600 text-white';
      case 'basico': return 'bg-blue-600 text-white';
      default: return 'bg-green-600 text-white';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
                width="160"
                height="40"
              />
              <div>
                <h1 className="text-xl font-bold text-white">Dashboard</h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Bem-vindo, {profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Contador de tokens compacto */}
              <div className="hidden md:flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white">
                  {Math.floor(totalAvailableCredits).toLocaleString()}
                </span>
                <span className="text-xs text-slate-300">tokens</span>
              </div>
              
              <UserMenu hideOptions={["dashboard", "historico"]} />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
          
          {/* Cards de estatísticas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary/80 font-medium">Tokens Disponíveis</p>
                    <p className="text-2xl font-bold text-primary">
                      {Math.floor(totalAvailableCredits).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {(isPaid || planType === 'Gratuito' || planType === 'gratuito') ? (
              <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-600/10 border-emerald-600/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-300 font-medium">Plano Ativo</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {isTrial ? `Gratuito ${daysRemaining}/7 Dias` : planType}
                      </p>
                      <div className="mt-2">
                        <p className="text-xs text-emerald-300/70">
                          Membro desde: {new Date(
                            isPaid && profile?.subscription_activated_at 
                              ? profile.subscription_activated_at 
                              : profile?.created_at || ''
                          ).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-600/20 rounded-lg">
                      {isTrial ? <Clock className="w-6 h-6 text-emerald-400" /> : <Users className="w-6 h-6 text-emerald-400" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <TrialStatusCard profile={profile} />
            )}

            <Card className="bg-gradient-to-br from-blue-600/20 to-blue-600/10 border-blue-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-300 font-medium">Tokens do Plano</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {Math.floor(userCredits).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Award className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-600/20 to-orange-600/10 border-orange-600/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-orange-300 font-medium">Tokens Usados</p>
                    <p className="text-2xl font-bold text-orange-400">
                      {Math.floor(creditsUsed).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-600/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Seção principal - Grid responsivo */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Coluna esquerda - Ações principais */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Chat Jurídico - Destaque principal */}
              <Card className={`bg-gradient-to-r ${isBlocked ? 'from-red-500/20 to-red-600/20 border-red-500/30' : 'from-primary/20 to-secondary/20 border-primary/30'} overflow-hidden`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${isBlocked ? 'bg-red-500/20' : 'bg-primary/20'}`}>
                        <MessageSquare className={`w-8 h-8 ${isBlocked ? 'text-red-400' : 'text-primary'}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          Chat Jurídico IA
                          {isBlocked && (
                            <Badge variant="destructive" className="text-xs">
                              Expirado
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-slate-300">
                          {isBlocked ? 'Renove sua assinatura para continuar usando' : 'Consulte nossa IA especializada em direito brasileiro'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={currentPlan.badgeColor}
                      aria-label={currentPlan.badge}
                    >
                      {currentPlan.badge}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className={`text-lg font-bold ${isBlocked ? 'text-red-400' : 'text-primary'}`}>
                        {Math.floor(totalAvailableCredits).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">Tokens Disponíveis</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-green-400">Variável</div>
                      <div className="text-xs text-slate-400">Custo por Consulta</div>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-lg">
                      <div className="text-lg font-bold text-blue-400">24/7</div>
                      <div className="text-xs text-slate-400">Disponibilidade</div>
                    </div>
                  </div>

                  {isBlocked ? (
                    <div className="space-y-3">
                      <Button 
                        className="w-full py-3 text-lg font-semibold"
                        variant="destructive"
                        disabled
                        size="lg"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Acesso Bloqueado
                      </Button>
                      <div className="text-center">
                        <p className="text-sm text-red-400 mb-3">
                          Seu período gratuito expirou. Ative uma assinatura para continuar usando o chat.
                        </p>
                        <Button 
                          onClick={() => navigate('/comprar-creditos?reason=trial_expired&gate=chat')}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Renovar Agora
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => {
                        logFeatureUsage('chat_started_from_dashboard');
                        navigate("/chat?new=true");
                      }}
                      className="w-full bg-primary hover:bg-primary/90 py-3 text-lg font-semibold"
                      size="lg"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Iniciar Consulta Jurídica
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Agenda com Calendário */}
              <CalendarAgendaWidget />

              {/* Calculadoras Jurídicas */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calculator className="w-5 h-5 text-primary" />
                    Calculadoras Jurídicas
                  </CardTitle>
                  <CardDescription>
                    Ferramentas especializadas para cálculos jurídicos precisos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="group p-4 bg-gradient-to-br from-blue-600/10 to-blue-600/5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer"
                         onClick={() => {
                           logFeatureUsage('calculator_accessed', { type: 'contrato_bancario' });
                           navigate("/calculo-contrato-bancario");
                         }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                          <DollarSign className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-200">Contrato Bancário</h3>
                          <p className="text-xs text-blue-300/80">Juros e correção monetária</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs">
                          Calcular
                        </Button>
                      </div>
                    </div>
                     
                    <div className="group p-4 bg-gradient-to-br from-purple-600/10 to-purple-600/5 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                         onClick={() => {
                           logFeatureUsage('calculator_accessed', { type: 'pensao_alimenticia' });
                           navigate("/calculo-pensao-alimenticia");
                         }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                          <Heart className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-purple-200">Pensão Alimentícia</h3>
                          <p className="text-xs text-purple-300/80">Valores e correções</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-xs">
                          Calcular
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Documentos Jurídicos */}
              {/* Unlocked: Documentos Jurídicos always visible */}
                <Card className="relative overflow-hidden bg-slate-800/50 border-slate-700">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg text-white">Documentos Jurídicos</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(legalDocuments.length + savedDocs.length)} disponíveis
                      </Badge>
                    </div>
                    <CardDescription>
                      Modelos prontos para personalizar e usar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {LEGAL_DOCS_MAINTENANCE_MODE ? (
                      // Seção de documentos jurídicos em manutenção
                      <div className="relative">
                        {/* Conteúdo borrado */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 blur-sm grayscale opacity-30">
                          {[1,2,3,4,5,6,7,8].map((i) => (
                            <div key={i} className="group cursor-pointer">
                              <div className="bg-white rounded-lg p-3 h-32 relative overflow-hidden shadow-lg">
                                <div className="text-center border-b border-gray-300 pb-1 mb-2">
                                  <h1 className="font-bold text-[8px] text-gray-800 uppercase tracking-wide leading-tight">
                                    DOCUMENTO {i}
                                  </h1>
                                </div>
                                <div className="text-[6px] leading-tight text-gray-700 space-y-1">
                                  <div className="font-semibold">CONTRATANTE:</div>
                                  <div className="border-b border-gray-200 h-1"></div>
                                  <div className="font-semibold">CONTRATADO:</div>
                                  <div className="border-b border-gray-200 h-1"></div>
                                  <div className="font-semibold">OBJETO:</div>
                                  <div className="text-gray-500">O presente contrato...</div>
                                </div>
                                <div className="absolute bottom-1 left-1 right-1">
                                  <div className="bg-slate-800 text-white px-1 py-0.5 rounded text-[6px] flex justify-between items-center">
                                    <span>contrato</span>
                                    <span>3.000</span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 text-center">
                                <h3 className="font-medium text-xs text-white truncate">
                                  Documento Exemplo
                                </h3>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Overlay de manutenção */}
                        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center gap-4 rounded-lg min-h-[200px]">
                          <div className="p-4 bg-amber-500/20 rounded-full">
                            <Wrench className="w-10 h-10 text-amber-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-bold text-lg mb-2">Seção em Manutenção</h3>
                            <p className="text-slate-300 text-sm mb-3 px-6 max-w-md">
                              Estamos trabalhando para melhorar esta funcionalidade. Os documentos jurídicos estarão disponíveis em breve.
                            </p>
                            <p className="text-xs text-slate-400">
                              Obrigado pela paciência e compreensão.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Conteúdo normal dos documentos jurídicos
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {legalDocuments.slice(0, 8).map((doc) => (
                          <div 
                            key={doc.id}
                            className="group cursor-pointer"
                            onClick={() => openTemplateEditor(doc.id)}
                          >
                            <div className="bg-white rounded-lg p-3 h-32 relative overflow-hidden shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                              <div className="text-center border-b border-gray-300 pb-1 mb-2">
                                <h1 className="font-bold text-[8px] text-gray-800 uppercase tracking-wide leading-tight">
                                  {doc.title}
                                </h1>
                              </div>
                              
                              <div className="text-[6px] leading-tight text-gray-700 space-y-1">
                                {doc.category === 'contrato' && (
                                  <>
                                    <div className="font-semibold">CONTRATANTE:</div>
                                    <div className="border-b border-gray-200 h-1"></div>
                                    <div className="font-semibold">CONTRATADO:</div>
                                    <div className="border-b border-gray-200 h-1"></div>
                                    <div className="font-semibold">OBJETO:</div>
                                    <div className="text-gray-500">O presente contrato...</div>
                                  </>
                                )}
                                {doc.category === 'peticao' && (
                                  <>
                                    <div className="text-center font-semibold">PETIÇÃO INICIAL</div>
                                    <div className="font-semibold">Requerente:</div>
                                    <div className="border-b border-gray-200 h-1"></div>
                                    <div className="font-semibold">DOS FATOS:</div>
                                    <div className="text-gray-500">Vem o requerente...</div>
                                  </>
                                )}
                                {doc.category === 'procuracao' && (
                                  <>
                                    <div className="text-center font-bold">PROCURAÇÃO</div>
                                    <div className="font-semibold">OUTORGANTE:</div>
                                    <div className="border-b border-gray-200 h-1"></div>
                                    <div className="font-semibold">PODERES:</div>
                                    <div className="text-gray-500">☐ Representar</div>
                                  </>
                                )}
                                {doc.category === 'documento' && (
                                  <>
                                    <div className="text-center font-bold">DECLARAÇÃO</div>
                                    <div className="mt-2 text-gray-600">
                                      <div>Eu, _____________,</div>
                                      <div>declaro que</div>
                                      <div className="border-b border-gray-200 h-1"></div>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div className="absolute bottom-1 left-1 right-1">
                                <div className="bg-slate-800 text-white px-1 py-0.5 rounded text-[6px] flex justify-between items-center">
                                  <span className="capitalize">{doc.category}</span>
                                  <span>{(doc.min_tokens_required || 3000).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-center">
                              <h3 className="font-medium text-xs text-white truncate">
                                {doc.title}
                              </h3>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!LEGAL_DOCS_MAINTENANCE_MODE && (
                      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-600">
                        <p className="text-xs text-slate-400 text-center">
                          💡 <strong>Dica:</strong> Clique em qualquer documento para personalizar e baixar
                        </p>
                      </div>
                    )}

                    {DOCS_MAINTENANCE_MODE ? (
                      // Seção em manutenção com efeito borrado
                      <div className="mt-6 relative">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Meus Documentos
                          </h4>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-slate-600 hover:bg-slate-700 text-xs"
                            disabled
                          >
                            Ver todos
                          </Button>
                        </div>
                        
                        {/* Conteúdo borrado */}
                        <div className="space-y-2 blur-sm grayscale opacity-50">
                          {[1,2,3,4].map((i) => (
                            <div
                              key={i}
                              className="w-full p-2 rounded-md bg-slate-900/50 border border-slate-600"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white truncate">Documento {i}</span>
                                <span className="text-[10px] text-slate-400">12/08/2025</span>
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-[11px]">
                                <span className="text-primary">Renomear</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-blue-300">Duplicar</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Overlay de manutenção */}
                        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-lg">
                          <div className="p-3 bg-amber-500/20 rounded-full">
                            <Wrench className="w-8 h-8 text-amber-400" />
                          </div>
                          <div className="text-center">
                            <h3 className="text-white font-semibold mb-1">Seção em Manutenção</h3>
                            <p className="text-slate-300 text-sm mb-3 px-4">
                              Estamos aprimorando esta funcionalidade. Estará disponível em breve.
                            </p>
                            <p className="text-xs text-slate-400">
                              Obrigado pela compreensão.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : savedDocs.length > 0 ? (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Meus Documentos
                          </h4>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-slate-600 hover:bg-slate-700 text-xs"
                            onClick={() => navigate('/meus-documentos')}
                          >
                            Ver todos
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {savedDocs.slice(0,4).map((d) => (
                            <div
                              key={d.id}
                              onClick={() => navigate('/meus-documentos')}
                              className="w-full cursor-pointer p-2 rounded-md bg-slate-900/50 border border-slate-600 hover:bg-slate-800 transition"
                              role="button"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-white truncate">{d.title}</span>
                                <span className="text-[10px] text-slate-400">{new Date(d.updated_at).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-3 text-[11px]">
                                <button
                                  className="text-primary hover:underline"
                                  onClick={(e) => { e.stopPropagation(); renameSavedDoc(d); }}
                                >
                                  Renomear
                                </button>
                                <span className="text-slate-600">•</span>
                                <button
                                  className="text-blue-300 hover:underline"
                                  onClick={(e) => { e.stopPropagation(); duplicateSavedDoc(d); }}
                                >
                                  Duplicar
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                  </CardContent>
                  {isTrialExpired && (
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                      <p className="text-white font-medium">Acesso bloqueado</p>
                      <p className="text-slate-300 text-xs px-6 text-center">Assine para criar e editar Documentos Jurídicos.</p>
                      <Button onClick={() => navigate('/comprar-creditos')} className="bg-primary hover:bg-primary/90">Assinar agora</Button>
                    </div>
                  )}
                </Card>
               {/* end unlocked section */}
            </div>

            {/* Coluna direita - Informações e ações */}
            <div className="space-y-6">
              
              {/* Resumo de Tokens */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Resumo de Tokens
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-300">Total Disponível</span>
                      <span className="font-bold text-primary">
                        {Math.floor(totalAvailableCredits).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Uso</span>
                        <span className="text-slate-400">{getUsagePercentage().toFixed(1)}%</span>
                      </div>
                      <Progress value={getUsagePercentage()} className="h-2" />
                    </div>

                      <div className={`grid ${isTrial ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-2`}>
                        {isTrial && (
                          <div className="text-center p-2 bg-green-600/10 rounded-lg">
                            <div className="text-sm font-bold text-green-400">{Math.floor(dailyCredits)}</div>
                            <div className="text-xs text-slate-400">Teste</div>
                          </div>
                        )}
                        <div className="text-center p-2 bg-blue-600/10 rounded-lg">
                          <div className="text-sm font-bold text-blue-400">{Math.floor(userCredits)}</div>
                          <div className="text-xs text-slate-400">Plano</div>
                        </div>
                      </div>
                  </div>
                  
                  {/* Status da Conta */}
                  <div className="pt-2">
                    <div className="text-xs text-slate-400 mb-1">Status da Conta</div>
                     {planType === 'Essencial' && profile?.subscription_status === 'active' ? (
                       <div className="flex items-center gap-2">
                         <Badge className="bg-primary text-white">Assinante</Badge>
                         {profile?.subscription_end_date && (
                           <span className="text-xs text-slate-300">renova em {new Date(profile.subscription_end_date).toLocaleDateString('pt-BR')}</span>
                         )}
                       </div>
                     ) : (
                       <div className="flex items-center gap-2">
                         <Badge className="bg-slate-600 text-white">Período Gratuito</Badge>
                          {profile?.trial_end_date && (
                            <span className="text-xs text-slate-300">
                              até {new Date(profile.trial_end_date).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                       </div>
                     )}
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-slate-600">
                    {canPurchaseTokens ? (
                      <Button 
                        onClick={() => navigate("/comprar-creditos")}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Comprar Tokens Extras
                      </Button>
                    ) : isEssentialSubscriber ? (
                      <Button 
                        onClick={() => navigate("/comprar-creditos")}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Gerenciar Plano
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => navigate("/comprar-creditos")}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Assinar Plano Essencial
                      </Button>
                    )}
                    <Button 
                      onClick={() => navigate("/historico-transacoes")}
                      variant="outline"
                      className="w-full border-slate-600 hover:bg-slate-700"
                    >
                      <History className="w-4 h-4 mr-2" />
                      Histórico
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Consultas Recentes */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="w-5 h-5 text-primary" />
                    Consultas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentQueries.length === 0 ? (
                    <div className="text-center py-6">
                      <MessageSquare className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        Nenhuma consulta ainda
                      </p>
                      <p className="text-xs text-slate-500">
                        Comece uma conversa no chat
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentQueries.slice(0, 3).map((query) => (
                        <div
                          key={query.id}
                          role="button"
                          aria-label="Abrir conversa"
                          onClick={() => {
                            if (isMobile) {
                              navigate(`/chat?show-history=true`);
                            } else {
                              navigate(`/chat?session=${encodeURIComponent(query.session_id ?? query.id)}&msg=${encodeURIComponent(query.id)}`);
                            }
                          }}
                          className="p-3 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <p className="text-sm text-white line-clamp-2 mb-2">
                            {query.prompt_text}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              {new Date(query.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {query.credits_consumed && (
                              <Badge variant="outline" className="text-xs">
                                {(query.credits_consumed * 1000).toLocaleString()} tokens
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        onClick={() => navigate("/chat?show-history=true")}
                        variant="outline"
                        className="w-full border-slate-600 hover:bg-slate-700 text-xs"
                      >
                        Ver Todas as Conversas
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      onClick={() => DOCS_MAINTENANCE_MODE ? null : navigate("/meus-documentos")}
                      variant="outline"
                      className={`justify-start border-slate-600 ${DOCS_MAINTENANCE_MODE ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700'}`}
                      disabled={DOCS_MAINTENANCE_MODE}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Meus Documentos
                      {DOCS_MAINTENANCE_MODE && (
                        <Badge variant="outline" className="ml-2 text-xs">Em Manutenção</Badge>
                      )}
                    </Button>
                    <Button 
                      onClick={() => navigate("/minha-conta")}
                      variant="outline"
                      className="justify-start border-slate-600 hover:bg-slate-700"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Minha Conta
                    </Button>
                    <Button 
                      onClick={() => navigate("/suporte")}
                      variant="outline"
                      className="justify-start border-slate-600 hover:bg-slate-700"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Suporte
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
            </div>
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
        <DialogContent className="max-w-6xl bg-slate-900 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar Modelo</DialogTitle>
          </DialogHeader>
          {templateLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p>Carregando modelo...</p>
              </div>
            </div>
          ) : (
            <MarkdownEditor
              title={templateTitle}
              onTitleChange={setTemplateTitle}
              content={templateContent}
              onContentChange={setTemplateContent}
              onSave={saveTemplateAsMyDoc}
              onCancel={() => setTemplateOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal */}
      <DocumentViewer
        documentId={selectedDocumentId}
        isOpen={isDocumentViewerOpen}
        onClose={() => {
          setIsDocumentViewerOpen(false);
          setSelectedDocumentId(null);
        }}
      />
    </div>
  );
}