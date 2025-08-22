import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calculator, Heart, TrendingUp, FileText, Zap, Users, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import UserMenu from "@/components/UserMenu";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { useExportDocument } from "@/hooks/useExportDocument";
import HistoricoPensaoModal from "@/components/HistoricoPensaoModal";
import { useUserTimezone } from "@/hooks/useUserTimezone";


interface Pagamento {
  data: string;
  valor: string;
  observacao: string;
}

interface CalculoResult {
  valorPensao: number;
  percentualRenda: number;
  valorTotalAtrasado: number;
  multa: number;
  juros: number;
  valorCorrigido: number;
  detalhamento: string;
  totalParcelas?: number;
  saldoDevedor?: number;
  proximoVencimento?: string;
}

const CalculoPensaoAlimenticia = () => {
  const navigate = useNavigate();
  const { useTokens, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculoResult | null>(null);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const { visible: menuVisible } = useScrollDirection();
  const { copyCalculoPensao, loading: exportLoading } = useExportDocument();
  const { userTimezone } = useUserTimezone();
  
  const [formData, setFormData] = useState({
    numeroFilhos: '1',
    idadesFilhos: [''],
    valorEstipulado: '',
    diaVencimento: '5',
    dataInicioObrigacao: '',
    pagamentos: [] as Pagamento[],
    observacoes: ''
  });

  const handleInputChange = (field: string, value: string | Pagamento[]) => {
    if (field === 'numeroFilhos' && typeof value === 'string') {
      const numFilhos = parseInt(value);
      const novasIdades = Array.from({ length: numFilhos }, (_, i) => 
        formData.idadesFilhos[i] || ''
      );
      setFormData(prev => ({ 
        ...prev, 
        numeroFilhos: value,
        idadesFilhos: novasIdades
      }));
    } else if (field === 'pagamentos' && Array.isArray(value)) {
      setFormData(prev => ({ ...prev, pagamentos: value }));
    } else if (typeof value === 'string') {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleIdadeChange = (index: number, value: string) => {
    const novasIdades = [...formData.idadesFilhos];
    novasIdades[index] = value;
    setFormData(prev => ({ ...prev, idadesFilhos: novasIdades }));
  };

  const handleCalcular = async () => {
    if (!formData.valorEstipulado || !formData.dataInicioObrigacao) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Calculadora de pensão alimentícia agora é gratuita - não consome tokens

      // Preparar dados para envio - converter idades para compatibilidade
      const dadosEnvio = {
        ...formData,
        idadeFilho: formData.idadesFilhos[0] || '', // Primeira idade para compatibilidade
        idadesFilhos: formData.idadesFilhos,
        tipoCalculo: 'fixo' // Sempre valor fixo agora
      };

      const { data, error } = await supabase.functions.invoke('calculo-pensao-alimenticia', {
        body: dadosEnvio
      });

      if (error) throw error;

      setResult(data);
      toast.success("Cálculo realizado com sucesso!");
    } catch (error) {
      console.error('Erro ao calcular:', error);
      toast.error("Erro ao realizar o cálculo");
    } finally {
      setLoading(false);
    }
  };

  const totalTokens = (profile?.token_balance || 0) + (profile?.plan_tokens || 0);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-hidden">
      {/* Header fixo */}
      <div className="flex-shrink-0 bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img 
                src="/lovable-uploads/640a3b5c-aae7-485a-a595-a0d750c13d9b.png" 
                alt="Oráculo Jurídico"
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Cálculo de Pensão Alimentícia
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Cálculo de valores, atrasos e correções
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
              
              {/* Histórico Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoricoModalOpen(true)}
                className="hidden md:flex items-center gap-2 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Histórico
              </Button>
              
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal com scroll interno */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de informações sobre o cálculo */}
          <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-600/20 rounded-xl">
                    <Scale className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Calculadora de Pensão</h3>
                    <p className="text-sm text-slate-300">
                      Cálculo preciso de pensão alimentícia
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-pink-400">Atrasos</div>
                  <div className="text-xs text-slate-400">Juros e Multa</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">Correção</div>
                  <div className="text-xs text-slate-400">Monetária</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-green-400">Relatório</div>
                  <div className="text-xs text-slate-400">Detalhado</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid principal - Formulário e Resultado */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Formulário */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Users className="w-5 h-5 text-primary" />
                  Dados da Pensão
                </CardTitle>
                <CardDescription>
                  Informe os dados para cálculo da pensão alimentícia
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valorEstipulado" className="text-sm text-slate-300">Valor Estipulado da Pensão *</Label>
                  <Input
                    id="valorEstipulado"
                    type="number"
                    step="0.01"
                    placeholder="500.00"
                    value={formData.valorEstipulado}
                    onChange={(e) => handleInputChange('valorEstipulado', e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroFilhos" className="text-sm text-slate-300">Número de Filhos *</Label>
                  <Select value={formData.numeroFilhos} onValueChange={(value) => handleInputChange('numeroFilhos', value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-primary text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 filho</SelectItem>
                      <SelectItem value="2">2 filhos</SelectItem>
                      <SelectItem value="3">3 filhos</SelectItem>
                      <SelectItem value="4">4 filhos</SelectItem>
                      <SelectItem value="5">5+ filhos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos dinâmicos para idades dos filhos */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Idades dos Filhos (anos)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formData.idadesFilhos.map((idade, index) => (
                      <Input
                        key={index}
                        type="number"
                        placeholder={`Idade do ${index + 1}º filho`}
                        value={idade}
                        onChange={(e) => handleIdadeChange(index, e.target.value)}
                        className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diaVencimento" className="text-sm text-slate-300">Dia do Vencimento *</Label>
                  <Select value={formData.diaVencimento} onValueChange={(value) => handleInputChange('diaVencimento', value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-primary text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                        <SelectItem key={dia} value={dia.toString()}>Dia {dia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-400">Dia específico para vencimentos mensais (evita feriados)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataInicioObrigacao" className="text-sm text-slate-300">Data de Início da Obrigação *</Label>
                  <Input
                    id="dataInicioObrigacao"
                    type="date"
                    value={formData.dataInicioObrigacao}
                    onChange={(e) => handleInputChange('dataInicioObrigacao', e.target.value)}
                    className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                  />
                  <p className="text-xs text-slate-400">Data da determinação judicial ou acordo</p>
                </div>

                {/* Seção de Pagamentos */}
                <div className="space-y-4 border-t border-slate-600 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-slate-300 font-semibold">Histórico de Pagamentos</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const novosPagamentos = [...formData.pagamentos, { data: '', valor: '', observacao: '' }];
                        handleInputChange('pagamentos', novosPagamentos);
                      }}
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                    >
                      Adicionar Pagamento
                    </Button>
                  </div>
                  
                  {formData.pagamentos.map((pagamento, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-700/30 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Data do Pagamento</Label>
                        <Input
                          type="date"
                          value={pagamento.data}
                          onChange={(e) => {
                            const novosPagamentos = [...formData.pagamentos];
                            novosPagamentos[index].data = e.target.value;
                            handleInputChange('pagamentos', novosPagamentos);
                          }}
                          className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-400">Valor Pago</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="250.00"
                          value={pagamento.valor}
                          onChange={(e) => {
                            const novosPagamentos = [...formData.pagamentos];
                            novosPagamentos[index].valor = e.target.value;
                            handleInputChange('pagamentos', novosPagamentos);
                          }}
                          className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                        />
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-slate-400">Observação</Label>
                          <Input
                            placeholder="Pagamento parcial"
                            value={pagamento.observacao}
                            onChange={(e) => {
                              const novosPagamentos = [...formData.pagamentos];
                              novosPagamentos[index].observacao = e.target.value;
                              handleInputChange('pagamentos', novosPagamentos);
                            }}
                            className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const novosPagamentos = formData.pagamentos.filter((_, i) => i !== index);
                            handleInputChange('pagamentos', novosPagamentos);
                          }}
                          className="text-red-400 hover:bg-red-900/20 px-2"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {formData.pagamentos.length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-sm">
                      Adicione os pagamentos realizados para calcular o valor em atraso
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-sm text-slate-300">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Informações adicionais sobre a pensão..."
                    value={formData.observacoes}
                    onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    className="min-h-[80px] bg-slate-700 border-slate-600 focus:border-primary text-white"
                  />
                </div>

                <Button 
                  onClick={handleCalcular} 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 py-3 text-lg font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Calculando...
                    </div>
                  ) : (
                    <>
                      <Calculator className="h-5 w-5 mr-2" />
                      Calcular
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado */}
            {result ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Resultado do Cálculo
                  </CardTitle>
                  <CardDescription>
                    Valores calculados conforme os dados informados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {/* Cards de resultados principais */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 bg-gradient-to-br from-purple-600/20 to-purple-600/10 border border-purple-500/30 rounded-lg">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-xs text-purple-300 font-medium">Valor da Pensão</p>
                           <p className="text-2xl font-bold text-purple-400">
                             R$ {result.valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </p>
                         </div>
                         <Heart className="w-8 h-8 text-purple-400" />
                       </div>
                     </div>

                     <div className="p-4 bg-gradient-to-br from-blue-600/20 to-blue-600/10 border border-blue-500/30 rounded-lg">
                       <div className="flex items-center justify-between">
                         <div>
                           <p className="text-xs text-blue-300 font-medium">Percentual da Renda</p>
                           <p className="text-2xl font-bold text-blue-400">
                             {result.percentualRenda.toFixed(1)}%
                           </p>
                         </div>
                         <TrendingUp className="w-8 h-8 text-blue-400" />
                       </div>
                     </div>
                   </div>

                   {/* Informações adicionais se disponíveis */}
                   {(result.totalParcelas || result.proximoVencimento) && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {result.totalParcelas && (
                         <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                           <p className="text-xs text-indigo-300">Total de Parcelas</p>
                           <p className="text-lg font-semibold text-indigo-400">
                             {result.totalParcelas} vencimentos
                           </p>
                         </div>
                       )}
                       {result.proximoVencimento && (
                         <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                           <p className="text-xs text-cyan-300">Próximo Vencimento</p>
                           <p className="text-lg font-semibold text-cyan-400">
                             {result.proximoVencimento}
                           </p>
                         </div>
                       )}
                     </div>
                   )}

                  {result.valorTotalAtrasado > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-300">Total em Atraso</p>
                        <p className="text-lg font-semibold text-red-400">
                          R$ {result.valorTotalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                        <p className="text-xs text-orange-300">Multa + Juros</p>
                        <p className="text-lg font-semibold text-orange-400">
                          R$ {(result.multa + result.juros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Valor total corrigido */}
                  <div className="p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-green-300 mb-1">Valor Total Corrigido</p>
                      <p className="text-3xl font-bold text-green-400">
                        R$ {result.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                   {/* Detalhamento */}
                   <div className="bg-slate-900/50 rounded-lg border border-slate-600 p-4">
                     <div className="flex items-center justify-between mb-3">
                       <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                         <FileText className="w-4 h-4 text-primary" />
                         Detalhamento do Cálculo
                       </h4>
                       <Button
                         onClick={() => copyCalculoPensao(result, formData)}
                         disabled={exportLoading}
                         variant="outline"
                         size="sm"
                         className="bg-primary/10 border-primary/30 text-primary hover:bg-primary/20 text-xs px-2 py-1"
                       >
                         {exportLoading ? (
                           <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
                         ) : (
                           <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                         )}
                         Copiar
                       </Button>
                     </div>
                     <div className="max-h-64 overflow-y-auto">
                       <pre className="text-xs whitespace-pre-wrap break-words text-slate-300 leading-relaxed overflow-wrap-anywhere">
                         {result.detalhamento}
                       </pre>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Heart className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Aguardando Dados
                  </h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Preencha os dados da pensão ao lado para realizar o cálculo 
                    de valores, atrasos e correções monetárias.
                  </p>
                  
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <span>✓ Cálculo por percentual ou valor fixo</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <span>✓ Juros e multa por atraso</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <span>✓ Múltiplos filhos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informações importantes */}
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <Scale className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 mb-2">Informações Legais</h4>
                  <div className="space-y-1 text-sm text-amber-300/80">
                    <p>• Pensão devida até 18 anos (ou 24 se universitário)</p>
                    <p>• Percentual varia entre 15% a 30% da renda por filho</p>
                    <p>• Atraso: multa de 2% + juros de 1% ao mês</p>
                    <p>• Valor pode ser revisado mediante mudança financeira</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Histórico */}
      <HistoricoPensaoModal
        isOpen={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        onSelectCalculation={(calculo) => {
          // Preencher formulário com dados do histórico
          setFormData({
            numeroFilhos: calculo.numero_filhos.toString(),
            idadesFilhos: calculo.idades_filhos.map(idade => idade.toString()),
            valorEstipulado: calculo.valor_fixo?.toString() || '',
            diaVencimento: '5',
            dataInicioObrigacao: calculo.data_inicio || '',
            pagamentos: [],
            observacoes: calculo.observacoes || ''
          });
          toast.success('Dados do histórico carregados!');
        }}
      />
    </div>
  );
};

export default CalculoPensaoAlimenticia;