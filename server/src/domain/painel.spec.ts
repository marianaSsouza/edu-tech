import { agregadosVisiveis, agregar, AlunoPainel, evolucaoEscrita, fracao } from './painel';

const aluno = (respostas: Record<string, number>, extra: Partial<AlunoPainel> = {}): AlunoPainel => ({
  skillIds: ['A', 'B', 'C', 'D'], respostas, escrita: 3, atencao: 'SEM_SINAL', lacunas: [], ...extra,
});

describe('indicadores do painel (RN12, seção 7)', () => {
  it('ausência entra no denominador: C, D, ausente, NC → consolidação 1/4 = 25,0% e cobertura 3/4 = 75,0% (CA-10.4)', () => {
    const r = agregar([aluno({ A: 2, B: 1, D: 0 })]);
    expect(r.pares).toEqual({ T: 4, C: 1, D: 1, NC: 1, U: 1 });
    expect(r.consolidacao).toEqual({ n: 1, d: 4, percentual: '25,0%' });
    expect(r.coberturaHabilidades).toEqual({ n: 3, d: 4, percentual: '75,0%' });
  });

  it('CR-01: [2,2,1,0] → 2/4 = 50,0%', () => {
    expect(agregar([aluno({ A: 2, B: 2, C: 1, D: 0 })]).consolidacao.percentual).toBe('50,0%');
  });

  it('CR-02 / CR-12: 7/12 = 58,3% e 1/16 = 6,3%', () => {
    expect(fracao(7, 12).percentual).toBe('58,3%');
    expect(fracao(1, 16).percentual).toBe('6,3%');
  });

  it('CR-13: denominador zero é "Sem dados" (0/0); tudo ausente dá 0,0% com aviso', () => {
    expect(fracao(0, 0)).toEqual({ n: 0, d: 0, percentual: null });
    const r = agregar([aluno({}), aluno({}), aluno({}), aluno({}), aluno({})]);
    expect(r.consolidacao.percentual).toBe('0,0%');
    expect(r.coberturaHabilidades.percentual).toBe('0,0%');
    expect(r.semAvaliacoes).toBe(true);
    expect(r.pares.NC).toBe(0); // ninguém vira "Não consolidada"
  });

  it('atenção: aluno com vários motivos conta uma vez; incompleta conta à parte (CR-17, CR-16)', () => {
    const r = agregar([aluno({}, { atencao: 'EM_ATENCAO' }), aluno({}, { atencao: 'INCOMPLETA', escrita: null }), aluno({})]);
    expect(r.emAtencao).toEqual({ n: 1, d: 3, percentual: '33,3%' });
    expect(r.atencaoIncompleta).toBe(1);
    expect(r.coberturaEscrita).toMatchObject({ n: 2, d: 3 });
    expect(r.escritaAusente).toBe(1);
  });

  it('lacunas por habilidade: duas crianças, uma por ausência (spec "Pendências de naturezas diferentes")', () => {
    const r = agregar([
      aluno({}, { lacunas: [{ skillId: 'H01-LP01', situacao: 'SEM_AVALIACAO' }] }),
      aluno({}, { lacunas: [{ skillId: 'H01-LP01', situacao: 'EM_DESENVOLVIMENTO' }, { skillId: 'H01-LP02', situacao: 'CONSOLIDADA' }] }),
    ]);
    expect(r.lacunasPorHabilidade).toEqual([{ skillId: 'H01-LP01', criancas: 2, porAusencia: 1, fracao: { n: 2, d: 2, percentual: '100,0%' } }]);
  });

  it('catálogo não uniforme: T é a soma dos pares previstos', () => {
    const r = agregar([aluno({}), aluno({}, { skillIds: ['A', 'B'] })]);
    expect(r.pares.T).toBe(6);
  });

  it('CR-18: grupo de 4 oculta agregados; de 5 mostra', () => {
    expect(agregadosVisiveis(4)).toBe(false);
    expect(agregadosVisiveis(5)).toBe(true);
  });
});

describe('evolução da escrita (seção 7)', () => {
  it('CR-11: duas crianças com dados nos dois períodos; uma avança → 1 de 2', () => {
    expect(evolucaoEscrita([{ a: 1, b: 2 }, { a: 2, b: 2 }])).toMatchObject({ E: 1, V: 2, semComparacao: 0 });
  });
  it('CR-20: uma de três sem escrita em A; uma das duas comparáveis avança → 1 de 2, 1 sem comparação', () => {
    expect(evolucaoEscrita([{ a: null, b: 3 }, { a: 1, b: 3 }, { a: 2, b: 1 }])).toMatchObject({ E: 1, V: 2, semComparacao: 1, N: 3 });
  });
  it('igualdade ou regressão entram em V, mas não em E', () => {
    expect(evolucaoEscrita([{ a: 2, b: 2 }, { a: 3, b: 1 }])).toMatchObject({ E: 0, V: 2 });
  });
});
