import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { useExportDocument } from "@/hooks/useExportDocument";
import { FileText, Calendar, Heart, TrendingUp, X, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface CalculoPensaoHistorico {
  id: string;
  tipo_calculo: string;
  renda_alimentante: number | null;
  percentual_pensao: number | null;
  valor_fixo: number | null;
  numero_filhos: number;
  idades_filhos: number[];
  data_inicio: string;
  data_fim: string | null;
  meses_atraso: number | null;
  observacoes: string | null;
  valor_pensao: number;
  percentual_renda: number;
  valor_total_atrasado: number;
  multa: number;
  juros: number;
  valor_corrigido: number;
  detalhamento: string;
  created_at: string;
}

interface HistoricoPensaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCalculation?: (calculo: CalculoPensaoHistorico) => void;
}

const HistoricoPensaoModal: React.FC<HistoricoPensaoModalProps> = ({
  isOpen,
  onClose,
  onSelectCalculation
}) => {
  const [historico, setHistorico] = useState<CalculoPensaoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculoPensaoHistorico | null>(null);
  const { user } = useAuth();
  const { formatDateInUserTimezone } = useUserTimezone();
  const { copyCalculoPensao, loading: exportLoading } = useExportDocument();

  useEffect(() => {
    if (isOpen && user) {
      fetchHistorico();
    }
  }, [isOpen, user]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calculo_pensao_historico')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      // Transform the data to match our interface
      const transformedData = (data || []).map((item: any) => ({
        ...item,
        idades_filhos: Array.isArray(item.idades_filhos) ? item.idades_filhos : []
      }));
      setHistorico(transformedData);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const deleteCalculation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calculo_pensao_historico')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistorico(prev => prev.filter(item => item.id !== id));
      if (selectedCalculation?.id === id) {
        setSelectedCalculation(null);
      }
      toast.success('Cálculo removido do histórico');
    } catch (error) {
      console.error('Erro ao deletar cálculo:', error);
      toast.error('Erro ao remover cálculo');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Histórico de Cálculos de Pensão
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Seus cálculos anteriores de pensão alimentícia
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 gap-4 min-h-0">
          {/* Lista do histórico */}
          <div className="w-1/2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-300">
                {historico.length} cálculo(s) encontrado(s)
              </span>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cálculo encontrado</p>
                  <p className="text-sm">Seus cálculos aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map((calculo) => (
                    <Card 
                      key={calculo.id}
                      className={`cursor-pointer transition-all bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 ${
                        selectedCalculation?.id === calculo.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedCalculation(calculo)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm text-white flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              {formatDateInUserTimezone(calculo.created_at, 'dd/MM/yyyy HH:mm')}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400 mt-1">
                              {calculo.numero_filhos} filho(s) - {calculo.tipo_calculo}
                            </CardDescription>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCalculation(calculo.id);
                            }}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">Pensão:</span>
                            <div className="font-semibold text-purple-400">
                              {formatCurrency(calculo.valor_pensao)}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Total corrigido:</span>
                            <div className="font-semibold text-green-400">
                              {formatCurrency(calculo.valor_corrigido)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {calculo.tipo_calculo}
                          </Badge>
                          {calculo.valor_total_atrasado > 0 && (
                            <Badge variant="outline" className="text-xs border-red-600 text-red-300">
                              {calculo.meses_atraso}m atraso
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <Separator orientation="vertical" className="bg-slate-700" />

          {/* Detalhes do cálculo selecionado */}
          <div className="w-1/2 flex flex-col">
            {selectedCalculation ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Detalhes do Cálculo</h3>
                  <div className="flex gap-2">
                    {onSelectCalculation && (
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectCalculation(selectedCalculation);
                          onClose();
                        }}
                        className="bg-primary hover:bg-primary/90"
                      >
                        Usar Dados
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCalculation(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-4">
                    {/* Resumo dos valores */}
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-gradient-to-br from-purple-600/20 to-purple-600/10 border-purple-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-purple-300 font-medium">Valor da Pensão</p>
                              <p className="text-lg font-bold text-purple-400">
                                {formatCurrency(selectedCalculation.valor_pensao)}
                              </p>
                            </div>
                            <Heart className="w-6 h-6 text-purple-400" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-green-600/20 to-green-600/10 border-green-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-green-300 font-medium">Total Corrigido</p>
                              <p className="text-lg font-bold text-green-400">
                                {formatCurrency(selectedCalculation.valor_corrigido)}
                              </p>
                            </div>
                            <TrendingUp className="w-6 h-6 text-green-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Dados da pensão */}
                    <Card className="bg-slate-800/30 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">Dados da Pensão</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-400">Tipo de Cálculo:</span>
                            <div className="text-white font-medium capitalize">
                              {selectedCalculation.tipo_calculo}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Número de Filhos:</span>
                            <div className="text-white font-medium">
                              {selectedCalculation.numero_filhos}
                            </div>
                          </div>
                          {selectedCalculation.renda_alimentante && (
                            <div>
                              <span className="text-slate-400">Renda Alimentante:</span>
                              <div className="text-white font-medium">
                                {formatCurrency(selectedCalculation.renda_alimentante)}
                              </div>
                            </div>
                          )}
                          {selectedCalculation.percentual_pensao && (
                            <div>
                              <span className="text-slate-400">Percentual:</span>
                              <div className="text-white font-medium">
                                {selectedCalculation.percentual_pensao}%
                              </div>
                            </div>
                          )}
                          {selectedCalculation.valor_fixo && (
                            <div>
                              <span className="text-slate-400">Valor Fixo:</span>
                              <div className="text-white font-medium">
                                {formatCurrency(selectedCalculation.valor_fixo)}
                              </div>
                            </div>
                          )}
                          <div>
                            <span className="text-slate-400">Data Início:</span>
                            <div className="text-white font-medium">
                              {new Date(selectedCalculation.data_inicio).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                          {selectedCalculation.data_fim && (
                            <div>
                              <span className="text-slate-400">Data Fim:</span>
                              <div className="text-white font-medium">
                                {new Date(selectedCalculation.data_fim).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {selectedCalculation.idades_filhos.length > 0 && (
                          <div className="pt-2 border-t border-slate-700">
                            <span className="text-slate-400">Idades dos Filhos:</span>
                            <div className="text-white font-medium text-xs mt-1">
                              {selectedCalculation.idades_filhos.join(', ')} anos
                            </div>
                          </div>
                        )}
                        
                        {selectedCalculation.observacoes && (
                          <div className="pt-2 border-t border-slate-700">
                            <span className="text-slate-400">Observações:</span>
                            <div className="text-white font-medium text-xs mt-1">
                              {selectedCalculation.observacoes}
                            </div>
                          </div>
                        )}

                        {selectedCalculation.valor_total_atrasado > 0 && (
                          <div className="pt-2 border-t border-slate-700">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-slate-400">Total Atrasado:</span>
                                <div className="text-red-400 font-medium">
                                  {formatCurrency(selectedCalculation.valor_total_atrasado)}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">Multa + Juros:</span>
                                <div className="text-orange-400 font-medium">
                                  {formatCurrency(selectedCalculation.multa + selectedCalculation.juros)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Valores calculados */}
                    <Card className="bg-slate-800/30 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">Breakdown do Cálculo</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-3">
                            <span className="text-purple-300 text-xs">Base Mensal</span>
                            <div className="text-purple-400 font-semibold">
                              {formatCurrency(selectedCalculation.valor_pensao)}
                            </div>
                          </div>
                          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
                            <span className="text-blue-300 text-xs">% da Renda</span>
                            <div className="text-blue-400 font-semibold">
                              {selectedCalculation.percentual_renda.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                            <span className="text-green-300 text-xs">Total Final</span>
                            <div className="text-green-400 font-semibold">
                              {formatCurrency(selectedCalculation.valor_corrigido)}
                            </div>
                          </div>
                        </div>
                        
                        {selectedCalculation.valor_total_atrasado > 0 && (
                          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700">
                            <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
                              <span className="text-red-300 text-xs">Em Atraso</span>
                              <div className="text-red-400 font-semibold">
                                {formatCurrency(selectedCalculation.valor_total_atrasado)}
                              </div>
                            </div>
                            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3">
                              <span className="text-yellow-300 text-xs">Multa</span>
                              <div className="text-yellow-400 font-semibold">
                                {formatCurrency(selectedCalculation.multa)}
                              </div>
                            </div>
                            <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-3">
                              <span className="text-orange-300 text-xs">Juros</span>
                              <div className="text-orange-400 font-semibold">
                                {formatCurrency(selectedCalculation.juros)}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Detalhamento completo */}
                    <Card className="bg-slate-800/30 border-slate-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Relatório Detalhado
                          </CardTitle>
                          <Button
                            onClick={() => {
                              const formData = {
                                tipoCalculo: selectedCalculation.tipo_calculo,
                                rendaAlimentante: selectedCalculation.renda_alimentante?.toString() || '',
                                percentualPensao: selectedCalculation.percentual_pensao?.toString() || '',
                                valorFixo: selectedCalculation.valor_fixo?.toString() || '',
                                numeroFilhos: selectedCalculation.numero_filhos.toString(),
                                idadesFilhos: selectedCalculation.idades_filhos.map(idade => idade.toString()),
                                dataInicio: selectedCalculation.data_inicio,
                                dataFim: selectedCalculation.data_fim || '',
                                mesesAtraso: selectedCalculation.meses_atraso?.toString() || '',
                                observacoes: selectedCalculation.observacoes || ''
                              };
                              const result = {
                                valorPensao: selectedCalculation.valor_pensao,
                                percentualRenda: selectedCalculation.percentual_renda,
                                valorTotalAtrasado: selectedCalculation.valor_total_atrasado,
                                multa: selectedCalculation.multa,
                                juros: selectedCalculation.juros,
                                valorCorrigido: selectedCalculation.valor_corrigido,
                                detalhamento: selectedCalculation.detalhamento
                              };
                              copyCalculoPensao(result, formData);
                            }}
                            disabled={exportLoading}
                            size="sm"
                            className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20"
                          >
                            {exportLoading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                Copiando...
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copiar
                              </div>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-slate-900/50 rounded-lg p-4 max-h-80 overflow-y-auto">
                          <div className="text-xs text-slate-200 leading-relaxed">
                            {selectedCalculation.detalhamento.split('\n').map((linha, index) => {
                              // Destacar títulos e seções
                              if (linha.includes('CÁLCULO DE PENSÃO ALIMENTÍCIA')) {
                                return <div key={index} className="text-primary text-sm font-bold mb-3">{linha}</div>;
                              }
                              if (linha.includes('Dados da Pensão:') || linha.includes('Cálculos:') || linha.includes('Valores em Atraso:')) {
                                return <div key={index} className="text-purple-400 font-semibold text-sm mt-3 mb-2">{linha}</div>;
                              }
                              if (linha.includes('Observações Legais:') || linha.includes('Observações Adicionais:')) {
                                return <div key={index} className="text-green-400 font-semibold text-sm mt-3 mb-2">{linha}</div>;
                              }
                              if (linha.startsWith('-') && linha.includes(':')) {
                                const [label, value] = linha.split(':');
                                return (
                                  <div key={index} className="flex justify-between items-center my-1">
                                    <span className="text-slate-400">{label.replace('-', '').trim()}:</span>
                                    <span className="text-slate-200 font-medium">{value}</span>
                                  </div>
                                );
                              }
                              if (linha.match(/^\d+\./)) {
                                const [number, ...rest] = linha.split('.');
                                return (
                                  <div key={index} className="flex items-start gap-2 my-1">
                                    <span className="text-blue-400 font-semibold min-w-[20px]">{number}.</span>
                                    <span className="text-slate-200">{rest.join('.').trim()}</span>
                                  </div>
                                );
                              }
                              if (linha.includes('R$')) {
                                return <div key={index} className="text-green-400 font-medium ml-4">{linha}</div>;
                              }
                              if (linha.trim().startsWith('-')) {
                                return <div key={index} className="text-slate-300 ml-2 text-xs">{linha}</div>;
                              }
                              return <div key={index} className="text-slate-300">{linha}</div>;
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um cálculo para ver os detalhes</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoPensaoModal;