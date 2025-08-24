export type EpisodioCustodia = {
  id: string;
  tipo: 'Prisao em Flagrante' | 'Prisao Preventiva' | 'Prisao Temporaria' | 'Cumprimento de Pena' | 'Prisao Domiciliar' | 'Internacao' | 'Outra';
  inicio: string;   // ISO date (YYYY-MM-DD)
  fim?: string;     // ISO date; ausente se ainda preso
  computavel: boolean; // conta para detração? (default true)
  observacao?: string;
};

export type Remissao = {
  id: string;
  dataCredito: string; // ISO date
  dias: number;        // dias remidos creditados nesta data
  motivo: 'Trabalho' | 'Estudo' | 'Leitura' | 'Outro';
  observacao?: string;
};

export type EventoProcessual = {
  id: string;
  data: string; // ISO date
  tipo: 'Condenacao' | 'Unificacao' | 'Progressao' | 'Regressao' | 'Livramento' | 'Indulto' | 'Outro';
  observacao?: string;
};

export type Crime = {
  id: string;
  descricao: string;
  artigo: string;
  penaAnos: number;
  penaMeses: number;
  penaDias: number;
  tipoPercentual: 'primario' | 'reincidente' | 'hediondo_primario' | 'hediondo_reincidente';
  observacoes?: string;
};

export type DadosSentenca = {
  crimes: Crime[];
  totalDias: number;        // total da pena em dias (converter anos/meses/dias p/ dias)
  regimeInicial: 'Fechado' | 'Semiaberto' | 'Aberto';
  fracaoProgressao: number; // ex.: 1/6 = 0.1667, 2/5 = 0.4, 3/5 = 0.6 (editável)
  fracaoLivramento?: number; // opcional, ex.: 1/3, 1/2, 2/3
  dataInicioTeorica?: string; // opcional (inicio do cumprimento, se existir)
  numeroProcesso?: string;
  vara?: string;
  juiz?: string;
  dataTransito?: string; // data do trânsito em julgado
  observacoes?: string;
};

export type ResultadoCalculoV2 = {
  dataProgressao?: string;
  dataLivramento?: string;
  dataTermino: string;
  diasCumpridosHoje: number;
  diasFaltantesParaProgressao?: number;
  diasFaltantesParaTermino: number;
  remicoesAcumuladasHoje: number;
};

export type PontoTempo = {
  data: string;
  tipo: 'inicio_episodio' | 'fim_episodio' | 'credito_remissao';
  episodioId?: string;
  remissaoId?: string;
  valor: number; // +1 para início, -1 para fim, ou quantidade de dias remidos
};