/**
 * Funções puras de histórico e lacunas herdadas (RN07, RF-05/06, D05, D08). Sem Nest/TypeORM.
 * Uma "marcação" é qualquer registro pedagógico de nível de uma habilidade:
 * avaliação bimestral (SkillResponse, versão vigente) ou evento (consolidação / reavaliação).
 */

export type TipoMarcacao = 'AVALIACAO' | 'CONSOLIDACAO' | 'REAVALIACAO';

export interface Marcacao {
  skillId: string;
  contextId: number;
  anoLetivo: number; // ano letivo do período pedagógico da marcação
  bimestre: number;
  seq: number; // ordem global de registro (D05); revisão mantém o seq original
  nivel: number; // 0 Não consolidada · 1 Em desenvolvimento · 2 Consolidada
  tipo: TipoMarcacao;
  autorId: number;
}

export interface Referencia { anoLetivo: number; bimestre: number }

/** D05: ordem pedagógica = período (ano, bimestre) e, no mesmo período, ordem de registro (seq). */
export function compararMarcacoes(a: Marcacao, b: Marcacao): number {
  return a.anoLetivo - b.anoLetivo || a.bimestre - b.bimestre || a.seq - b.seq;
}

export function ateReferencia(m: { anoLetivo: number; bimestre: number }, ref: Referencia): boolean {
  return m.anoLetivo < ref.anoLetivo || (m.anoLetivo === ref.anoLetivo && m.bimestre <= ref.bimestre);
}

/** Última marcação válida da habilidade até a referência (ausência posterior não apaga a anterior). */
export function ultimaMarcacao(marcacoes: Marcacao[], skillId: string, ref?: Referencia): Marcacao | null {
  let ultima: Marcacao | null = null;
  for (const m of marcacoes) {
    if (m.skillId !== skillId || (ref && !ateReferencia(m, ref))) continue;
    if (!ultima || compararMarcacoes(m, ultima) > 0) ultima = m;
  }
  return ultima;
}

export interface ContextoElegivel { contextId: number; anoLetivo: number; etapa: number; skillIds: string[] }

export type SituacaoLacuna = 'NAO_CONSOLIDADA' | 'EM_DESENVOLVIMENTO' | 'SEM_AVALIACAO' | 'CONSOLIDADA';

export interface ItemLacuna {
  skillId: string;
  origem: { contextId: number; anoLetivo: number; etapa: number };
  situacao: SituacaoLacuna;
  pendente: boolean;
  ultima: Marcacao | null;
}

export interface Decomposicao { total: number; naoConsolidada: number; emDesenvolvimento: number; semAvaliacao: number }

/**
 * RN07 / spec lacunas-herdadas.
 * - Elegíveis: contextos anteriores cursados e encerrados ao menos uma vez (quem chama filtra).
 * - Deduplica por ID estável; origem = contexto elegível mais recente que previa a habilidade.
 * - Última marcação até a referência: 0/1 = pendência pedagógica; nunca marcada = "Sem avaliação registrada"
 *   (conta como pendência, sem nível negativo); 2 = consolidada (fora da contagem).
 * - Eventos depois da referência não entram (CR-23).
 */
export function calcularLacunas(i: {
  contextosElegiveis: ContextoElegivel[];
  marcacoes: Marcacao[];
  referencia: Referencia;
}): { itens: ItemLacuna[]; decomposicao: Decomposicao } {
  const origemPorSkill = new Map<string, ContextoElegivel>();
  const ordenados = [...i.contextosElegiveis].sort((a, b) => a.anoLetivo - b.anoLetivo || a.contextId - b.contextId);
  for (const c of ordenados) for (const s of c.skillIds) origemPorSkill.set(s, c);

  const itens: ItemLacuna[] = [];
  for (const [skillId, c] of origemPorSkill) {
    const ultima = ultimaMarcacao(i.marcacoes, skillId, i.referencia);
    const situacao: SituacaoLacuna =
      ultima === null ? 'SEM_AVALIACAO' : ultima.nivel === 2 ? 'CONSOLIDADA' : ultima.nivel === 1 ? 'EM_DESENVOLVIMENTO' : 'NAO_CONSOLIDADA';
    itens.push({
      skillId,
      origem: { contextId: c.contextId, anoLetivo: c.anoLetivo, etapa: c.etapa },
      situacao,
      pendente: situacao !== 'CONSOLIDADA',
      ultima,
    });
  }
  itens.sort((a, b) => a.origem.anoLetivo - b.origem.anoLetivo || a.skillId.localeCompare(b.skillId));

  const conta = (s: SituacaoLacuna) => itens.filter((x) => x.situacao === s).length;
  const decomposicao = {
    naoConsolidada: conta('NAO_CONSOLIDADA'),
    emDesenvolvimento: conta('EM_DESENVOLVIMENTO'),
    semAvaliacao: conta('SEM_AVALIACAO'),
    total: 0,
  };
  decomposicao.total = decomposicao.naoConsolidada + decomposicao.emDesenvolvimento + decomposicao.semAvaliacao;
  return { itens, decomposicao };
}

/**
 * Resumo anual (requisitos seção 6): última marcação válida de cada habilidade DENTRO do contexto,
 * só com avaliações daquele contexto. Não é a avaliação do 4º bimestre e não recebe eventos de anos seguintes.
 */
export function resumoAnual(skillIds: string[], marcacoesDoContexto: Marcacao[]): Map<string, Marcacao | null> {
  const avaliacoes = marcacoesDoContexto.filter((m) => m.tipo === 'AVALIACAO');
  return new Map(skillIds.map((s) => [s, ultimaMarcacao(avaliacoes, s)]));
}

/** Última observação não vazia do ano (por bimestre e depois por ordem de criação). */
export function ultimaObservacao<T extends { bimestre: number; texto: string; ordem: number }>(obs: T[]): T | null {
  const validas = obs.filter((o) => o.texto.trim() !== '');
  validas.sort((a, b) => a.bimestre - b.bimestre || a.ordem - b.ordem);
  return validas.length ? validas[validas.length - 1] : null;
}
