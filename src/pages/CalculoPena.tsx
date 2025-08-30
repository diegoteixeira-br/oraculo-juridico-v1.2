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
import CalculadoraPenaSimplificada from "@/components/CalculadoraPenaSimplificada";
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
        <Tabs defaultValue="calculo-rapido" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-800/50 p-1 rounded-lg h-auto">
            <TabsTrigger 
              value="calculo-rapido" 
              className="data-[state=active]:bg-primary text-[10px] sm:text-xs md:text-sm font-medium px-1 py-1.5 data-[state=active]:text-white text-slate-300 whitespace-nowrap"
            >
              Cálculo Rápido
            </TabsTrigger>
            <TabsTrigger 
              value="dados-sentenca" 
              className="data-[state=active]:bg-primary text-[10px] sm:text-xs md:text-sm font-medium px-1 py-1.5 data-[state=active]:text-white text-slate-300 whitespace-nowrap"
            >
              Dados Avançados
            </TabsTrigger>
            <TabsTrigger 
              value="historico-custodia" 
              className="data-[state=active]:bg-primary text-[10px] sm:text-xs md:text-sm font-medium px-1 py-1.5 data-[state=active]:text-white text-slate-300 whitespace-nowrap"
            >
              Histórico de Custódia
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calculo-rapido">
            <CalculadoraPenaSimplificada />
          </TabsContent>
          
          <TabsContent value="dados-sentenca">
            <DadosSentencaAvancados onCalcular={handleCalculoAvancado} />
          </TabsContent>
          
          
          <TabsContent value="historico-custodia">
            <HistoricoCustodia />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}