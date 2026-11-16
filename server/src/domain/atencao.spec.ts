import { avaliarAtencao, minimoEscrita, textoAtencaoValido } from './atencao';

const base = { etapa: 2, bimestre: 3, manuaisAtivas: 0 };
const ALFABETICO = 3;
const SILABICO_ALFABETICO = 2;

describe('matriz de escrita (RN04)', () => {
  it('usa exatamente a matriz da spec', () => {
    expect([1, 2, 3, 4].map((b) => minimoEscrita(1, b))).toEqual([0, 1, 1, 2]);
    expect([1, 2, 3, 4].map((b) => minimoEscrita(2, b))).toEqual([2, 2, 3, 3]);
    expect(minimoEscrita(5, 1)).toBe(3);
  });
});

describe('atenção automática e manual (RN08, RF-08/09)', () => {
  it('CR-08 / CA-08.4: 1 lacuna e escrita alfabética no 3º bimestre do 2º ano → sem sinal', () => {
    expect(avaliarAtencao({ ...base, lacunasPendentes: 1, escrita: ALFABETICO })).toMatchObject({ estado: 'SEM_SINAL', motivos: [] });
  });
  it('CR-09: mesmo caso com limite 1 (só no teste) → atenção', () => {
    expect(avaliarAtencao({ ...base, lacunasPendentes: 1, escrita: ALFABETICO, limite: 1 }).motivos).toEqual(['LACUNAS']);
  });
  it('CR-10 / CR-15 / CA-08.2: Silábico-alfabético no 3º bimestre do 2º ano → atenção por escrita', () => {
    expect(avaliarAtencao({ ...base, lacunasPendentes: 0, escrita: SILABICO_ALFABETICO })).toMatchObject({ estado: 'EM_ATENCAO', motivos: ['ESCRITA'] });
  });
  it('CR-14 / CA-08.1: 2 lacunas com escrita adequada → atenção por lacunas', () => {
    expect(avaliarAtencao({ ...base, lacunasPendentes: 2, escrita: ALFABETICO }).motivos).toEqual(['LACUNAS']);
  });
  it('CA-08.5: escrita igual ao mínimo não sinaliza', () => {
    expect(avaliarAtencao({ ...base, bimestre: 1, lacunasPendentes: 0, escrita: SILABICO_ALFABETICO }).estado).toBe('SEM_SINAL');
  });
  it('CR-17 / CA-08.3: dois motivos automáticos e um manual → três motivos, um estado', () => {
    const r = avaliarAtencao({ ...base, lacunasPendentes: 3, escrita: 1, manuaisAtivas: 1 });
    expect(r).toMatchObject({ estado: 'EM_ATENCAO', motivos: ['LACUNAS', 'ESCRITA', 'MANUAL'] });
  });
  it('CR-16 / CA-08.7: sem escrita e sem outro motivo → comparação incompleta (não "sem atenção")', () => {
    expect(avaliarAtencao({ ...base, lacunasPendentes: 0, escrita: null })).toMatchObject({ estado: 'INCOMPLETA', escritaAusente: true });
  });
  it('2 lacunas e escrita ausente → em atenção por lacunas, com a ausência registrada', () => {
    expect(avaliarAtencao({ ...base, lacunasPendentes: 2, escrita: null })).toMatchObject({ estado: 'EM_ATENCAO', motivos: ['LACUNAS'], escritaAusente: true });
  });
  it('CA-09.1 / CA-09.5: manual ativa sinaliza sem critério automático', () => {
    expect(avaliarAtencao({ ...base, lacunasPendentes: 0, escrita: ALFABETICO, manuaisAtivas: 1 }).motivos).toEqual(['MANUAL']);
  });
  it('CA-09.2: texto de atenção precisa de 1 a 2.000 caracteres não vazios', () => {
    expect(textoAtencaoValido('   ')).toBe(false);
    expect(textoAtencaoValido('a'.repeat(2000))).toBe(true);
    expect(textoAtencaoValido('a'.repeat(2001))).toBe(false);
  });
});
