import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calculator, DollarSign, Building, TrendingUp, FileText, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import UserMenu from "@/components/UserMenu";
import { useScrollDirection } from "@/hooks/useScrollDirection";

interface CalculoResult {
  valorTotal: number;
  jurosTotal: number;
  valorCorrigido: number;
  diferenca: number;
  detalhamento: string;
}

const CalculoContratoBancario = () => {
  const navigate = useNavigate();
  const { useTokens, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculoResult | null>(null);
  const { visible: menuVisible } = useScrollDirection();
  
  const [formData, setFormData] = useState({
    valorContrato: '',
    dataContrato: '',
    dataVencimento: '',
    taxaJuros: '',
    tipoJuros: 'simples',
    indiceCorrecao: 'ipca',
    valorPago: '',
    dataPagamentoParcial: '',
    multaAtraso: '2',
    jurosMora: '1',
    observacoes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalcular = async () => {
    if (!formData.valorContrato || !formData.dataContrato || !formData.dataVencimento || !formData.taxaJuros) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // Calculadora bancária agora é gratuita - não consome tokens

      const { data, error } = await supabase.functions.invoke('calculo-contrato-bancario', {
        body: formData
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
                src="/lovable-uploads/78181766-45b6-483a-866f-c4e0e4deff74.png" 
                alt="Oráculo Jurídico" 
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Cálculo de Contrato Bancário
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Análise de juros, taxas e correção monetária
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
        <div className="container max-w-6xl mx-auto px-4 py-6 space-y-6">
          
          {/* Card de informações sobre o cálculo */}
          <Card className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border-blue-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600/20 rounded-xl">
                    <Calculator className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Calculadora Bancária</h3>
                    <p className="text-sm text-slate-300">
                      Análise completa de contratos financeiros
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">Juros</div>
                  <div className="text-xs text-slate-400">Simples/Compostos</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-green-400">Correção</div>
                  <div className="text-xs text-slate-400">IPCA/IGP-M/SELIC</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-orange-400">Análise</div>
                  <div className="text-xs text-slate-400">Cláusulas Abusivas</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">Relatório</div>
                  <div className="text-xs text-slate-400">Completo</div>
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
                  <FileText className="w-5 h-5 text-primary" />
                  Dados do Contrato
                </CardTitle>
                <CardDescription>
                  Informe os dados básicos do contrato bancário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valorContrato" className="text-sm text-slate-300">Valor do Contrato *</Label>
                    <Input
                      id="valorContrato"
                      type="number"
                      step="0.01"
                      placeholder="10000.00"
                      value={formData.valorContrato}
                      onChange={(e) => handleInputChange('valorContrato', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorPago" className="text-sm text-slate-300">Valor Pago</Label>
                    <Input
                      id="valorPago"
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      value={formData.valorPago}
                      onChange={(e) => handleInputChange('valorPago', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataPagamentoParcial" className="text-sm text-slate-300">Data do Pagamento</Label>
                    <Input
                      id="dataPagamentoParcial"
                      type="date"
                      value={formData.dataPagamentoParcial}
                      onChange={(e) => handleInputChange('dataPagamentoParcial', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataContrato" className="text-sm text-slate-300">Data do Contrato *</Label>
                    <Input
                      id="dataContrato"
                      type="date"
                      value={formData.dataContrato}
                      onChange={(e) => handleInputChange('dataContrato', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataVencimento" className="text-sm text-slate-300">Data de Vencimento *</Label>
                    <Input
                      id="dataVencimento"
                      type="date"
                      value={formData.dataVencimento}
                      onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxaJuros" className="text-sm text-slate-300">Taxa de Juros (% a.m.) *</Label>
                    <Input
                      id="taxaJuros"
                      type="number"
                      step="0.01"
                      placeholder="2.5"
                      value={formData.taxaJuros}
                      onChange={(e) => handleInputChange('taxaJuros', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipoJuros" className="text-sm text-slate-300">Tipo de Juros</Label>
                    <Select value={formData.tipoJuros} onValueChange={(value) => handleInputChange('tipoJuros', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-primary text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simples">Juros Simples</SelectItem>
                        <SelectItem value="compostos">Juros Compostos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="multaAtraso" className="text-sm text-slate-300">Multa por Atraso (%)</Label>
                    <Input
                      id="multaAtraso"
                      type="number"
                      step="0.01"
                      placeholder="2.0"
                      value={formData.multaAtraso}
                      onChange={(e) => handleInputChange('multaAtraso', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jurosMora" className="text-sm text-slate-300">Juros de Mora (% a.m.)</Label>
                    <Input
                      id="jurosMora"
                      type="number"
                      step="0.01"
                      placeholder="1.0"
                      value={formData.jurosMora}
                      onChange={(e) => handleInputChange('jurosMora', e.target.value)}
                      className="bg-slate-700 border-slate-600 focus:border-primary text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="indiceCorrecao" className="text-sm text-slate-300">Índice de Correção</Label>
                  <Select value={formData.indiceCorrecao} onValueChange={(value) => handleInputChange('indiceCorrecao', value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 focus:border-primary text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ipca">IPCA</SelectItem>
                      <SelectItem value="igpm">IGP-M</SelectItem>
                      <SelectItem value="inpc">INPC</SelectItem>
                      <SelectItem value="selic">SELIC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes" className="text-sm text-slate-300">Observações</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Informações adicionais sobre o contrato..."
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
            <div className="flex flex-col justify-start min-h-full">
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
                  <CardContent className="space-y-6">
                    {/* Cards de resultados principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-gradient-to-br from-green-600/20 to-green-600/10 border border-green-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-300 font-medium">Valor Total Devido</p>
                            <p className="text-3xl font-bold text-green-400 mt-2">
                              R$ {result.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <DollarSign className="w-10 h-10 text-green-400" />
                        </div>
                      </div>

                      <div className="p-6 bg-gradient-to-br from-orange-600/20 to-orange-600/10 border border-orange-500/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-300 font-medium">Juros Total</p>
                            <p className="text-3xl font-bold text-orange-400 mt-2">
                              R$ {result.jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <TrendingUp className="w-10 h-10 text-orange-400" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <p className="text-sm text-slate-400">Valor Corrigido</p>
                        <p className="text-xl font-semibold text-blue-400 mt-1">
                          R$ {result.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                        <p className="text-sm text-slate-400">Diferença</p>
                        <p className="text-xl font-semibold text-red-400 mt-1">
                          R$ {result.diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Detalhamento */}
                    <div className="bg-slate-900/50 rounded-lg border border-slate-600 p-6">
                      <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Detalhamento do Cálculo
                      </h4>
                      <div className="max-h-80 overflow-y-auto">
                        <pre className="text-sm whitespace-pre-wrap text-slate-300 leading-relaxed">
                          {result.detalhamento}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 border-slate-700 mt-8">
                  <CardContent className="p-12 text-center">
                    <Calculator className="w-20 h-20 text-slate-500 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-3">
                      Aguardando Dados
                    </h3>
                    <p className="text-base text-slate-400 max-w-lg mx-auto mb-8">
                      Preencha os dados do contrato ao lado para realizar o cálculo 
                      de juros, correção monetária e análise de cláusulas.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <span>✓ Juros simples e compostos</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <span>✓ Correção por IPCA, IGP-M, SELIC</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                        <span>✓ Relatório detalhado</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Informações importantes */}
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
                  <FileText className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-200 mb-2">Informações Importantes</h4>
                  <div className="space-y-1 text-sm text-amber-300/80">
                    <p>• Este cálculo é uma ferramenta auxiliar baseada em parâmetros legais</p>
                    <p>• Para casos complexos, consulte sempre um advogado especializado</p>
                    <p>• Os índices de correção são atualizados conforme fontes oficiais</p>
                    <p>• O relatório pode ser usado como base para análise jurídica</p>
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

export default CalculoContratoBancario;