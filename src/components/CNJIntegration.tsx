import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Calendar, MapPin, Clock } from 'lucide-react';

interface CNJIntegrationProps {
  onEventsCreated?: (count: number) => void;
}

const CNJIntegration: React.FC<CNJIntegrationProps> = ({ onEventsCreated }) => {
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const formatarNumeroProcesso = (valor: string) => {
    // Remove tudo que não for dígito
    const apenasNumeros = valor.replace(/\D/g, '');
    
    // Aplica máscara: NNNNNNN-DD.AAAA.J.TR.OOOO
    if (apenasNumeros.length <= 20) {
      let formatado = apenasNumeros;
      
      if (formatado.length > 7) {
        formatado = formatado.slice(0, 7) + '-' + formatado.slice(7);
      }
      if (formatado.length > 10) {
        formatado = formatado.slice(0, 10) + '.' + formatado.slice(10);
      }
      if (formatado.length > 15) {
        formatado = formatado.slice(0, 15) + '.' + formatado.slice(15);
      }
      if (formatado.length > 17) {
        formatado = formatado.slice(0, 17) + '.' + formatado.slice(17);
      }
      if (formatado.length > 20) {
        formatado = formatado.slice(0, 20) + '.' + formatado.slice(20);
      }
      
      return formatado;
    }
    return apenasNumeros;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorFormatado = formatarNumeroProcesso(e.target.value);
    setNumeroProcesso(valorFormatado);
  };

  const validarNumeroProcesso = (numero: string): boolean => {
    const apenasNumeros = numero.replace(/\D/g, '');
    return apenasNumeros.length === 20;
  };

  const sincronizarProcesso = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para sincronizar processos.",
        variant: "destructive"
      });
      return;
    }

    if (!validarNumeroProcesso(numeroProcesso)) {
      toast({
        title: "Número inválido",
        description: "Digite um número de processo válido (20 dígitos).",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResultado(null);

    try {
      const { data, error } = await supabase.functions.invoke('cnj-sync', {
        body: {
          numero: numeroProcesso,
          userId: user.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Erro na comunicação com o servidor');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResultado(data);

      if (data.found) {
        toast({
          title: "Processo sincronizado!",
          description: `${data.eventosCriados || 0} eventos encontrados e adicionados à agenda.`,
        });

        if (onEventsCreated) {
          onEventsCreated(data.eventosCriados || 0);
        }
      } else {
        toast({
          title: "Processo não encontrado",
          description: "Não foram encontradas informações para este número de processo.",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Erro na sincronização CNJ:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível consultar o processo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sincronizarProcesso();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          Integração CNJ/DataJud
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sincronize processos e importe audiências/prazos automaticamente para sua agenda.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Número do Processo (CNJ)
            </label>
            <Input
              value={numeroProcesso}
              onChange={handleInputChange}
              placeholder="0000000-00.0000.0.00.0000"
              className="font-mono"
              maxLength={25}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Digite o número único do processo (20 dígitos)
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !validarNumeroProcesso(numeroProcesso)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Consultando DataJud...
              </>
            ) : (
              'Sincronizar Processo'
            )}
          </Button>
        </form>

        {/* Resultado da sincronização */}
        {resultado && resultado.found && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Sincronizado
                </Badge>
                <span className="text-sm font-medium">
                  {resultado.processo?.numero}
                </span>
              </div>

              {resultado.processo && (
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {resultado.processo.tribunal && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Tribunal:</span>
                      <span>{resultado.processo.tribunal}</span>
                    </div>
                  )}
                  {resultado.processo.classe && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Classe:</span>
                      <span>{resultado.processo.classe}</span>
                    </div>
                  )}
                </div>
              )}

              {resultado.eventosCriados > 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Calendar className="w-4 h-4" />
                  <span>{resultado.eventosCriados} evento(s) adicionado(s) à agenda</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Informações sobre a integração */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>📋 DataJud:</strong> Consulta metadados públicos dos tribunais</p>
          <p><strong>⚡ Automatização:</strong> Detecta audiências e prazos automaticamente</p>
          <p><strong>🔄 Sincronização:</strong> Dados são atualizados em tempo real</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CNJIntegration;