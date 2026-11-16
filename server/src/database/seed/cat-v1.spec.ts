import { CAT_V1, idsDaEtapa } from './cat-v1';
import { CAT_DEMO_5 } from './catalogo-demo.fixture';

describe('CAT-v1 (CA-02.1, CR-22)', () => {
  it('tem 40 IDs únicos', () => {
    expect(CAT_V1).toHaveLength(40);
    expect(new Set(CAT_V1.map((h) => h.id)).size).toBe(40);
  });

  it('tem oito habilidades por etapa: quatro de LP e quatro de MAT', () => {
    for (const etapa of [1, 2, 3, 4, 5]) {
      const da = CAT_V1.filter((h) => h.etapa === etapa);
      expect(da).toHaveLength(8);
      expect(da.filter((h) => h.area === 'LP')).toHaveLength(4);
      expect(da.filter((h) => h.area === 'MAT')).toHaveLength(4);
    }
  });

  it('o 2º ano oferece H02-LP01..LP04 e H02-MAT01..MAT04, com as descrições da fonte', () => {
    expect(idsDaEtapa(2)).toEqual([
      'H02-LP01', 'H02-LP02', 'H02-LP03', 'H02-LP04', 'H02-MAT01', 'H02-MAT02', 'H02-MAT03', 'H02-MAT04',
    ]);
    expect(CAT_V1.find((h) => h.id === 'H02-LP01')?.texto).toBe('Lê frases e pequenos textos com compreensão');
  });

  it('a fixture de cinco itens é separada: IDs próprios e denominadores distintos (CR-24)', () => {
    const idsV1 = new Set(CAT_V1.map((h) => h.id));
    expect(CAT_DEMO_5.some((h) => idsV1.has(h.id))).toBe(false);
    expect(8 * CAT_DEMO_5.length).toBe(40); // captura: 8 crianças × 5 habilidades
    expect(8 * idsDaEtapa(2).length).toBe(64); // turma CAT-v1: 8 crianças × 8 habilidades
  });
});
