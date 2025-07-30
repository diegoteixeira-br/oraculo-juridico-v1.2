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
import { useAuth } from "@/contexts/AuthContext";

interface CalculoResult {
  valorTotal: number;
  jurosTotal: number;
  valorCorrigido: number;
  diferenca: number;
  detalhamento: string;
}

const CalculoContratoBancario = () => {
  const navigate = useNavigate();
  const { useTokens } = useAuth();
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
      // Verificar e consumir tokens antes do cálculo
      const tokensRequired = 15000;
      const tokenSuccess = await useTokens(tokensRequired, 'Cálculo de Contrato Bancário');
      
      if (!tokenSuccess) {
        toast.error("Tokens insuficientes para realizar o cálculo. Você precisa de 15.000 tokens.");
        return;
      }

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 px-4 py-6">
      <div className="container mx-auto max-w-4xl">
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
            <Calculator className="h-6 w-6 text-primary" />
            <h1 className="text-lg md:text-2xl font-bold">Cálculo de Contrato Bancário</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Calcule juros, correção monetária e diferenças em contratos bancários
          </p>
        </div>

        <Card className="w-full border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Dados do Contrato</CardTitle>
            <CardDescription className="text-sm">
              Informe os dados básicos do contrato bancário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="valorContrato" className="text-sm">Valor do Contrato *</Label>
                <Input
                  id="valorContrato"
                  type="number"
                  step="0.01"
                  placeholder="10000.00"
                  value={formData.valorContrato}
                  onChange={(e) => handleInputChange('valorContrato', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorPago" className="text-sm">Valor Pago</Label>
                <Input
                  id="valorPago"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={formData.valorPago}
                  onChange={(e) => handleInputChange('valorPago', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dataContrato" className="text-sm">Data do Contrato *</Label>
                <Input
                  id="dataContrato"
                  type="date"
                  value={formData.dataContrato}
                  onChange={(e) => handleInputChange('dataContrato', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dataVencimento" className="text-sm">Data de Vencimento *</Label>
                <Input
                  id="dataVencimento"
                  type="date"
                  value={formData.dataVencimento}
                  onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="taxaJuros" className="text-sm">Taxa de Juros (% a.m.) *</Label>
                <Input
                  id="taxaJuros"
                  type="number"
                  step="0.01"
                  placeholder="2.5"
                  value={formData.taxaJuros}
                  onChange={(e) => handleInputChange('taxaJuros', e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipoJuros" className="text-sm">Tipo de Juros</Label>
                <Select value={formData.tipoJuros} onValueChange={(value) => handleInputChange('tipoJuros', value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples">Juros Simples</SelectItem>
                    <SelectItem value="compostos">Juros Compostos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="indiceCorrecao" className="text-sm">Índice de Correção</Label>
              <Select value={formData.indiceCorrecao} onValueChange={(value) => handleInputChange('indiceCorrecao', value)}>
                <SelectTrigger className="h-10">
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

            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-sm">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Informações adicionais sobre o contrato..."
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <Button 
              onClick={handleCalcular} 
              disabled={loading}
              className="w-full h-10"
            >
              {loading ? "Calculando..." : "Calcular"}
              <DollarSign className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-4 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Resultado do Cálculo</CardTitle>
              <CardDescription className="text-sm">
                Valores calculados conforme os dados informados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Valor Total Devido</p>
                    <p className="text-lg md:text-xl font-bold text-primary">
                      R$ {result.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Juros Total</p>
                    <p className="text-lg md:text-xl font-bold text-orange-600">
                      R$ {result.jurosTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Valor Corrigido</p>
                    <p className="text-base md:text-lg font-semibold">
                      R$ {result.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Diferença</p>
                    <p className="text-base md:text-lg font-semibold text-red-600">
                      R$ {result.diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

              <div className="p-3 bg-secondary/20 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Detalhamento do Cálculo</h4>
                <pre className="text-xs whitespace-pre-wrap overflow-x-auto">{result.detalhamento}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CalculoContratoBancario;