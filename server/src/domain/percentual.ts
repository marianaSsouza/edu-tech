/**
 * D09 — arredondamento só com inteiros (sem ponto flutuante).
 * Para n/d não negativos e d > 0: décimos percentuais q = floor((2000*n + d) / (2*d)).
 * Exibir q/10 junto com a fração original (n de d).
 */
export function decimosPercentuais(n: number, d: number): number {
  if (!Number.isInteger(n) || !Number.isInteger(d) || n < 0 || d <= 0) {
    throw new RangeError('n e d devem ser inteiros, com n >= 0 e d > 0');
  }
  return Math.floor((2000 * n + d) / (2 * d));
}

/** Texto brasileiro com uma casa decimal ("58,3%"). Denominador zero não vira 0%: mostra "—". */
export function formatarPercentual(n: number, d: number): string {
  if (d === 0) return '—';
  const q = decimosPercentuais(n, d);
  return `${Math.floor(q / 10)},${q % 10}%`;
}
