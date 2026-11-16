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

export interface Turma {
  id: number; nome: string; etapa: number; anoLetivo: number; alunos: number; meuVinculo: 'TITULAR' | 'SUBSTITUTA' | null;
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
