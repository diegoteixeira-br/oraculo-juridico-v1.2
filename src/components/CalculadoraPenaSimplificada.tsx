import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { calcularPenaSimples } from '@/lib/pena';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CalculadoraPenaSimplificada: React.FC = () => {
  const [anos, setAnos] = useState(0);
  const [meses, setMeses] = useState(0);
  const [dias, setDias] = useState(0);
  const [tipo, setTipo] = useState<'primario' | 'reincidente' | 'hediondo_primario' | 'hediondo_reincidente'>('primario');
  const [regime, setRegime] = useState<'Fechado' | 'Semiaberto' | 'Aberto'>('Fechado');
  const [detracao, setDetracao] = useState(0);
  const [resultado, setResultado] = useState<any>(null);

  const calcular = () => {
    if (anos === 0 && meses === 0 && dias === 0) return;
    
    const res = calcularPenaSimples(anos, meses, dias, tipo, regime, detracao);
    setResultado(res);
  };

  const formatarData = (dataISO: string) => {
    return format(new Date(dataISO), "dd/MM/yyyy", { locale: ptBR });
  };

  const tipoLabels = {
    primario: 'Primário (1/6 progressão)',
    reincidente: 'Reincidente (1/5 progressão)', 
    hediondo_primario: 'Hediondo Primário (2/5 progressão)',
    hediondo_reincidente: 'Hediondo Reincidente (3/5 progressão)'
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basico">Cálculo Básico</TabsTrigger>
          <TabsTrigger value="resultado">Resultado</TabsTrigger>
        </TabsList>

        <TabsContent value="basico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Dados da Pena
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Anos</label>
                  <Input 
                    type="number" 
                    value={anos} 
                    onChange={(e) => setAnos(Number(e.target.value))}
                    min="0"
                    max="30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Meses</label>
                  <Input 
                    type="number" 
                    value={meses} 
                    onChange={(e) => setMeses(Number(e.target.value))}
                    min="0"
                    max="11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Dias</label>
                  <Input 
                    type="number" 
                    value={dias} 
                    onChange={(e) => setDias(Number(e.target.value))}
                    min="0"
                    max="30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo de Réu</label>
                <Select value={tipo} onValueChange={(value) => setTipo(value as typeof tipo)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Regime Inicial</label>
                <Select value={regime} onValueChange={(value) => setRegime(value as typeof regime)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fechado">Fechado</SelectItem>
                    <SelectItem value="Semiaberto">Semiaberto</SelectItem>
                    <SelectItem value="Aberto">Aberto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Detração (dias já cumpridos)</label>
                <Input 
                  type="number" 
                  value={detracao} 
                  onChange={(e) => setDetracao(Number(e.target.value))}
                  min="0"
                  placeholder="0"
                />
              </div>

              <Button onClick={calcular} className="w-full" disabled={anos === 0 && meses === 0 && dias === 0}>
                Calcular Datas
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultado">
          {resultado ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Datas Calculadas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3">
                    {resultado.dataProgressao && (
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Progressão de Regime:</span>
                        <Badge variant="outline">{formatarData(resultado.dataProgressao)}</Badge>
                      </div>
                    )}
                    
                    {resultado.dataLivramento && (
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium">Livramento Condicional:</span>
                        <Badge variant="outline">{formatarData(resultado.dataLivramento)}</Badge>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="font-medium">Término da Pena:</span>
                      <Badge>{formatarData(resultado.dataTermino)}</Badge>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Dias cumpridos:</span>
                      <span>{resultado.diasCumpridosHoje}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dias restantes:</span>
                      <span>{resultado.diasFaltantesParaTermino}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Preencha os dados básicos e clique em "Calcular Datas"</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CalculadoraPenaSimplificada;