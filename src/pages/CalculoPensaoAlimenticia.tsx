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
import { useAuth } from "@/contexts/AuthContext";

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
  const { useTokens } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculoResult | null>(null);
  
  const [formData, setFormData] = useState({
    rendaAlimentante: '',
    numeroFilhos: '1',
    idadesFilhos: [''],
    percentualPensao: '',
    dataInicio: '',
    dataFim: '',
    valorFixo: '',
    tipoCalculo: 'percentual',
    mesesAtraso: '',
    observacoes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    if (field === 'numeroFilhos') {
      const numFilhos = parseInt(value);
      const novasIdades = Array.from({ length: numFilhos }, (_, i) => 
        formData.idadesFilhos[i] || ''
      );
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        idadesFilhos: novasIdades
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleIdadeChange = (index: number, value: string) => {
    const novasIdades = [...formData.idadesFilhos];
    novasIdades[index] = value;
    setFormData(prev => ({ ...prev, idadesFilhos: novasIdades }));
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
      // Verificar e consumir tokens antes do cálculo
      const tokensRequired = 15000;
      const tokenSuccess = await useTokens(tokensRequired, 'Cálculo de Pensão Alimentícia');
      
      if (!tokenSuccess) {
        toast.error("Tokens insuficientes para realizar o cálculo. Você precisa de 15.000 tokens.");
        return;
      }

      // Preparar dados para envio - converter idades para compatibilidade
      const dadosEnvio = {
        ...formData,
        idadeFilho: formData.idadesFilhos[0] || '', // Primeira idade para compatibilidade
        idadesFilhos: formData.idadesFilhos
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4 h-9"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Cálculo de Pensão Alimentícia
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Calcule valores de pensão alimentícia, atrasos e correções
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Dados da Pensão</CardTitle>
              <CardDescription>
                Informe os dados para cálculo da pensão alimentícia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div>
                <Label htmlFor="tipoCalculo" className="text-sm">Tipo de Cálculo</Label>
                <Select value={formData.tipoCalculo} onValueChange={(value) => handleInputChange('tipoCalculo', value)}>
                  <SelectTrigger className="h-9 md:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual da Renda</SelectItem>
                    <SelectItem value="fixo">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipoCalculo === 'percentual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label htmlFor="rendaAlimentante" className="text-sm">Renda do Alimentante *</Label>
                    <Input
                      id="rendaAlimentante"
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      value={formData.rendaAlimentante}
                      onChange={(e) => handleInputChange('rendaAlimentante', e.target.value)}
                      className="h-9 md:h-10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="percentualPensao" className="text-sm">Percentual (%)</Label>
                    <Input
                      id="percentualPensao"
                      type="number"
                      step="0.1"
                      placeholder="30"
                      value={formData.percentualPensao}
                      onChange={(e) => handleInputChange('percentualPensao', e.target.value)}
                      className="h-9 md:h-10"
                    />
                  </div>
                </div>
              )}

              {formData.tipoCalculo === 'fixo' && (
                <div>
                  <Label htmlFor="valorFixo" className="text-sm">Valor Fixo da Pensão *</Label>
                  <Input
                    id="valorFixo"
                    type="number"
                    step="0.01"
                    placeholder="1500.00"
                    value={formData.valorFixo}
                    onChange={(e) => handleInputChange('valorFixo', e.target.value)}
                    className="h-9 md:h-10"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="numeroFilhos" className="text-sm">Número de Filhos *</Label>
                <Select value={formData.numeroFilhos} onValueChange={(value) => handleInputChange('numeroFilhos', value)}>
                  <SelectTrigger className="h-9 md:h-10">
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
              <div>
                <Label>Idades dos Filhos (anos)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {formData.idadesFilhos.map((idade, index) => (
                    <div key={index}>
                      <Input
                        type="number"
                        placeholder={`Idade do ${index + 1}º filho`}
                        value={idade}
                        onChange={(e) => handleIdadeChange(index, e.target.value)}
                        className="h-9"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="dataInicio" className="text-sm">Data de Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => handleInputChange('dataInicio', e.target.value)}
                    className="h-9 md:h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="dataFim" className="text-sm">Data de Fim</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => handleInputChange('dataFim', e.target.value)}
                    className="h-9 md:h-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="mesesAtraso" className="text-sm">Meses em Atraso</Label>
                <Input
                  id="mesesAtraso"
                  type="number"
                  placeholder="3"
                  value={formData.mesesAtraso}
                  onChange={(e) => handleInputChange('mesesAtraso', e.target.value)}
                  className="h-9 md:h-10"
                />
              </div>

              <div>
                <Label htmlFor="observacoes" className="text-sm">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais sobre a pensão..."
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  className="min-h-[70px] md:min-h-[80px] text-sm"
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
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Resultado do Cálculo</CardTitle>
                <CardDescription>
                  Valores calculados conforme os dados informados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-secondary/50 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground">Valor da Pensão</p>
                    <p className="text-lg md:text-2xl font-bold text-primary">
                      R$ {result.valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-secondary/50 rounded-lg">
                    <p className="text-xs md:text-sm text-muted-foreground">Percentual da Renda</p>
                    <p className="text-lg md:text-2xl font-bold text-blue-600">
                      {result.percentualRenda.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {result.valorTotalAtrasado > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="p-3 md:p-4 bg-red-50 rounded-lg">
                      <p className="text-xs md:text-sm text-muted-foreground">Total em Atraso</p>
                      <p className="text-lg md:text-xl font-semibold text-red-600">
                        R$ {result.valorTotalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 md:p-4 bg-orange-50 rounded-lg">
                      <p className="text-xs md:text-sm text-muted-foreground">Multa + Juros</p>
                      <p className="text-lg md:text-xl font-semibold text-orange-600">
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