import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calculator, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CalculoResult {
  valorTotal: number;
  jurosTotal: number;
  valorCorrigido: number;
  diferenca: number;
  detalhamento: string;
}

const CalculoContratoBancario = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculoResult | null>(null);
  
  const [formData, setFormData] = useState({
    valorContrato: '',
    dataContrato: '',
    dataVencimento: '',
    taxaJuros: '',
    tipoJuros: 'simples',
    indiceCorrecao: 'ipca',
    valorPago: '',
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
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Cálculo de Contrato Bancário</h1>
          </div>
          <p className="text-muted-foreground">
            Calcule juros, correção monetária e diferenças em contratos bancários
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Contrato</CardTitle>
              <CardDescription>
                Informe os dados básicos do contrato bancário
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valorContrato">Valor do Contrato *</Label>
                  <Input
                    id="valorContrato"
                    type="number"
                    step="0.01"
                    placeholder="10000.00"
                    value={formData.valorContrato}
                    onChange={(e) => handleInputChange('valorContrato', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="valorPago">Valor Pago</Label>
                  <Input
                    id="valorPago"
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    value={formData.valorPago}
                    onChange={(e) => handleInputChange('valorPago', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dataContrato">Data do Contrato *</Label>
                  <Input
                    id="dataContrato"
                    type="date"
                    value={formData.dataContrato}
                    onChange={(e) => handleInputChange('dataContrato', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxaJuros">Taxa de Juros (% a.m.) *</Label>
                  <Input
                    id="taxaJuros"
                    type="number"
                    step="0.01"
                    placeholder="2.5"
                    value={formData.taxaJuros}
                    onChange={(e) => handleInputChange('taxaJuros', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tipoJuros">Tipo de Juros</Label>
                  <Select value={formData.tipoJuros} onValueChange={(value) => handleInputChange('tipoJuros', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples">Juros Simples</SelectItem>
                      <SelectItem value="compostos">Juros Compostos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="indiceCorrecao">Índice de Correção</Label>
                <Select value={formData.indiceCorrecao} onValueChange={(value) => handleInputChange('indiceCorrecao', value)}>
                  <SelectTrigger>
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

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Informações adicionais sobre o contrato..."
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
                <DollarSign className="h-4 w-4 ml-2" />
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
                    <p className="text-sm text-muted-foreground">Valor Total Devido</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {result.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Juros Total</p>
                    <p className="text-2xl font-bold text-orange-600">
                      R$ {result.jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Corrigido</p>
                    <p className="text-xl font-semibold">
                      R$ {result.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Diferença</p>
                    <p className="text-xl font-semibold text-red-600">
                      R$ {result.diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
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
    </div>
  );
};

export default CalculoContratoBancario;