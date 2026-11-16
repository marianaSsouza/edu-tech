/**
 * Indicadores do painel (RN12, RN13, RF-10; requisitos seção 7). Funções puras.
 * T = pares aluno/habilidade previstos = C + D + NC + U. Respostas só do bimestre (sem preencher com anteriores).
 */
import { EstadoAtencao } from './atencao';
import { SituacaoLacuna } from './lacunas';
import { formatarPercentual } from './percentual';

/** RN13: abaixo disso, agregados pedagógicos ficam ocultos nos dois perfis. */
export const GRUPO_MINIMO = 5;
export const ALFABETICO = 3;

export interface Fracao { n: number; d: number; percentual: string | null } // null = "Sem dados" (0/0)

export function fracao(n: number, d: number): Fracao {
  return { n, d, percentual: d === 0 ? null : formatarPercentual(n, d) };
}

export interface AlunoPainel {
  skillIds: string[]; // habilidades previstas no contexto do aluno (T aceita catálogo não uniforme)
  respostas: Record<string, number>; // skillId -> nível no bimestre; ausente = sem linha
  escrita: number | null;
  atencao: EstadoAtencao;
  lacunas: Array<{ skillId: string; situacao: SituacaoLacuna }>; // só as pendentes interessam
}

export interface Agregados {
  N: number;
  pares: { T: number; C: number; D: number; NC: number; U: number };
  consolidacao: Fracao; // C/T
  coberturaHabilidades: Fracao; // (T-U)/T
  semAvaliacoes: boolean; // T > 0 e tudo ausente
  escritaAlfabetica: Fracao; // alfabéticos/N
  coberturaEscrita: Fracao; // com escrita/N
  escritaAusente: number;
  emAtencao: Fracao; // alunos distintos com motivo conhecido / N
  atencaoIncompleta: number; // sem escrita e sem outro motivo (contado à parte)
  porHabilidade: Array<{ skillId: string; previstos: number; C: number; D: number; NC: number; U: number; consolidacao: Fracao }>;
  lacunasPorHabilidade: Array<{ skillId: string; criancas: number; porAusencia: number; fracao: Fracao }>;
}

export function agregar(alunos: AlunoPainel[]): Agregados {
  const N = alunos.length;
  const pares = { T: 0, C: 0, D: 0, NC: 0, U: 0 };
  const porSkill = new Map<string, { previstos: number; C: number; D: number; NC: number; U: number }>();
  const lacunas = new Map<string, { criancas: number; porAusencia: number }>();

  for (const a of alunos) {
    for (const s of a.skillIds) {
      const linha = porSkill.get(s) ?? { previstos: 0, C: 0, D: 0, NC: 0, U: 0 };
      linha.previstos++;
      pares.T++;
      const nivel = a.respostas[s];
      const chave = nivel === undefined ? 'U' : nivel === 2 ? 'C' : nivel === 1 ? 'D' : 'NC';
      linha[chave]++;
      pares[chave]++;
      porSkill.set(s, linha);
    }
    for (const l of a.lacunas) {
      if (l.situacao === 'CONSOLIDADA') continue;
      const x = lacunas.get(l.skillId) ?? { criancas: 0, porAusencia: 0 };
      x.criancas++;
      if (l.situacao === 'SEM_AVALIACAO') x.porAusencia++;
      lacunas.set(l.skillId, x);
    }
  }

  const comEscrita = alunos.filter((a) => a.escrita !== null).length;
  return {
    N,
    pares,
    consolidacao: fracao(pares.C, pares.T),
    coberturaHabilidades: fracao(pares.T - pares.U, pares.T),
    semAvaliacoes: pares.T > 0 && pares.U === pares.T,
    escritaAlfabetica: fracao(alunos.filter((a) => a.escrita === ALFABETICO).length, N),
    coberturaEscrita: fracao(comEscrita, N),
    escritaAusente: N - comEscrita,
    emAtencao: fracao(alunos.filter((a) => a.atencao === 'EM_ATENCAO').length, N),
    atencaoIncompleta: alunos.filter((a) => a.atencao === 'INCOMPLETA').length,
    porHabilidade: [...porSkill].map(([skillId, x]) => ({ skillId, ...x, consolidacao: fracao(x.C, x.previstos) })),
    lacunasPorHabilidade: [...lacunas]
      .map(([skillId, x]) => ({ skillId, ...x, fracao: fracao(x.criancas, N) }))
      .sort((a, b) => b.criancas - a.criancas || a.skillId.localeCompare(b.skillId)),
  };
}

/** RN13 / CR-18: com N < 5, nenhum agregado pedagógico sai do servidor. */
export function agregadosVisiveis(N: number): boolean {
  return N >= GRUPO_MINIMO;
}

export interface Evolucao { E: number; V: number; semComparacao: number; N: number; fracao: Fracao }

/**
 * Evolução da escrita (seção 7, CR-11/CR-20): conjunto = alunos da turma na referência B; registros A dos mesmos alunos.
 * E = nível B > nível A; V = escrita presente em A e em B; N − V sem comparação. Ausência nunca vira zero;
 * igual ou menor não conta como avanço.
 */
export function evolucaoEscrita(alunos: Array<{ a: number | null; b: number | null }>): Evolucao {
  const comparaveis = alunos.filter((x) => x.a !== null && x.b !== null);
  const E = comparaveis.filter((x) => (x.b as number) > (x.a as number)).length;
  const V = comparaveis.length;
  return { E, V, semComparacao: alunos.length - V, N: alunos.length, fracao: fracao(E, V) };
}
