/** Erro padronizado da API ({ codigo, mensagem }, D16). status 0 = falha de rede. */
export class ErroApi extends Error {
  constructor(public readonly status: number, public readonly codigo: string, mensagem: string) {
    super(mensagem);
  }
}

export async function api<T>(caminho: string, opcoes: { method?: string; body?: unknown } = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api${caminho}`, {
      method: opcoes.method ?? 'GET',
      headers: opcoes.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
      credentials: 'same-origin',
    });
  } catch {
    throw new ErroApi(0, 'REDE', 'Não foi possível falar com o servidor. Verifique se ele está rodando e tente de novo.');
  }
  const dados = await r.json().catch(() => null);
  if (!r.ok) {
    throw new ErroApi(r.status, dados?.codigo ?? 'ERRO', dados?.mensagem ?? dados?.message ?? `O servidor respondeu ${r.status}.`);
  }
  return dados as T;
}

// ---- tipos das respostas ----

export type Papel = 'PROFESSOR' | 'COORDENACAO';
export interface Usuario { id: number; nome: string; email: string; papel: Papel }

export interface PeriodoAtual { anoLetivo: number; bimestre: number; inicio: string; fim: string; situacao: Situacao }
export interface RespostaTurmas { turmas: Turma[]; periodoAtual: PeriodoAtual | null }

export interface Turma {
  id: number; nome: string; etapa: number; anoLetivo: number; alunos: number; meuVinculo: 'TITULAR' | 'SUBSTITUTA' | null;
  professores?: Array<{ nome: string; tipo: 'TITULAR' | 'SUBSTITUTA' }>; anoEncerrado?: boolean;
}
export interface AlunoDaTurma { id: number; nome: string; contextId: number }

export type Situacao = 'DISPONIVEL' | 'FECHADO' | 'FUTURO';
export interface PeriodoDto { bimestre: number; inicio: string; fim: string; estado: string; situacao: Situacao }
export interface Resposta { id: number; nivel: number; version: number; autorId: number; autorNome: string }
export interface Observacao {
  id: number; texto: string; version: number; autorId: number; autorNome: string; minha: boolean; atualizadoEm: string;
}

export interface AvaliacaoDto {
  aluno: { id: number; nome: string };
  contexto: { id: number; anoLetivo: number; etapa: number; catalogo: string; turma: { id: number; nome: string } | null };
  contextosDisponiveis: Array<{ id: number; anoLetivo: number; etapa: number }>;
  periodo: PeriodoDto;
  periodos: PeriodoDto[];
  permissao: { podeEditar: boolean; codigo: string; motivo: string | null };
  habilidades: Array<{ id: string; area: string; texto: string; exemplo: string; resposta: Resposta | null }>;
  escrita: Resposta | null;
  observacoes: Observacao[];
  limiteObservacoes: { usado: number; max: number };
}

export const papelLegivel = (p: Papel) => (p === 'COORDENACAO' ? 'Coordenação' : 'Professora');

// ---- ficha do aluno (histórico e lacunas) ----
export interface Revisao { versaoAnterior: number; nivelAnterior: number | null; nivelNovo: number | null; autorNome: string; justificativa: string; em: string }
export interface Celula { nivel: number | null; autorNome: string; revisoes: Revisao[] } // null = resposta limpa
export type SituacaoLacuna = 'NAO_CONSOLIDADA' | 'EM_DESENVOLVIMENTO' | 'SEM_AVALIACAO' | 'CONSOLIDADA';

export interface AtencaoManual {
  id: number; justificativa: string; situacao: 'ABERTA' | 'ENCERRADA'; autorNome: string; anoLetivo: number; bimestre: number; em: string;
  eventos: Array<{ id: number; tipo: 'COMENTARIO' | 'ENCERRAMENTO' | 'REABERTURA'; texto: string; autorNome: string; em: string }>;
}

export interface FichaDto {
  aluno: { id: number; nome: string };
  atencao: {
    referencia: { anoLetivo: number; bimestre: number; etapa: number };
    estado: 'EM_ATENCAO' | 'SEM_SINAL' | 'INCOMPLETA';
    motivos: Array<'LACUNAS' | 'ESCRITA' | 'MANUAL'>;
    escritaAusente: boolean; minimoEscrita: number; escrita: number | null;
    lacunasPendentes: number; limiteLacunas: number; podeAgir: boolean;
    manuais: AtencaoManual[];
  };
  historicoAnteriorIndisponivel: boolean;
  linhaDoTempo: Array<{
    contexto: { id: number; anoLetivo: number; etapa: number; catalogo: string };
    turmas: Array<{ id: number; nome: string; de: string; ate: string | null }>;
    professoras: Array<{ nome: string; tipo: 'TITULAR' | 'SUBSTITUTA'; de: string; ate: string | null }>;
    periodos: Array<{ bimestre: number; estado: string; situacao: Situacao }>;
    anoEncerrado: boolean;
    habilidades: Array<{ id: string; area: string; texto: string; porBimestre: Array<Celula | null>; resumoAnual: { nivel: number; bimestre: number } | null }>;
    escrita: Array<Celula | null>;
    observacoes: Array<{ id: number; bimestre: number; texto: string; autorNome: string }>;
    ultimaObservacao: { bimestre: number; texto: string; autorNome: string } | null;
  }>;
  lacunas: {
    referencia: { anoLetivo: number; bimestre: number };
    podeRegistrar: boolean; motivoBloqueio: string | null;
    decomposicao: { total: number; naoConsolidada: number; emDesenvolvimento: number; semAvaliacao: number };
    itens: Array<{
      skillId: string; texto: string; origem: { anoLetivo: number; etapa: number }; situacao: SituacaoLacuna; pendente: boolean;
      ultima: { nivel: number; anoLetivo: number; bimestre: number; tipo: string; autorNome: string; evidencia: string | null } | null;
    }>;
    eventos: Array<{
      id: number; tipo: string; skillId: string; texto: string; nivel: number; anoLetivo: number; bimestre: number;
      autorNome: string; justificativa: string; em: string; origemAnoLetivo: number | null;
    }>;
  };
}

// ---- painel (indicadores) ----
export interface Fracao { n: number; d: number; percentual: string | null }
export interface Indicadores {
  N: number;
  pares: { T: number; C: number; D: number; NC: number; U: number };
  consolidacao: Fracao; coberturaHabilidades: Fracao; semAvaliacoes: boolean;
  escritaAlfabetica: Fracao; coberturaEscrita: Fracao; escritaAusente: number;
  emAtencao: Fracao; atencaoIncompleta: number;
  porHabilidade: Array<{ skillId: string; previstos: number; C: number; D: number; NC: number; U: number; consolidacao: Fracao }>;
  lacunasPorHabilidade: Array<{ skillId: string; criancas: number; porAusencia: number; fracao: Fracao }>;
}
export interface ReferenciaPainel { anoLetivo: number; bimestre: number; data: string; situacao: 'FUTURO' | 'ENCERRADO' | 'EM_ANDAMENTO' }
export interface PainelGeral {
  referencia: ReferenciaPainel; periodos: Array<{ bimestre: number; situacao: Situacao }>; anosDisponiveis: number[]; grupoMinimo: number;
  turmas: Array<{ turma: { id: number; nome: string; etapa: number; anoLetivo: number }; N: number; oculto: boolean; indicadores: Indicadores | null }>;
}
export interface PainelTurma {
  turma: { id: number; nome: string; etapa: number; anoLetivo: number };
  referencia: ReferenciaPainel; periodos: Array<{ bimestre: number; situacao: Situacao }>; grupoMinimo: number; limiteLacunas: number;
  N: number; oculto: boolean; indicadores: Indicadores | null;
  habilidades: Array<{ id: string; area: string; texto: string }>;
  evolucao: null | { a: number; b: number; mensagem: string | null; E?: number; V?: number; semComparacao?: number; N?: number; fracao?: Fracao };
  alunos: Array<{
    id: number; nome: string; escrita: number | null; habilidadesAvaliadas: number; habilidadesPrevistas: number;
    lacunas: { total: number; naoConsolidada: number; emDesenvolvimento: number; semAvaliacao: number };
    atencao: { estado: 'EM_ATENCAO' | 'SEM_SINAL' | 'INCOMPLETA'; motivos: Array<'LACUNAS' | 'ESCRITA' | 'MANUAL'>; escritaAusente: boolean };
  }>;
}
