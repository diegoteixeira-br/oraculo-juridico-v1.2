import { useMemo } from 'react';
import { EpisodioCustodia, Remissao, EventoProcessual, ResultadoCalculoV2 } from '@/types/pena';
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineExecucaoProps {
  episodios: EpisodioCustodia[];
  remissoes: Remissao[];
  eventos: EventoProcessual[];
  resultado: ResultadoCalculoV2 | null;
}

interface EventoTimeline {
  data: string;
  tipo: 'inicio_prisao' | 'fim_prisao' | 'remissao' | 'evento' | 'progressao' | 'livramento' | 'termino';
  descricao: string;
  detalhes?: string;
  cor: string;
  icone?: string;
}

export default function TimelineExecucao({ 
  episodios, 
  remissoes, 
  eventos,
  resultado 
}: TimelineExecucaoProps) {
  
  const eventosTimeline = useMemo(() => {
    const items: EventoTimeline[] = [];
    
    // Adicionar episódios de custódia
    episodios.forEach(episodio => {
      items.push({
        data: episodio.inicio,
        tipo: 'inicio_prisao',
        descricao: `Início: ${episodio.tipo}`,
        detalhes: episodio.observacao,
        cor: episodio.computavel ? 'border-red-500 bg-red-500/10' : 'border-gray-500 bg-gray-500/10',
        icone: '🔒'
      });
      
      if (episodio.fim) {
        items.push({
          data: episodio.fim,
          tipo: 'fim_prisao',
          descricao: `Fim: ${episodio.tipo}`,
          detalhes: episodio.observacao,
          cor: episodio.computavel ? 'border-green-500 bg-green-500/10' : 'border-gray-500 bg-gray-500/10',
          icone: '🔓'
        });
      }
    });
    
    // Adicionar remições
    remissoes.forEach(remissao => {
      items.push({
        data: remissao.dataCredito,
        tipo: 'remissao',
        descricao: `Remição: ${remissao.dias} dias`,
        detalhes: `${remissao.motivo}${remissao.observacao ? ` - ${remissao.observacao}` : ''}`,
        cor: 'border-emerald-500 bg-emerald-500/10',
        icone: '📚'
      });
    });
    
    // Adicionar eventos processuais
    eventos.forEach(evento => {
      items.push({
        data: evento.data,
        tipo: 'evento',
        descricao: evento.tipo,
        detalhes: evento.observacao,
        cor: 'border-blue-500 bg-blue-500/10',
        icone: '⚖️'
      });
    });
    
    // Adicionar datas calculadas
    if (resultado) {
      if (resultado.dataProgressao) {
        items.push({
          data: resultado.dataProgressao,
          tipo: 'progressao',
          descricao: 'Progressão de Regime',
          cor: 'border-primary bg-primary/10',
          icone: '⬆️'
        });
      }
      
      if (resultado.dataLivramento) {
        items.push({
          data: resultado.dataLivramento,
          tipo: 'livramento',
          descricao: 'Livramento Condicional',
          cor: 'border-purple-500 bg-purple-500/10',
          icone: '🏠'
        });
      }
      
      items.push({
        data: resultado.dataTermino,
        tipo: 'termino',
        descricao: 'Término da Pena',
        cor: 'border-orange-500 bg-orange-500/10',
        icone: '🎉'
      });
    }
    
    // Ordenar por data
    return items.sort((a, b) => dayjs(a.data).diff(dayjs(b.data)));
  }, [episodios, remissoes, eventos, resultado]);
  
  if (eventosTimeline.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        Adicione episódios para visualizar a linha do tempo
      </div>
    );
  }
  
  const hoje = dayjs().format('YYYY-MM-DD');
  
  return (
    <div className="relative">
      {/* Linha vertical */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-600"></div>
      
      <div className="space-y-6">
        {eventosTimeline.map((evento, index) => {
          const isPassed = dayjs(evento.data).isBefore(hoje) || dayjs(evento.data).isSame(hoje, 'day');
          const isToday = dayjs(evento.data).isSame(hoje, 'day');
          
          return (
            <div key={index} className="relative flex items-start">
              {/* Círculo na linha */}
              <div className={cn(
                "absolute left-6 w-4 h-4 rounded-full border-2 z-10",
                isPassed ? "bg-white border-white" : "bg-slate-800 border-slate-400",
                isToday && "ring-4 ring-primary/30"
              )} />
              
              {/* Card do evento */}
              <div className="ml-16 flex-1">
                <div className={cn(
                  "p-4 rounded-lg border",
                  evento.cor,
                  !isPassed && "opacity-60"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{evento.icone}</span>
                        <h4 className="font-semibold text-white">{evento.descricao}</h4>
                        {isToday && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            HOJE
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-slate-400 mt-1">
                        {format(new Date(evento.data), 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                      
                      {evento.detalhes && (
                        <div className="text-sm text-slate-300 mt-2">
                          {evento.detalhes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Linha de hoje */}
      <div className="mt-6 pt-4 border-t border-slate-600">
        <div className="flex items-center gap-2 text-primary">
          <div className="w-2 h-2 bg-primary rounded-full"></div>
          <span className="text-sm font-medium">
            Hoje: {format(new Date(hoje), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  );
}