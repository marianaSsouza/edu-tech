import { calcularLacunas, Marcacao, resumoAnual, ultimaMarcacao, ultimaObservacao } from './lacunas';

let seq = 0;
const m = (skillId: string, anoLetivo: number, bimestre: number, nivel: number, tipo: Marcacao['tipo'] = 'AVALIACAO', s?: number): Marcacao =>
  ({ skillId, contextId: anoLetivo === 2025 ? 1 : 2, anoLetivo, bimestre, nivel, tipo, autorId: 1, seq: s ?? ++seq });

const ctx2025 = { contextId: 1, anoLetivo: 2025, etapa: 1, skillIds: ['H01-LP01', 'H01-LP02', 'H01-MAT01'] };
const ref = { anoLetivo: 2026, bimestre: 4 };

describe('lacunas herdadas (RN07, RF-06/07)', () => {
  it('CR-05: consolidada no 2º bimestre e Não consolidada no 4º gera lacuna', () => {
    const r = calcularLacunas({ contextosElegiveis: [ctx2025], marcacoes: [m('H01-LP01', 2025, 2, 2), m('H01-LP01', 2025, 4, 0)], referencia: ref });
    expect(r.itens.find((i) => i.skillId === 'H01-LP01')).toMatchObject({ situacao: 'NAO_CONSOLIDADA', pendente: true });
  });

  it('CR-07: nunca avaliada vira "Sem avaliação registrada", conta e não recebe nível', () => {
    const r = calcularLacunas({ contextosElegiveis: [ctx2025], marcacoes: [m('H01-LP01', 2025, 4, 2), m('H01-LP02', 2025, 4, 2)], referencia: ref });
    expect(r.itens.find((i) => i.skillId === 'H01-MAT01')).toMatchObject({ situacao: 'SEM_AVALIACAO', ultima: null });
    expect(r.decomposicao).toEqual({ total: 1, naoConsolidada: 0, emDesenvolvimento: 0, semAvaliacao: 1 });
  });

  it('ausência depois de uma marcação não apaga a marcação (Em desenvolvimento no 2º, nada depois)', () => {
    const r = calcularLacunas({ contextosElegiveis: [ctx2025], marcacoes: [m('H01-LP02', 2025, 2, 1)], referencia: ref });
    expect(r.itens.find((i) => i.skillId === 'H01-LP02')?.situacao).toBe('EM_DESENVOLVIMENTO');
  });

  it('CR-06 / CA-07.2: consolidação em 2026 tira da contagem; a avaliação de 2025 continua lá', () => {
    const marcacoes = [m('H01-LP01', 2025, 4, 1), m('H01-LP02', 2025, 4, 0), m('H01-MAT01', 2025, 4, 2)];
    expect(calcularLacunas({ contextosElegiveis: [ctx2025], marcacoes, referencia: ref }).decomposicao.total).toBe(2);
    const depois = [...marcacoes, m('H01-LP01', 2026, 3, 2, 'CONSOLIDACAO')];
    const r = calcularLacunas({ contextosElegiveis: [ctx2025], marcacoes: depois, referencia: ref });
    expect(r.decomposicao.total).toBe(1);
    expect(resumoAnual(ctx2025.skillIds, depois.filter((x) => x.anoLetivo === 2025)).get('H01-LP01')?.nivel).toBe(1);
  });

  it('reavaliação posterior não consolidada reabre a pendência; no mesmo bimestre vale a registrada depois', () => {
    const r = calcularLacunas({
      contextosElegiveis: [ctx2025],
      marcacoes: [m('H01-LP01', 2025, 4, 1), m('H01-LP01', 2026, 3, 2, 'CONSOLIDACAO', 100), m('H01-LP01', 2026, 3, 1, 'REAVALIACAO', 101)],
      referencia: ref,
    });
    expect(r.itens.find((i) => i.skillId === 'H01-LP01')).toMatchObject({ situacao: 'EM_DESENVOLVIMENTO', ultima: { tipo: 'REAVALIACAO' } });
  });

  it('CR-23: consulta com referência anterior à consolidação mantém a pendência', () => {
    const marcacoes = [m('H01-LP01', 2025, 4, 1), m('H01-LP01', 2026, 3, 2, 'CONSOLIDACAO')];
    const antes = calcularLacunas({ contextosElegiveis: [ctx2025], marcacoes, referencia: { anoLetivo: 2026, bimestre: 2 } });
    expect(antes.itens.find((i) => i.skillId === 'H01-LP01')?.pendente).toBe(true);
  });

  it('correção de avaliação antiga (seq original) não supera consolidação posterior (D05)', () => {
    const antiga = m('H01-LP01', 2025, 4, 0, 'AVALIACAO', 5); // corrigida hoje, mas mantém seq 5 e período 2025/4
    const consolidacao = m('H01-LP01', 2026, 3, 2, 'CONSOLIDACAO', 50);
    expect(ultimaMarcacao([consolidacao, antiga], 'H01-LP01')?.tipo).toBe('CONSOLIDACAO');
  });

  it('CA-06.3: mesma habilidade em repetência conta uma vez, com a marcação mais recente', () => {
    const repetencia = { contextId: 2, anoLetivo: 2026, etapa: 1, skillIds: ['H01-LP01'] };
    const r = calcularLacunas({
      contextosElegiveis: [ctx2025, repetencia],
      marcacoes: [m('H01-LP01', 2025, 4, 0), m('H01-LP01', 2026, 4, 1)],
      referencia: { anoLetivo: 2027, bimestre: 1 },
    });
    expect(r.itens.filter((i) => i.skillId === 'H01-LP01')).toHaveLength(1);
    expect(r.itens.find((i) => i.skillId === 'H01-LP01')).toMatchObject({ situacao: 'EM_DESENVOLVIMENTO', origem: { anoLetivo: 2026 } });
  });

  it('1º ano sem contexto anterior: nenhuma lacuna fabricada', () => {
    expect(calcularLacunas({ contextosElegiveis: [], marcacoes: [], referencia: ref }).decomposicao.total).toBe(0);
  });
});

describe('resumo anual e observações (RF-05, seção 6)', () => {
  it('4º bimestre sem resposta não apaga a consolidação do 2º', () => {
    const r = resumoAnual(['H01-LP01'], [m('H01-LP01', 2025, 2, 2)]);
    expect(r.get('H01-LP01')).toMatchObject({ nivel: 2, bimestre: 2 });
  });
  it('última observação não vazia', () => {
    const o = ultimaObservacao([
      { bimestre: 1, texto: 'primeira', ordem: 1 }, { bimestre: 3, texto: 'terceira', ordem: 2 }, { bimestre: 4, texto: '  ', ordem: 3 },
    ]);
    expect(o?.texto).toBe('terceira');
  });
});
