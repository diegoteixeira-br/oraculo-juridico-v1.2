import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon, Calculator, Download, Clock, Shield, Scale, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import UserMenu from "@/components/UserMenu";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSEO } from "@/hooks/useSEO";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import HistoricoCustodia from "@/components/pena/HistoricoCustodia";
import DadosSentencaAvancados from "@/components/pena/DadosSentencaAvancados";
import type { DadosSentenca } from "@/types/pena";

interface ResultadoCalculo {
  dataProgressao: Date;
  dataLivramentoCondicional: Date;
  dataFinalPena: Date;
  penatotalDias: number;
  diasRemidos: number;
  regimeProgressao: string;
}

export default function CalculoPena() {
  usePageTitle();
  useSEO({
    title: "Cálculo de Pena - Oráculo Jurídico",
    description: "Calcule progressão de regime, livramento condicional e data final da pena"
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados do formulário
  const [penananos, setPenaAnos] = useState<string>("");
  const [penaMeses, setPenaMeses] = useState<string>("");
  const [penaDias, setPenaDias] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [regimeInicial, setRegimeInicial] = useState<string>("");
  const [tipoPercentual, setTipoPercentual] = useState<string>("primario");
  const [diasRemidos, setDiasRemidos] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Estado do resultado
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [loading, setLoading] = useState(false);

  const calcularPena = () => {
    if (!dataInicio || !penananos || !regimeInicial || !tipoPercentual) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Converter pena para dias
      const anos = parseInt(penananos) || 0;
      const meses = parseInt(penaMeses) || 0;
      const dias = parseInt(penaDias) || 0;
      const diasRemidosNum = parseInt(diasRemidos) || 0;

      const penatotalDias = (anos * 365) + (meses * 30) + dias;
      const penaLiquidaDias = penatotalDias - diasRemidosNum;

      // Definir percentuais conforme o tipo
      let percentualProgressao = 0;
      let percentualLivramento = 0;

      switch (tipoPercentual) {
        case "primario":
          percentualProgressao = 1/6; // 16,67%
          percentualLivramento = 1/3; // 33,33%
          break;
        case "hediondo_primario":
          percentualProgressao = 2/5; // 40%
          percentualLivramento = 3/5; // 60%
          break;
        case "hediondo_reincidente":
          percentualProgressao = 3/5; // 60%
          percentualLivramento = 4/5; // 80%
          break;
        case "reincidente":
          percentualProgressao = 1/4; // 25%
          percentualLivramento = 1/2; // 50%
          break;
      }

      // Calcular datas
      const diasParaProgressao = Math.floor(penaLiquidaDias * percentualProgressao);
      const diasParaLivramento = Math.floor(penaLiquidaDias * percentualLivramento);

      const dataProgressao = new Date(dataInicio);
      dataProgressao.setDate(dataProgressao.getDate() + diasParaProgressao);

      const dataLivramentoCondicional = new Date(dataInicio);
      dataLivramentoCondicional.setDate(dataLivramentoCondicional.getDate() + diasParaLivramento);

      const dataFinalPena = new Date(dataInicio);
      dataFinalPena.setDate(dataFinalPena.getDate() + penaLiquidaDias);

      // Determinar próximo regime
      let regimeProgressao = "";
      switch (regimeInicial) {
        case "fechado":
          regimeProgressao = "Semiaberto";
          break;
        case "semiaberto":
          regimeProgressao = "Aberto";
          break;
        case "aberto":
          regimeProgressao = "Livramento Condicional";
          break;
      }

      setResultado({
        dataProgressao,
        dataLivramentoCondicional,
        dataFinalPena,
        penatotalDias,
        diasRemidos: diasRemidosNum,
        regimeProgressao
      });

      toast({
        title: "Cálculo realizado",
        description: "Os resultados foram calculados com sucesso"
      });

    } catch (error) {
      console.error("Erro no cálculo:", error);
      toast({
        title: "Erro no cálculo",
        description: "Ocorreu um erro ao processar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    if (!resultado) return;

    // Implementar exportação PDF aqui
    toast({
      title: "Exportar PDF",
      description: "Funcionalidade em desenvolvimento"
    });
  };

  const handleCalculoAvancado = (dadosSentenca: DadosSentenca) => {
    setLoading(true);
    try {
      // Calcular datas baseado nos dados da sentença
      const totalDias = dadosSentenca.totalDias;
      const fracaoProgressao = dadosSentenca.fracaoProgressao;
      const fracaoLivramento = dadosSentenca.fracaoLivramento || dadosSentenca.fracaoProgressao * 2;

      // Se tem data de início, usar ela, senão usar data atual
      const dataInicioCalculo = dadosSentenca.dataInicioTeorica 
        ? new Date(dadosSentenca.dataInicioTeorica) 
        : new Date();

      const diasParaProgressao = Math.floor(totalDias * fracaoProgressao);
      const diasParaLivramento = Math.floor(totalDias * fracaoLivramento);

      const dataProgressao = new Date(dataInicioCalculo);
      dataProgressao.setDate(dataProgressao.getDate() + diasParaProgressao);

      const dataLivramentoCondicional = new Date(dataInicioCalculo);
      dataLivramentoCondicional.setDate(dataLivramentoCondicional.getDate() + diasParaLivramento);

      const dataFinalPena = new Date(dataInicioCalculo);
      dataFinalPena.setDate(dataFinalPena.getDate() + totalDias);

      // Determinar próximo regime
      let regimeProgressao = "";
      switch (dadosSentenca.regimeInicial) {
        case "Fechado":
          regimeProgressao = "Semiaberto";
          break;
        case "Semiaberto":
          regimeProgressao = "Aberto";
          break;
        case "Aberto":
          regimeProgressao = "Livramento Condicional";
          break;
      }

      setResultado({
        dataProgressao,
        dataLivramentoCondicional,
        dataFinalPena,
        penatotalDias: totalDias,
        diasRemidos: 0,
        regimeProgressao
      });

      toast({
        title: "Cálculo realizado",
        description: "Os resultados foram calculados com base nos crimes informados"
      });

    } catch (error) {
      console.error("Erro no cálculo:", error);
      toast({
        title: "Erro no cálculo",
        description: "Ocorreu um erro ao processar os dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const limparFormulario = () => {
    setPenaAnos("");
    setPenaMeses("");
    setPenaDias("");
    setDataInicio(undefined);
    setRegimeInicial("");
    setTipoPercentual("primario");
    setDiasRemidos("");
    setResultado(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm">
        <div className="container max-w-7xl mx-auto px-4 py-3">
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
                width="160"
                height="40"
              />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scale className="w-6 h-6 text-primary" />
                  Cálculo de Pena
                </h1>
                <p className="text-xs text-slate-300 hidden md:block">
                  Calcule progressão de regime e livramento condicional
                </p>
              </div>
            </div>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        
        {/* Tabs para alternar entre as versões */}
        <Tabs defaultValue="dados-sentenca" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dados-sentenca" className="data-[state=active]:bg-primary">
              Dados da Sentença
            </TabsTrigger>
            <TabsTrigger value="dados-sentenca-simples" className="data-[state=active]:bg-primary">
              Cálculo Simples
            </TabsTrigger>
            <TabsTrigger value="historico-custodia" className="data-[state=active]:bg-primary">
              Histórico de Custódia
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dados-sentenca">
            <DadosSentencaAvancados onCalcular={handleCalculoAvancado} />
          </TabsContent>
          
          <TabsContent value="dados-sentenca-simples">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Formulário */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Dados da Pena
              </CardTitle>
              <CardDescription className="text-slate-400">
                Preencha os dados para calcular as datas importantes da execução penal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Pena total */}
              <div className="space-y-2">
                <Label className="text-slate-200">Pena Total *</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-slate-400">Anos</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={penananos}
                      onChange={(e) => setPenaAnos(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Meses</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="11"
                      value={penaMeses}
                      onChange={(e) => setPenaMeses(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Dias</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      max="30"
                      value={penaDias}
                      onChange={(e) => setPenaDias(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Data de início */}
              <div className="space-y-2">
                <Label className="text-slate-200">Data de Início do Cumprimento *</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                        !dataInicio && "text-slate-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataInicio ? format(dataInicio, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dataInicio}
                      onSelect={(date) => {
                        setDataInicio(date);
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Regime inicial */}
              <div className="space-y-2">
                <Label className="text-slate-200">Regime Inicial *</Label>
                <Select value={regimeInicial} onValueChange={setRegimeInicial}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="fechado">Fechado</SelectItem>
                    <SelectItem value="semiaberto">Semiaberto</SelectItem>
                    <SelectItem value="aberto">Aberto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de percentual */}
              <div className="space-y-2">
                <Label className="text-slate-200">Tipo de Crime/Réu *</Label>
                <Select value={tipoPercentual} onValueChange={setTipoPercentual}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="primario">Réu Primário (1/6 e 1/3)</SelectItem>
                    <SelectItem value="reincidente">Reincidente (1/4 e 1/2)</SelectItem>
                    <SelectItem value="hediondo_primario">Hediondo - Primário (2/5 e 3/5)</SelectItem>
                    <SelectItem value="hediondo_reincidente">Hediondo - Reincidente (3/5 e 4/5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dias remidos */}
              <div className="space-y-2">
                <Label className="text-slate-200">Dias Remidos (trabalho/estudo)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={diasRemidos}
                  onChange={(e) => setDiasRemidos(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400">
                  Dias reduzidos por trabalho ou estudo durante o cumprimento da pena
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={calcularPena} 
                  disabled={loading}
                  className="flex-1"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {loading ? "Calculando..." : "Calcular"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={limparFormulario}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Limpar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Resultados do Cálculo
              </CardTitle>
              <CardDescription className="text-slate-400">
                Datas importantes para a execução da pena
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!resultado ? (
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    Preencha o formulário e clique em "Calcular" para ver os resultados
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Cards de resultados */}
                  <div className="grid gap-3">
                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-primary font-medium">Progressão de Regime</p>
                          <p className="text-lg font-bold text-primary">
                            {format(resultado.dataProgressao, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-slate-400">
                            Para regime {resultado.regimeProgressao}
                          </p>
                        </div>
                        <Shield className="w-8 h-8 text-primary" />
                      </div>
                    </div>

                    <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-emerald-400 font-medium">Livramento Condicional</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {format(resultado.dataLivramentoCondicional, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <Clock className="w-8 h-8 text-emerald-400" />
                      </div>
                    </div>

                    <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-400 font-medium">Término da Pena</p>
                          <p className="text-lg font-bold text-blue-400">
                            {format(resultado.dataFinalPena, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <CalendarIcon className="w-8 h-8 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  {/* Informações adicionais */}
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                    <p className="text-xs text-slate-300">
                      <strong>Pena total:</strong> {resultado.penatotalDias} dias
                    </p>
                    {resultado.diasRemidos > 0 && (
                      <p className="text-xs text-slate-300">
                        <strong>Dias remidos:</strong> {resultado.diasRemidos} dias
                      </p>
                    )}
                    <p className="text-xs text-slate-300">
                      <strong>Pena líquida:</strong> {resultado.penatotalDias - resultado.diasRemidos} dias
                    </p>
                  </div>

                  {/* Linha do tempo visual */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-3">Linha do Tempo</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Início da pena</p>
                          <p className="text-xs text-slate-400">
                            {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : ""}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Progressão para {resultado.regimeProgressao}</p>
                          <p className="text-xs text-slate-400">
                            {format(resultado.dataProgressao, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Livramento Condicional</p>
                          <p className="text-xs text-slate-400">
                            {format(resultado.dataLivramentoCondicional, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Término da pena</p>
                          <p className="text-xs text-slate-400">
                            {format(resultado.dataFinalPena, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botão de exportar */}
                  <Button 
                    onClick={exportarPDF}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="historico-custodia">
            <HistoricoCustodia />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}