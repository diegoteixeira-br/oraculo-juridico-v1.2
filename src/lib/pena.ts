import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { EpisodioCustodia, Remissao, DadosSentenca, ResultadoCalculoV2, PontoTempo } from '@/types/pena';

// Configurar dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

const TIMEZONE = 'America/Cuiaba';

export function converterParaDias({ anos, meses, dias }: { anos: number; meses: number; dias: number }): number {
  return (anos * 365) + (meses * 30) + dias;
}

export function somarDiasISO(dataISO: string, dias: number): string {
  return dayjs(dataISO).tz(TIMEZONE).add(dias, 'day').format('YYYY-MM-DD');
}

export function calcularDiasCumpridosAte(
  episodios: EpisodioCustodia[], 
  ate: string, 
  incluirDiaSoltura: boolean = false
): number {
  let totalDias = 0;
  const dataLimite = dayjs(ate).tz(TIMEZONE);

  episodios
    .filter(ep => ep.computavel)
    .forEach(episodio => {
      const inicio = dayjs(episodio.inicio).tz(TIMEZONE);
      let fim = episodio.fim ? dayjs(episodio.fim).tz(TIMEZONE) : dataLimite;

      // Se o episódio ainda não começou na data limite, pular
      if (inicio.isAfter(dataLimite)) return;

      // Se o episódio termina depois da data limite, usar a data limite
      if (fim.isAfter(dataLimite)) {
        fim = dataLimite;
      }

      // Calcular dias do episódio
      let diasEpisodio;
      if (incluirDiaSoltura) {
        diasEpisodio = fim.diff(inicio, 'day') + 1;
      } else {
        diasEpisodio = fim.diff(inicio, 'day');
      }

      totalDias += Math.max(0, diasEpisodio);
    });

  return totalDias;
}

export function calcularRemissoesAte(remissoes: Remissao[], ate: string): number {
  const dataLimite = dayjs(ate).tz(TIMEZONE);
  
  return remissoes
    .filter(remissao => dayjs(remissao.dataCredito).tz(TIMEZONE).isSameOrBefore(dataLimite))
    .reduce((total, remissao) => total + remissao.dias, 0);
}

// Função simplificada para entrada básica
export function calcularPenaSimples(
  penaAnos: number,
  penaMeses: number,
  penaDias: number,
  tipoPercentual: 'primario' | 'reincidente' | 'hediondo_primario' | 'hediondo_reincidente',
  regimeInicial: 'Fechado' | 'Semiaberto' | 'Aberto',
  detraidosDias: number = 0,
  dataBase: string = new Date().toISOString().split('T')[0]
): ResultadoCalculoV2 {
  // Converter pena para dias
  const totalDias = converterParaDias({ anos: penaAnos, meses: penaMeses, dias: penaDias });
  
  // Definir frações por tipo
  const fracoes = {
    primario: { progressao: 1/6, livramento: 1/3 }, // 16.67%, 33.33%
    reincidente: { progressao: 1/5, livramento: 1/2 }, // 20%, 50%
    hediondo_primario: { progressao: 2/5, livramento: 2/3 }, // 40%, 66.67%
    hediondo_reincidente: { progressao: 3/5, livramento: 4/5 } // 60%, 80%
  };
  
  const fracao = fracoes[tipoPercentual];
  
  // Criar dados de sentença
  const dadosSentenca: DadosSentenca = {
    crimes: [{
      id: crypto.randomUUID(),
      descricao: 'Crime informado',
      artigo: 'Art. XXX',
      penaAnos,
      penaMeses,
      penaDias,
      tipoPercentual,
      observacoes: ''
    }],
    totalDias,
    regimeInicial,
    fracaoProgressao: fracao.progressao,
    fracaoLivramento: fracao.livramento,
    dataInicioTeorica: dataBase
  };
  
  // Episódio de custódia para detração (se houver)
  const episodios: EpisodioCustodia[] = detraidosDias > 0 ? [{
    id: crypto.randomUUID(),
    tipo: 'Cumprimento de Pena',
    inicio: dayjs(dataBase).subtract(detraidosDias, 'day').format('YYYY-MM-DD'),
    fim: dataBase,
    computavel: true,
    observacao: 'Detração (dias já cumpridos)'
  }] : [];
  
  const remissoes: Remissao[] = [];
  
  return calcularDatasChave(dadosSentenca, episodios, remissoes, dataBase, false);
}

export function calcularDatasChave(
  dados: DadosSentenca,
  episodios: EpisodioCustodia[],
  remissoes: Remissao[],
  hojeISO: string,
  incluirDiaSoltura: boolean = false
): ResultadoCalculoV2 {
  const hoje = dayjs(hojeISO).tz(TIMEZONE);
  
  // Criar pontos de mudança na linha do tempo
  const pontos: PontoTempo[] = [];
  
  // Adicionar episódios
  episodios.filter(ep => ep.computavel).forEach(episodio => {
    pontos.push({
      data: episodio.inicio,
      tipo: 'inicio_episodio',
      episodioId: episodio.id,
      valor: 1
    });
    
    if (episodio.fim) {
      pontos.push({
        data: episodio.fim,
        tipo: 'fim_episodio',
        episodioId: episodio.id,
        valor: -1
      });
    }
  });
  
  // Adicionar remições
  remissoes.forEach(remissao => {
    pontos.push({
      data: remissao.dataCredito,
      tipo: 'credito_remissao',
      remissaoId: remissao.id,
      valor: remissao.dias
    });
  });
  
  // Ordenar pontos cronologicamente
  pontos.sort((a, b) => dayjs(a.data).diff(dayjs(b.data)));
  
  // Simular o tempo e encontrar as datas chave
  let custodiaAtiva = 0;
  let diasCumpridos = 0;
  let remicoesAcumuladas = 0;
  let dataAnterior = pontos.length > 0 ? dayjs(pontos[0].data).tz(TIMEZONE) : hoje;
  
  let dataProgressao: string | undefined;
  let dataLivramento: string | undefined;
  let dataTermino: string = hojeISO;
  
  const diasNecessariosProgressao = dados.fracaoProgressao * dados.totalDias;
  const diasNecessariosLivramento = dados.fracaoLivramento ? dados.fracaoLivramento * dados.totalDias : undefined;
  const diasNecessariosTermino = dados.totalDias;
  
  for (const ponto of pontos) {
    const dataPonto = dayjs(ponto.data).tz(TIMEZONE);
    
    // Acumular dias cumpridos no período anterior se estava em custódia
    if (custodiaAtiva > 0 && dataPonto.isAfter(dataAnterior)) {
      const diasPeriodo = incluirDiaSoltura ? 
        dataPonto.diff(dataAnterior, 'day') + (ponto.tipo === 'fim_episodio' ? 1 : 0) :
        dataPonto.diff(dataAnterior, 'day');
      diasCumpridos += diasPeriodo;
    }
    
    // Aplicar mudança do ponto atual
    if (ponto.tipo === 'inicio_episodio') {
      custodiaAtiva += ponto.valor;
    } else if (ponto.tipo === 'fim_episodio') {
      custodiaAtiva += ponto.valor;
    } else if (ponto.tipo === 'credito_remissao') {
      remicoesAcumuladas += ponto.valor;
    }
    
    // Verificar se atingiu alguma data chave
    const totalCumprido = diasCumpridos + remicoesAcumuladas;
    
    if (!dataProgressao && totalCumprido >= diasNecessariosProgressao) {
      if (custodiaAtiva > 0) {
        // Está em custódia, calcular data exata
        const diasFaltavam = diasNecessariosProgressao - (diasCumpridos + remicoesAcumuladas - ponto.valor);
        dataProgressao = dataAnterior.add(diasFaltavam, 'day').format('YYYY-MM-DD');
      } else {
        // Não está em custódia, marcar para o próximo período
        dataProgressao = ponto.data;
      }
    }
    
    if (!dataLivramento && diasNecessariosLivramento && totalCumprido >= diasNecessariosLivramento) {
      if (custodiaAtiva > 0) {
        const diasFaltavam = diasNecessariosLivramento - (diasCumpridos + remicoesAcumuladas - ponto.valor);
        dataLivramento = dataAnterior.add(diasFaltavam, 'day').format('YYYY-MM-DD');
      } else {
        dataLivramento = ponto.data;
      }
    }
    
    if (totalCumprido >= diasNecessariosTermino) {
      if (custodiaAtiva > 0) {
        const diasFaltavam = diasNecessariosTermino - (diasCumpridos + remicoesAcumuladas - ponto.valor);
        dataTermino = dataAnterior.add(diasFaltavam, 'day').format('YYYY-MM-DD');
      } else {
        dataTermino = ponto.data;
      }
      break;
    }
    
    dataAnterior = dataPonto;
  }
  
  // Calcular situação atual (até hoje)
  const diasCumpridosHoje = calcularDiasCumpridosAte(episodios, hojeISO, incluirDiaSoltura);
  const remicoesAcumuladasHoje = calcularRemissoesAte(remissoes, hojeISO);
  const totalCumpridoHoje = diasCumpridosHoje + remicoesAcumuladasHoje;
  
  // Se ainda não atingiu o término, projetar para o futuro
  if (totalCumpridoHoje < diasNecessariosTermino && custodiaAtiva > 0) {
    const diasRestantes = diasNecessariosTermino - totalCumpridoHoje;
    dataTermino = somarDiasISO(hojeISO, diasRestantes);
  }
  
  return {
    dataProgressao,
    dataLivramento,
    dataTermino,
    diasCumpridosHoje,
    diasFaltantesParaProgressao: dataProgressao ? undefined : Math.max(0, diasNecessariosProgressao - totalCumpridoHoje),
    diasFaltantesParaTermino: Math.max(0, diasNecessariosTermino - totalCumpridoHoje),
    remicoesAcumuladasHoje
  };
}

export function obterStatusAtual(
  episodios: EpisodioCustodia[],
  hojeISO: string
): 'Em liberdade' | 'Em custódia' {
  const hoje = dayjs(hojeISO).tz(TIMEZONE);
  
  const emCustodia = episodios.some(episodio => {
    const inicio = dayjs(episodio.inicio).tz(TIMEZONE);
    const fim = episodio.fim ? dayjs(episodio.fim).tz(TIMEZONE) : null;
    
    return inicio.isSameOrBefore(hoje) && (!fim || fim.isAfter(hoje));
  });
  
  return emCustodia ? 'Em custódia' : 'Em liberdade';
}