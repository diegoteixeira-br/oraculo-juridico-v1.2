import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarIcon, Plus, Trash2, Copy, Download, ToggleLeft, ToggleRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { EpisodioCustodia, Remissao, EventoProcessual, DadosSentenca, ResultadoCalculoV2 } from '@/types/pena';
import { calcularDatasChave, converterParaDias, obterStatusAtual } from '@/lib/pena';
import dayjs from 'dayjs';
import TimelineExecucao from './TimelineExecucao';

export default function HistoricoCustodia() {
  const { toast } = useToast();
  
  // Estados principais
  const [dadosSentenca, setDadosSentenca] = useState<DadosSentenca>({
    totalDias: 0,
    regimeInicial: 'Fechado',
    fracaoProgressao: 1/6,
    fracaoLivramento: 1/3
  });
  
  const [episodios, setEpisodios] = useState<EpisodioCustodia[]>([]);
  const [remissoes, setRemissoes] = useState<Remissao[]>([]);
  const [eventos, setEventos] = useState<EventoProcessual[]>([]);
  const [incluirDiaSoltura, setIncluirDiaSoltura] = useState(false);
  const [resultado, setResultado] = useState<ResultadoCalculoV2 | null>(null);
  
  // Estados dos formulários
  const [novoEpisodio, setNovoEpisodio] = useState<Partial<EpisodioCustodia>>({
    tipo: 'Prisao Preventiva',
    computavel: true
  });
  const [novaRemissao, setNovaRemissao] = useState<Partial<Remissao>>({
    motivo: 'Trabalho',
    dias: 0
  });
  const [novoEvento, setNovoEvento] = useState<Partial<EventoProcessual>>({
    tipo: 'Condenacao'
  });
  
  // Recalcular sempre que os dados mudarem
  useEffect(() => {
    if (dadosSentenca.totalDias > 0) {
      const hoje = dayjs().format('YYYY-MM-DD');
      const novoResultado = calcularDatasChave(
        dadosSentenca,
        episodios,
        remissoes,
        hoje,
        incluirDiaSoltura
      );
      setResultado(novoResultado);
    }
  }, [dadosSentenca, episodios, remissoes, incluirDiaSoltura]);
  
  // Funções para gerenciar episódios
  const adicionarEpisodio = () => {
    if (!novoEpisodio.tipo || !novoEpisodio.inicio) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha tipo e data de início",
        variant: "destructive"
      });
      return;
    }
    
    const episodio: EpisodioCustodia = {
      id: crypto.randomUUID(),
      tipo: novoEpisodio.tipo!,
      inicio: novoEpisodio.inicio!,
      fim: novoEpisodio.fim,
      computavel: novoEpisodio.computavel ?? true,
      observacao: novoEpisodio.observacao
    };
    
    setEpisodios([...episodios, episodio]);
    setNovoEpisodio({ tipo: 'Prisao Preventiva', computavel: true });
    
    toast({
      title: "Episódio adicionado",
      description: "Episódio de custódia adicionado com sucesso"
    });
  };
  
  const duplicarEpisodio = (episodio: EpisodioCustodia) => {
    const duplicado: EpisodioCustodia = {
      ...episodio,
      id: crypto.randomUUID(),
      fim: undefined // Limpar data fim para permitir ajuste
    };
    setEpisodios([...episodios, duplicado]);
  };
  
  const excluirEpisodio = (id: string) => {
    setEpisodios(episodios.filter(ep => ep.id !== id));
  };
  
  const atualizarEpisodio = (id: string, dadosAtualizados: Partial<EpisodioCustodia>) => {
    setEpisodios(episodios.map(ep => 
      ep.id === id ? { ...ep, ...dadosAtualizados } : ep
    ));
  };
  
  // Funções para gerenciar remições
  const adicionarRemissao = () => {
    if (!novaRemissao.dataCredito || !novaRemissao.dias) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha data de crédito e quantidade de dias",
        variant: "destructive"
      });
      return;
    }
    
    const remissao: Remissao = {
      id: crypto.randomUUID(),
      dataCredito: novaRemissao.dataCredito!,
      dias: novaRemissao.dias!,
      motivo: novaRemissao.motivo!,
      observacao: novaRemissao.observacao
    };
    
    setRemissoes([...remissoes, remissao]);
    setNovaRemissao({ motivo: 'Trabalho', dias: 0 });
    
    toast({
      title: "Remição adicionada",
      description: "Remição adicionada com sucesso"
    });
  };
  
  const excluirRemissao = (id: string) => {
    setRemissoes(remissoes.filter(r => r.id !== id));
  };
  
  // Funções para gerenciar eventos
  const adicionarEvento = () => {
    if (!novoEvento.data || !novoEvento.tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha data e tipo do evento",
        variant: "destructive"
      });
      return;
    }
    
    const evento: EventoProcessual = {
      id: crypto.randomUUID(),
      data: novoEvento.data!,
      tipo: novoEvento.tipo!,
      observacao: novoEvento.observacao
    };
    
    setEventos([...eventos, evento]);
    setNovoEvento({ tipo: 'Condenacao' });
  };
  
  const excluirEvento = (id: string) => {
    setEventos(eventos.filter(e => e.id !== id));
  };
  
  const exportarPDF = () => {
    toast({
      title: "Exportar PDF",
      description: "Funcionalidade em desenvolvimento"
    });
  };
  
  const hoje = dayjs().format('YYYY-MM-DD');
  const statusAtual = obterStatusAtual(episodios, hoje);
  
  return (
    <div className="space-y-6">
      {/* Configurações da Sentença */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Dados da Sentença</CardTitle>
          <CardDescription className="text-slate-400">
            Configure os parâmetros base para o cálculo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-200">Pena Total (anos)</Label>
              <Input
                type="number"
                value={dadosSentenca.totalDias / 365}
                onChange={(e) => setDadosSentenca({
                  ...dadosSentenca,
                  totalDias: Math.round(parseFloat(e.target.value || '0') * 365)
                })}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <Label className="text-slate-200">Fração Progressão</Label>
              <Select 
                value={dadosSentenca.fracaoProgressao.toString()}
                onValueChange={(value) => setDadosSentenca({
                  ...dadosSentenca,
                  fracaoProgressao: parseFloat(value)
                })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={(1/6).toString()}>1/6 (Primário)</SelectItem>
                  <SelectItem value={(1/4).toString()}>1/4 (Reincidente)</SelectItem>
                  <SelectItem value={(2/5).toString()}>2/5 (Hediondo Primário)</SelectItem>
                  <SelectItem value={(3/5).toString()}>3/5 (Hediondo Reincidente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-200">Fração Livramento</Label>
              <Select 
                value={dadosSentenca.fracaoLivramento?.toString() || ''}
                onValueChange={(value) => setDadosSentenca({
                  ...dadosSentenca,
                  fracaoLivramento: value ? parseFloat(value) : undefined
                })}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value={(1/3).toString()}>1/3</SelectItem>
                  <SelectItem value={(1/2).toString()}>1/2</SelectItem>
                  <SelectItem value={(2/3).toString()}>2/3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIncluirDiaSoltura(!incluirDiaSoltura)}
              className="text-slate-300 hover:text-white"
            >
              {incluirDiaSoltura ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              Incluir data da soltura no cômputo
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - Formulários */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Episódios de Custódia */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Episódios de Custódia</CardTitle>
              <CardDescription className="text-slate-400">
                Registre períodos de prisão e soltura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Formulário novo episódio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-slate-200">Tipo</Label>
                  <Select 
                    value={novoEpisodio.tipo || ''}
                    onValueChange={(value) => setNovoEpisodio({...novoEpisodio, tipo: value as any})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Prisao em Flagrante">Prisão em Flagrante</SelectItem>
                      <SelectItem value="Prisao Preventiva">Prisão Preventiva</SelectItem>
                      <SelectItem value="Prisao Temporaria">Prisão Temporária</SelectItem>
                      <SelectItem value="Cumprimento de Pena">Cumprimento de Pena</SelectItem>
                      <SelectItem value="Prisao Domiciliar">Prisão Domiciliar</SelectItem>
                      <SelectItem value="Internacao">Internação</SelectItem>
                      <SelectItem value="Outra">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-slate-200">Data Início</Label>
                  <Input
                    type="date"
                    value={novoEpisodio.inicio || ''}
                    onChange={(e) => setNovoEpisodio({...novoEpisodio, inicio: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-200">Data Fim (opcional)</Label>
                  <Input
                    type="date"
                    value={novoEpisodio.fim || ''}
                    onChange={(e) => setNovoEpisodio({...novoEpisodio, fim: e.target.value || undefined})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={novoEpisodio.computavel}
                    onCheckedChange={(checked) => setNovoEpisodio({...novoEpisodio, computavel: checked as boolean})}
                  />
                  <Label className="text-slate-200">Computável para detração</Label>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="text-slate-200">Observação</Label>
                  <Textarea
                    value={novoEpisodio.observacao || ''}
                    onChange={(e) => setNovoEpisodio({...novoEpisodio, observacao: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={2}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Button onClick={adicionarEpisodio} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Episódio
                  </Button>
                </div>
              </div>
              
              {/* Lista de episódios */}
              <div className="space-y-2">
                {episodios.map((episodio) => (
                  <div key={episodio.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{episodio.tipo}</span>
                          {!episodio.computavel && (
                            <span className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded">
                              Não computável
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">
                          {format(new Date(episodio.inicio), 'dd/MM/yyyy', { locale: ptBR })} 
                          {episodio.fim ? ` até ${format(new Date(episodio.fim), 'dd/MM/yyyy', { locale: ptBR })}` : ' (em curso)'}
                        </div>
                        {episodio.observacao && (
                          <div className="text-xs text-slate-500 mt-1">{episodio.observacao}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicarEpisodio(episodio)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => excluirEpisodio(episodio.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Remições */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Remições</CardTitle>
              <CardDescription className="text-slate-400">
                Registre créditos por trabalho, estudo ou leitura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Formulário nova remição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-slate-200">Data do Crédito</Label>
                  <Input
                    type="date"
                    value={novaRemissao.dataCredito || ''}
                    onChange={(e) => setNovaRemissao({...novaRemissao, dataCredito: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-200">Dias Remidos</Label>
                  <Input
                    type="number"
                    value={novaRemissao.dias || ''}
                    onChange={(e) => setNovaRemissao({...novaRemissao, dias: parseInt(e.target.value) || 0})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-200">Motivo</Label>
                  <Select 
                    value={novaRemissao.motivo || ''}
                    onValueChange={(value) => setNovaRemissao({...novaRemissao, motivo: value as any})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Trabalho">Trabalho</SelectItem>
                      <SelectItem value="Estudo">Estudo</SelectItem>
                      <SelectItem value="Leitura">Leitura</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-slate-200">Observação</Label>
                  <Input
                    value={novaRemissao.observacao || ''}
                    onChange={(e) => setNovaRemissao({...novaRemissao, observacao: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Button onClick={adicionarRemissao} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Remição
                  </Button>
                </div>
              </div>
              
              {/* Lista de remições */}
              <div className="space-y-2">
                {remissoes.map((remissao) => (
                  <div key={remissao.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{remissao.dias} dias</span>
                          <span className="text-sm text-slate-400">por {remissao.motivo}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          Creditado em {format(new Date(remissao.dataCredito), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        {remissao.observacao && (
                          <div className="text-xs text-slate-500 mt-1">{remissao.observacao}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => excluirRemissao(remissao.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Eventos Processuais */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Eventos Processuais</CardTitle>
              <CardDescription className="text-slate-400">
                Registre marcos importantes do processo (informativo)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Formulário novo evento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-700/30 rounded-lg">
                <div>
                  <Label className="text-slate-200">Data</Label>
                  <Input
                    type="date"
                    value={novoEvento.data || ''}
                    onChange={(e) => setNovoEvento({...novoEvento, data: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-200">Tipo</Label>
                  <Select 
                    value={novoEvento.tipo || ''}
                    onValueChange={(value) => setNovoEvento({...novoEvento, tipo: value as any})}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Condenacao">Condenação</SelectItem>
                      <SelectItem value="Unificacao">Unificação</SelectItem>
                      <SelectItem value="Progressao">Progressão</SelectItem>
                      <SelectItem value="Regressao">Regressão</SelectItem>
                      <SelectItem value="Livramento">Livramento</SelectItem>
                      <SelectItem value="Indulto">Indulto</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <Label className="text-slate-200">Observação</Label>
                  <Textarea
                    value={novoEvento.observacao || ''}
                    onChange={(e) => setNovoEvento({...novoEvento, observacao: e.target.value})}
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={2}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Button onClick={adicionarEvento} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Evento
                  </Button>
                </div>
              </div>
              
              {/* Lista de eventos */}
              <div className="space-y-2">
                {eventos.map((evento) => (
                  <div key={evento.id} className="p-3 bg-slate-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{evento.tipo}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          {format(new Date(evento.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        {evento.observacao && (
                          <div className="text-xs text-slate-500 mt-1">{evento.observacao}</div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => excluirEvento(evento.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Coluna lateral - Resultados */}
        <div className="space-y-6">
          
          {/* Status Atual */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Status Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={cn(
                  "inline-flex px-3 py-1 rounded-full text-sm font-medium",
                  statusAtual === 'Em custódia' 
                    ? "bg-red-600/20 text-red-400 border border-red-600/30"
                    : "bg-green-600/20 text-green-400 border border-green-600/30"
                )}>
                  {statusAtual}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Resultados */}
          {resultado && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="text-xs text-primary font-medium">Dias Cumpridos</div>
                    <div className="text-lg font-bold text-primary">{resultado.diasCumpridosHoje}</div>
                  </div>
                  
                  <div className="p-3 bg-emerald-600/10 border border-emerald-600/30 rounded-lg">
                    <div className="text-xs text-emerald-400 font-medium">Remições Acumuladas</div>
                    <div className="text-lg font-bold text-emerald-400">{resultado.remicoesAcumuladasHoje}</div>
                  </div>
                  
                  {resultado.dataProgressao && (
                    <div className="p-3 bg-blue-600/10 border border-blue-600/30 rounded-lg">
                      <div className="text-xs text-blue-400 font-medium">Progressão</div>
                      <div className="text-lg font-bold text-blue-400">
                        {format(new Date(resultado.dataProgressao), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  )}
                  
                  {resultado.dataLivramento && (
                    <div className="p-3 bg-purple-600/10 border border-purple-600/30 rounded-lg">
                      <div className="text-xs text-purple-400 font-medium">Livramento Condicional</div>
                      <div className="text-lg font-bold text-purple-400">
                        {format(new Date(resultado.dataLivramento), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-orange-600/10 border border-orange-600/30 rounded-lg">
                    <div className="text-xs text-orange-400 font-medium">Término da Pena</div>
                    <div className="text-lg font-bold text-orange-400">
                      {format(new Date(resultado.dataTermino), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>
                </div>
                
                <Button onClick={exportarPDF} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      {episodios.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Linha do Tempo da Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <TimelineExecucao 
              episodios={episodios}
              remissoes={remissoes}
              eventos={eventos}
              resultado={resultado}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}