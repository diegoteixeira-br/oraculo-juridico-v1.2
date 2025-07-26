import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calculator, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CalculoResult {
  valorPensao: number;
  percentualRenda: number;
  valorTotalAtrasado: number;
  multa: number;
  juros: number;
  valorCorrigido: number;
  detalhamento: string;
}

const CalculoPensaoAlimenticia = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculoResult | null>(null);
  
  const [formData, setFormData] = useState({
    rendaAlimentante: '',
    numeroFilhos: '1',
    idadeFilho: '',
    percentualPensao: '',
    dataInicio: '',
    dataFim: '',
    valorFixo: '',
    tipoCalculo: 'percentual',
    mesesAtraso: '',
    observacoes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalcular = async () => {
    if (!formData.dataInicio || !formData.numeroFilhos) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (formData.tipoCalculo === 'percentual' && !formData.rendaAlimentante) {
      toast.error("Informe a renda do alimentante para cálculo percentual");
      return;
    }

    if (formData.tipoCalculo === 'fixo' && !formData.valorFixo) {
      toast.error("Informe o valor fixo da pensão");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculo-pensao-alimenticia', {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Cálculo de Pensão Alimentícia</h1>
          </div>
          <p className="text-muted-foreground">
            Calcule valores de pensão alimentícia, atrasos e correções
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Pensão</CardTitle>
              <CardDescription>
                Informe os dados para cálculo da pensão alimentícia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tipoCalculo">Tipo de Cálculo</Label>
                <Select value={formData.tipoCalculo} onValueChange={(value) => handleInputChange('tipoCalculo', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual da Renda</SelectItem>
                    <SelectItem value="fixo">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipoCalculo === 'percentual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rendaAlimentante">Renda do Alimentante *</Label>
                    <Input
                      id="rendaAlimentante"
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      value={formData.rendaAlimentante}
                      onChange={(e) => handleInputChange('rendaAlimentante', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentualPensao">Percentual (%)</Label>
                    <Input
                      id="percentualPensao"
                      type="number"
                      step="0.1"
                      placeholder="30"
                      value={formData.percentualPensao}
                      onChange={(e) => handleInputChange('percentualPensao', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {formData.tipoCalculo === 'fixo' && (
                <div>
                  <Label htmlFor="valorFixo">Valor Fixo da Pensão *</Label>
                  <Input
                    id="valorFixo"
                    type="number"
                    step="0.01"
                    placeholder="1500.00"
                    value={formData.valorFixo}
                    onChange={(e) => handleInputChange('valorFixo', e.target.value)}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroFilhos">Número de Filhos *</Label>
                  <Select value={formData.numeroFilhos} onValueChange={(value) => handleInputChange('numeroFilhos', value)}>
                    <SelectTrigger>
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
                <div>
                  <Label htmlFor="idadeFilho">Idade do Filho (anos)</Label>
                  <Input
                    id="idadeFilho"
                    type="number"
                    placeholder="10"
                    value={formData.idadeFilho}
                    onChange={(e) => handleInputChange('idadeFilho', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataInicio">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim">Data de Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => handleInputChange('dataFim', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mesesAtraso">Meses em Atraso</Label>
                <Input
                  id="mesesAtraso"
                  type="number"
                  placeholder="3"
                  value={formData.mesesAtraso}
                  onChange={(e) => handleInputChange('mesesAtraso', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais sobre a pensão..."
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                />
              </div>

              <Button 
                onClick={handleCalcular} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Calculando..." : "Calcular"}
                <Calculator className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Resultado do Cálculo</CardTitle>
                <CardDescription>
                  Valores calculados conforme os dados informados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor da Pensão</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {result.valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Percentual da Renda</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {result.percentualRenda.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {result.valorTotalAtrasado > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total em Atraso</p>
                      <p className="text-xl font-semibold text-red-600">
                        R$ {result.valorTotalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Multa + Juros</p>
                      <p className="text-xl font-semibold text-orange-600">
                        R$ {(result.multa + result.juros).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Valor Total Corrigido</p>
                  <p className="text-3xl font-bold text-primary">
                    R$ {result.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-4 bg-secondary/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Detalhamento do Cálculo</h4>
                  <pre className="text-sm whitespace-pre-wrap">{result.detalhamento}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculoPensaoAlimenticia;