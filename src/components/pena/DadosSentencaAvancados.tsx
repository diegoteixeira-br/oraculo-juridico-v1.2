import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calculator, FileText, Scale } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Crime, DadosSentenca } from "@/types/pena";
import { toast } from "sonner";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DadosSentencaAvancadosProps {
  onCalcular: (dadosSentenca: DadosSentenca) => void;
}

export default function DadosSentencaAvancados({ onCalcular }: DadosSentencaAvancadosProps) {
  const [crimes, setCrimes] = useState<Crime[]>([]);
  const [dadosProcessuais, setDadosProcessuais] = useState({
    numeroProcesso: '',
    vara: '',
    juiz: '',
    dataTransito: undefined as Date | undefined,
    regimeInicial: '' as 'Fechado' | 'Semiaberto' | 'Aberto' | '',
    observacoes: ''
  });

  const [novoCrime, setNovoCrime] = useState<Omit<Crime, 'id'>>({
    descricao: '',
    artigo: '',
    penaAnos: 0,
    penaMeses: 0,
    penaDias: 0,
    tipoPercentual: 'primario',
    observacoes: ''
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const adicionarCrime = () => {
    if (!novoCrime.descricao.trim() || !novoCrime.artigo.trim()) {
      toast.error('Preencha pelo menos a descrição e o artigo do crime');
      return;
    }

    if (novoCrime.penaAnos === 0 && novoCrime.penaMeses === 0 && novoCrime.penaDias === 0) {
      toast.error('Informe pelo menos uma parte da pena (anos, meses ou dias)');
      return;
    }

    const crime: Crime = {
      ...novoCrime,
      id: Date.now().toString()
    };

    setCrimes([...crimes, crime]);
    setNovoCrime({
      descricao: '',
      artigo: '',
      penaAnos: 0,
      penaMeses: 0,
      penaDias: 0,
      tipoPercentual: 'primario',
      observacoes: ''
    });

    toast.success('Crime adicionado com sucesso');
  };

  const removerCrime = (id: string) => {
    setCrimes(crimes.filter(crime => crime.id !== id));
    toast.success('Crime removido');
  };

  const calcularPenaTotal = () => {
    return crimes.reduce((total, crime) => {
      const dias = (crime.penaAnos * 365) + (crime.penaMeses * 30) + crime.penaDias;
      return total + dias;
    }, 0);
  };

  const obterMaiorFracaoProgressao = () => {
    let maiorFracao = 1/6; // padrão primário
    
    crimes.forEach(crime => {
      switch (crime.tipoPercentual) {
        case 'reincidente':
          maiorFracao = Math.max(maiorFracao, 1/4);
          break;
        case 'hediondo_primario':
          maiorFracao = Math.max(maiorFracao, 2/5);
          break;
        case 'hediondo_reincidente':
          maiorFracao = Math.max(maiorFracao, 3/5);
          break;
      }
    });

    return maiorFracao;
  };

  const obterMaiorFracaoLivramento = () => {
    let maiorFracao = 1/3; // padrão primário
    
    crimes.forEach(crime => {
      switch (crime.tipoPercentual) {
        case 'reincidente':
          maiorFracao = Math.max(maiorFracao, 1/2);
          break;
        case 'hediondo_primario':
          maiorFracao = Math.max(maiorFracao, 3/5);
          break;
        case 'hediondo_reincidente':
          maiorFracao = Math.max(maiorFracao, 4/5);
          break;
      }
    });

    return maiorFracao;
  };

  const calcularSentenca = () => {
    if (crimes.length === 0) {
      toast.error('Adicione pelo menos um crime para calcular');
      return;
    }

    if (!dadosProcessuais.regimeInicial) {
      toast.error('Selecione o regime inicial');
      return;
    }

    const totalDias = calcularPenaTotal();
    const fracaoProgressao = obterMaiorFracaoProgressao();
    const fracaoLivramento = obterMaiorFracaoLivramento();

    const dadosSentenca: DadosSentenca = {
      crimes,
      totalDias,
      regimeInicial: dadosProcessuais.regimeInicial,
      fracaoProgressao,
      fracaoLivramento,
      numeroProcesso: dadosProcessuais.numeroProcesso || undefined,
      vara: dadosProcessuais.vara || undefined,
      juiz: dadosProcessuais.juiz || undefined,
      dataTransito: dadosProcessuais.dataTransito?.toISOString().split('T')[0],
      observacoes: dadosProcessuais.observacoes || undefined
    };

    onCalcular(dadosSentenca);
  };

  const getTipoPercentualLabel = (tipo: string) => {
    switch (tipo) {
      case 'primario': return 'Réu Primário (1/6 e 1/3)';
      case 'reincidente': return 'Reincidente (1/4 e 1/2)';
      case 'hediondo_primario': return 'Hediondo - Primário (2/5 e 3/5)';
      case 'hediondo_reincidente': return 'Hediondo - Reincidente (3/5 e 4/5)';
      default: return tipo;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dados Processuais */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Dados Processuais
          </CardTitle>
          <CardDescription className="text-slate-400">
            Informações gerais do processo e da sentença
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Número do Processo</Label>
              <Input
                value={dadosProcessuais.numeroProcesso}
                onChange={(e) => setDadosProcessuais({...dadosProcessuais, numeroProcesso: e.target.value})}
                placeholder="0000000-00.0000.0.00.0000"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Vara/Juízo</Label>
              <Input
                value={dadosProcessuais.vara}
                onChange={(e) => setDadosProcessuais({...dadosProcessuais, vara: e.target.value})}
                placeholder="Ex: 1ª Vara Criminal"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Juiz</Label>
              <Input
                value={dadosProcessuais.juiz}
                onChange={(e) => setDadosProcessuais({...dadosProcessuais, juiz: e.target.value})}
                placeholder="Nome do magistrado"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Data do Trânsito em Julgado</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
                      !dadosProcessuais.dataTransito && "text-slate-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dadosProcessuais.dataTransito ? format(dadosProcessuais.dataTransito, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dadosProcessuais.dataTransito}
                    onSelect={(date) => {
                      setDadosProcessuais({...dadosProcessuais, dataTransito: date});
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Regime Inicial *</Label>
            <Select 
              value={dadosProcessuais.regimeInicial} 
              onValueChange={(value: 'Fechado' | 'Semiaberto' | 'Aberto') => 
                setDadosProcessuais({...dadosProcessuais, regimeInicial: value})
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecione o regime inicial" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="Fechado">Fechado</SelectItem>
                <SelectItem value="Semiaberto">Semiaberto</SelectItem>
                <SelectItem value="Aberto">Aberto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Observações</Label>
            <Textarea
              value={dadosProcessuais.observacoes}
              onChange={(e) => setDadosProcessuais({...dadosProcessuais, observacoes: e.target.value})}
              placeholder="Observações gerais sobre o processo"
              className="bg-slate-700 border-slate-600 text-white"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Adicionar Crime */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Adicionar Crime
          </CardTitle>
          <CardDescription className="text-slate-400">
            Adicione os crimes que compõem a condenação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Descrição do Crime *</Label>
              <Input
                value={novoCrime.descricao}
                onChange={(e) => setNovoCrime({...novoCrime, descricao: e.target.value})}
                placeholder="Ex: Roubo qualificado"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Artigo Legal *</Label>
              <Input
                value={novoCrime.artigo}
                onChange={(e) => setNovoCrime({...novoCrime, artigo: e.target.value})}
                placeholder="Ex: Art. 157, §2º, I e II do CP"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Pena *</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Anos</Label>
                <Input
                  type="number"
                  min="0"
                  value={novoCrime.penaAnos}
                  onChange={(e) => setNovoCrime({...novoCrime, penaAnos: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Meses</Label>
                <Input
                  type="number"
                  min="0"
                  max="11"
                  value={novoCrime.penaMeses}
                  onChange={(e) => setNovoCrime({...novoCrime, penaMeses: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Dias</Label>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={novoCrime.penaDias}
                  onChange={(e) => setNovoCrime({...novoCrime, penaDias: parseInt(e.target.value) || 0})}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Tipo de Crime/Réu *</Label>
            <Select 
              value={novoCrime.tipoPercentual} 
              onValueChange={(value: 'primario' | 'reincidente' | 'hediondo_primario' | 'hediondo_reincidente') => 
                setNovoCrime({...novoCrime, tipoPercentual: value})
              }
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="primario">Réu Primário (1/6 e 1/3)</SelectItem>
                <SelectItem value="reincidente">Reincidente (1/4 e 1/2)</SelectItem>
                <SelectItem value="hediondo_primario">Hediondo - Primário (2/5 e 3/5)</SelectItem>
                <SelectItem value="hediondo_reincidente">Hediondo - Reincidente (3/5 e 4/5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Observações</Label>
            <Textarea
              value={novoCrime.observacoes}
              onChange={(e) => setNovoCrime({...novoCrime, observacoes: e.target.value})}
              placeholder="Observações específicas sobre este crime"
              className="bg-slate-700 border-slate-600 text-white"
              rows={2}
            />
          </div>

          <Button onClick={adicionarCrime} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Crime
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Crimes */}
      {crimes.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              Crimes Adicionados ({crimes.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Pena total: {Math.floor(calcularPenaTotal() / 365)} anos, {Math.floor((calcularPenaTotal() % 365) / 30)} meses e {calcularPenaTotal() % 30} dias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {crimes.map((crime, index) => (
              <div key={crime.id} className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{crime.descricao}</h4>
                    <p className="text-slate-400 text-sm">{crime.artigo}</p>
                    <p className="text-slate-300 text-sm">
                      Pena: {crime.penaAnos}a {crime.penaMeses}m {crime.penaDias}d
                    </p>
                    <p className="text-slate-400 text-xs">
                      {getTipoPercentualLabel(crime.tipoPercentual)}
                    </p>
                    {crime.observacoes && (
                      <p className="text-slate-400 text-xs mt-1">{crime.observacoes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removerCrime(crime.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                {index < crimes.length - 1 && <Separator className="bg-slate-600" />}
              </div>
            ))}

            <Separator className="bg-slate-600" />

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex-1 text-center p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-primary font-bold text-lg">
                  {Math.floor(calcularPenaTotal() / 365)}a {Math.floor((calcularPenaTotal() % 365) / 30)}m {calcularPenaTotal() % 30}d
                </p>
                <p className="text-primary text-sm">Pena Total</p>
              </div>
              <div className="flex-1 text-center p-4 bg-emerald-600/10 rounded-lg border border-emerald-600/30">
                <p className="text-emerald-400 font-bold text-lg">
                  {Math.round(obterMaiorFracaoProgressao() * 100)}%
                </p>
                <p className="text-emerald-400 text-sm">Progressão</p>
              </div>
              <div className="flex-1 text-center p-4 bg-blue-600/10 rounded-lg border border-blue-600/30">
                <p className="text-blue-400 font-bold text-lg">
                  {Math.round(obterMaiorFracaoLivramento() * 100)}%
                </p>
                <p className="text-blue-400 text-sm">Livramento</p>
              </div>
            </div>

            <Button onClick={calcularSentenca} className="w-full" size="lg">
              <Calculator className="w-4 h-4 mr-2" />
              Calcular Execução Penal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}