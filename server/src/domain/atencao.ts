/**
 * Atenção pedagógica (RN04, RN08, RN09; spec atencao-pedagogica). Funções puras.
 * Escrita: 0 Pré-silábico · 1 Silábico · 2 Silábico-alfabético · 3 Alfabético (códigos só para comparar; não são notas).
 */

/** RN04: mínimo de escrita por etapa (1º a 5º ano) e bimestre (1º a 4º). Política do projeto, não norma da BNCC. */
export const MINIMO_ESCRITA: Record<number, [number, number, number, number]> = {
  1: [0, 1, 1, 2],
  2: [2, 2, 3, 3],
  3: [3, 3, 3, 3],
  4: [3, 3, 3, 3],
  5: [3, 3, 3, 3],
};

/** RN08: limite fixo do produto. Outro valor só existe como parâmetro de teste (CR-09). */
export const LIMITE_LACUNAS = 2;

export function minimoEscrita(etapa: number, bimestre: number): number {
  const linha = MINIMO_ESCRITA[etapa];
  if (!linha || bimestre < 1 || bimestre > 4) throw new Error(`Sem mínimo de escrita para etapa ${etapa}, bimestre ${bimestre}.`);
  return linha[bimestre - 1];
}

export type MotivoAtencao = 'LACUNAS' | 'ESCRITA' | 'MANUAL';
export type EstadoAtencao = 'EM_ATENCAO' | 'SEM_SINAL' | 'INCOMPLETA';

export interface ResultadoAtencao {
  estado: EstadoAtencao;
  motivos: MotivoAtencao[];
  escritaAusente: boolean; // comparação de escrita indeterminada (CA-08.7)
  minimoEscrita: number;
}

/**
 * automática = (L >= limite) OU (escrita registrada < mínimo);  em atenção = automática OU manual ativa.
 * Escrita ausente: comparação indeterminada. Sem outro motivo → INCOMPLETA ("Atenção automática não concluída"),
 * nunca "sem atenção". Um aluno com vários motivos continua sendo UMA criança (CR-17).
 */
export function avaliarAtencao(i: {
  lacunasPendentes: number;
  escrita: number | null;
  etapa: number;
  bimestre: number;
  manuaisAtivas: number;
  limite?: number;
}): ResultadoAtencao {
  const limite = i.limite ?? LIMITE_LACUNAS;
  const minimo = minimoEscrita(i.etapa, i.bimestre);
  const motivos: MotivoAtencao[] = [];
  if (i.lacunasPendentes >= limite) motivos.push('LACUNAS');
  if (i.escrita !== null && i.escrita < minimo) motivos.push('ESCRITA');
  if (i.manuaisAtivas > 0) motivos.push('MANUAL');
  const escritaAusente = i.escrita === null;
  const estado: EstadoAtencao = motivos.length ? 'EM_ATENCAO' : escritaAusente ? 'INCOMPLETA' : 'SEM_SINAL';
  return { estado, motivos, escritaAusente, minimoEscrita: minimo };
}

/** RN09: justificativa/comentário de atenção manual com 1 a 2.000 caracteres não vazios. */
export const LIMITE_TEXTO_ATENCAO = 2000;
export function textoAtencaoValido(t: unknown): t is string {
  return typeof t === 'string' && t.trim().length > 0 && Array.from(t.trim()).length <= LIMITE_TEXTO_ATENCAO;
}

/**
 * Tarefa 5.3 (CR-23, spec atencao-pedagogica "Ciclo de vida manual independente"): a atenção manual está ativa
 * numa referência (ano, bimestre) se foi aberta até ela e o último encerramento/reabertura até ela não a encerrou.
 * Encerrar hoje não apaga a atenção das consultas anteriores; abrir hoje não a aplica ao passado.
 * Evento sem período (registros antigos) é tratado como já aplicado.
 */
export interface ManualParaCorte { anoLetivo: number; bimestre: number }
export interface EventoParaCorte { id: number; tipo: string; anoLetivo: number | null; bimestre: number | null }
const chave = (ano: number, bim: number) => ano * 10 + bim;
export function manualAtivaEm(a: ManualParaCorte, eventos: EventoParaCorte[], ref: { anoLetivo: number; bimestre: number }): boolean {
  const r = chave(ref.anoLetivo, ref.bimestre);
  if (chave(a.anoLetivo, a.bimestre) > r) return false;
  let ativa = true;
  for (const e of [...eventos].sort((x, y) => x.id - y.id)) {
    if (e.tipo !== 'ENCERRAMENTO' && e.tipo !== 'REABERTURA') continue;
    if (e.anoLetivo !== null && e.bimestre !== null && chave(e.anoLetivo, e.bimestre) > r) continue;
    ativa = e.tipo === 'REABERTURA';
  }
  return ativa;
}
