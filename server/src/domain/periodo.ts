export type SituacaoPeriodo = 'DISPONIVEL' | 'FECHADO' | 'FUTURO';

/** D06: período futuro não aceita registro; fechado bloqueia escrita pedagógica. */
export function situacaoPeriodo(p: { estado: string; inicio: string }, hoje: string): SituacaoPeriodo {
  if (p.inicio > hoje) return 'FUTURO';
  if (p.estado === 'FECHADO') return 'FECHADO';
  return 'DISPONIVEL';
}

/** Bimestre sugerido ao abrir a ficha: o mais recente já iniciado (ou o 1º). */
export function bimestreSugerido(periodos: Array<{ bimestre: number; inicio: string }>, hoje: string): number {
  const iniciados = periodos.filter((p) => p.inicio <= hoje).map((p) => p.bimestre);
  return iniciados.length ? Math.max(...iniciados) : 1;
}
