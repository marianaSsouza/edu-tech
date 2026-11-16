/** D02: limite compartilhado de 4.000 caracteres nos textos vigentes do aluno/bimestre. */
export const LIMITE_OBSERVACOES = 4000;

export function contarCaracteres(texto: string): number {
  return Array.from(texto).length;
}

export interface VerificacaoLimite { cabe: boolean; usado: number; max: number }

/** `vigentes` = textos hoje vigentes; `ignorarId` = observação em edição (seu texto antigo sai da conta). */
export function verificarLimite(
  vigentes: Array<{ id: number; texto: string }>,
  novoTexto: string,
  ignorarId?: number,
): VerificacaoLimite {
  const base = vigentes.filter((o) => o.id !== ignorarId).reduce((soma, o) => soma + contarCaracteres(o.texto), 0);
  const usado = base + contarCaracteres(novoTexto);
  return { cabe: usado <= LIMITE_OBSERVACOES, usado, max: LIMITE_OBSERVACOES };
}
