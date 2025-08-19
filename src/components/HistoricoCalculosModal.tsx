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
import { FileText, Calendar, DollarSign, TrendingUp, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CalculoHistorico {
  id: string;
  valor_contrato: number;
  data_contrato: string;
  data_vencimento: string;
  taxa_juros: number;
  tipo_juros: string;
  indice_correcao: string;
  valor_pago: number | null;
  data_pagamento_parcial: string | null;
  multa_atraso: number;
  juros_mora: number;
  observacoes: string | null;
  valor_total: number;
  juros_total: number;
  valor_corrigido: number;
  diferenca: number;
  detalhamento: string;
  created_at: string;
}

interface HistoricoCalculosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCalculation?: (calculo: CalculoHistorico) => void;
}

const HistoricoCalculosModal: React.FC<HistoricoCalculosModalProps> = ({
  isOpen,
  onClose,
  onSelectCalculation
}) => {
  const [historico, setHistorico] = useState<CalculoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalculation, setSelectedCalculation] = useState<CalculoHistorico | null>(null);
  const { user } = useAuth();
  const { formatDateInUserTimezone } = useUserTimezone();
  const { copyCalculoContrato, loading: exportLoading } = useExportDocument();

  useEffect(() => {
    if (isOpen && user) {
      fetchHistorico();
    }
  }, [isOpen, user]);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calculo_contrato_historico')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistorico(data || []);
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
        .from('calculo_contrato_historico')
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
            <FileText className="w-5 h-5 text-primary" />
            Histórico de Cálculos
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Seus cálculos anteriores de contrato bancário
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
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
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
                              <Calendar className="w-4 h-4 text-blue-400" />
                              {formatDateInUserTimezone(calculo.created_at, 'dd/MM/yyyy HH:mm')}
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400 mt-1">
                              Contrato: {formatCurrency(calculo.valor_contrato)}
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
                            <span className="text-slate-400">Total devido:</span>
                            <div className="font-semibold text-green-400">
                              {formatCurrency(calculo.valor_total)}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Taxa:</span>
                            <div className="font-semibold text-orange-400">
                              {calculo.taxa_juros}% a.m.
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex gap-1">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {calculo.tipo_juros}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {calculo.indice_correcao.toUpperCase()}
                          </Badge>
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
                      <Card className="bg-gradient-to-br from-green-600/20 to-green-600/10 border-green-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-green-300 font-medium">Valor Total</p>
                              <p className="text-lg font-bold text-green-400">
                                {formatCurrency(selectedCalculation.valor_total)}
                              </p>
                            </div>
                            <DollarSign className="w-6 h-6 text-green-400" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gradient-to-br from-orange-600/20 to-orange-600/10 border-orange-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-orange-300 font-medium">Juros Total</p>
                              <p className="text-lg font-bold text-orange-400">
                                {formatCurrency(selectedCalculation.juros_total)}
                              </p>
                            </div>
                            <TrendingUp className="w-6 h-6 text-orange-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Dados do contrato */}
                    <Card className="bg-slate-800/30 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">Dados do Contrato</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-400">Valor Original:</span>
                            <div className="text-white font-medium">
                              {formatCurrency(selectedCalculation.valor_contrato)}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Taxa de Juros:</span>
                            <div className="text-white font-medium">
                              {selectedCalculation.taxa_juros}% a.m.
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Data Contrato:</span>
                            <div className="text-white font-medium">
                              {formatDateInUserTimezone(selectedCalculation.data_contrato, 'dd/MM/yyyy')}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400">Vencimento:</span>
                            <div className="text-white font-medium">
                              {formatDateInUserTimezone(selectedCalculation.data_vencimento, 'dd/MM/yyyy')}
                            </div>
                          </div>
                        </div>
                        
                        {selectedCalculation.valor_pago && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                            <div>
                              <span className="text-slate-400">Valor Pago:</span>
                              <div className="text-white font-medium">
                                {formatCurrency(selectedCalculation.valor_pago)}
                              </div>
                            </div>
                            {selectedCalculation.data_pagamento_parcial && (
                              <div>
                                <span className="text-slate-400">Data Pagamento:</span>
                                <div className="text-white font-medium">
                                  {formatDateInUserTimezone(selectedCalculation.data_pagamento_parcial, 'dd/MM/yyyy')}
                                </div>
                              </div>
                            )}
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
                      </CardContent>
                    </Card>

                    {/* Valores calculados */}
                    <Card className="bg-slate-800/30 border-slate-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm text-white">Valores Calculados</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
                            <span className="text-blue-300 text-xs">Valor Corrigido</span>
                            <div className="text-blue-400 font-semibold">
                              {formatCurrency(selectedCalculation.valor_corrigido)}
                            </div>
                          </div>
                          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
                            <span className="text-red-300 text-xs">Diferença</span>
                            <div className="text-red-400 font-semibold">
                              {formatCurrency(selectedCalculation.diferenca)}
                            </div>
                          </div>
                          {selectedCalculation.multa_atraso > 0 && (
                            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3">
                              <span className="text-yellow-300 text-xs">Multa</span>
                              <div className="text-yellow-400 font-semibold">
                                {formatCurrency(selectedCalculation.multa_atraso)}
                              </div>
                            </div>
                          )}
                          {selectedCalculation.juros_mora > 0 && (
                            <div className="bg-orange-600/10 border border-orange-600/30 rounded-lg p-3">
                              <span className="text-orange-300 text-xs">Juros de Mora</span>
                              <div className="text-orange-400 font-semibold">
                                {formatCurrency(selectedCalculation.juros_mora)}
                              </div>
                            </div>
                          )}
                        </div>
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
                                valorContrato: selectedCalculation.valor_contrato.toString(),
                                dataContrato: selectedCalculation.data_contrato,
                                dataVencimento: selectedCalculation.data_vencimento,
                                taxaJuros: selectedCalculation.taxa_juros.toString(),
                                tipoJuros: selectedCalculation.tipo_juros,
                                indiceCorrecao: selectedCalculation.indice_correcao,
                                valorPago: selectedCalculation.valor_pago?.toString() || '',
                                dataPagamentoParcial: selectedCalculation.data_pagamento_parcial || '',
                                multaAtraso: selectedCalculation.multa_atraso.toString(),
                                jurosMora: selectedCalculation.juros_mora.toString(),
                                observacoes: selectedCalculation.observacoes || ''
                              };
                              const result = {
                                valorTotal: selectedCalculation.valor_total,
                                jurosTotal: selectedCalculation.juros_total,
                                valorCorrigido: selectedCalculation.valor_corrigido,
                                diferenca: selectedCalculation.diferenca,
                                detalhamento: selectedCalculation.detalhamento
                              };
                              copyCalculoContrato(result, formData);
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
                              if (linha.includes('═══')) {
                                return <div key={index} className="text-primary text-sm font-semibold my-2">{linha.replace(/═/g, '')}</div>;
                              }
                              if (linha.includes('DADOS DO CONTRATO') || linha.includes('CÁLCULO ATÉ O VENCIMENTO') || linha.includes('RESUMO FINAL')) {
                                return <div key={index} className="text-blue-400 font-semibold text-sm mb-2">{linha}</div>;
                              }
                              if (linha.includes('PAGAMENTO PARCIAL') || linha.includes('CÁLCULO DE ATRASO')) {
                                return <div key={index} className="text-yellow-400 font-semibold text-sm mb-2">{linha}</div>;
                              }
                              if (linha.includes('FUNDAMENTAÇÃO LEGAL') || linha.includes('OBSERVAÇÕES ADICIONAIS')) {
                                return <div key={index} className="text-green-400 font-semibold text-sm mb-2">{linha}</div>;
                              }
                              if (linha.startsWith('•') || linha.startsWith('-')) {
                                return <div key={index} className="text-slate-300 ml-2">{linha}</div>;
                              }
                              if (linha.includes('R$')) {
                                return <div key={index} className="text-slate-200 font-medium">{linha}</div>;
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
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
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

export default HistoricoCalculosModal;