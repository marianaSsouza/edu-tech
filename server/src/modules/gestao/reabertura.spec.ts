import { nextSeq } from '../../common/sequence';
import { Enrollment, PedagogicalContext, Period, SchoolClass, SkillResponse, YearClosure } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { CalendarioService } from '../calendario/calendario.service';
import { FichaService } from '../historico/ficha.service';
import { LacunasService } from '../historico/lacunas.service';
import { PainelService } from '../paineis/painel.service';
import { GestaoService } from './gestao.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/**
 * Tarefa 7.4 — spec calendario-letivo, cenário "Reabertura após passagem de ano" (RF-13, RN07, D06):
 * reabrir 2026 depois da passagem para 2027 não desfaz a matrícula de 2027, não tira a herança de 2026,
 * não deixa uma correção antiga superar a consolidação posterior e não muda as datas de referência passadas.
 * Data de teste: 10/03/2027 (1º bimestre de 2027 aberto).
 */
describe('reabertura do ano depois da passagem de ano', () => {
  let b: Base;
  let g: GestaoService;
  let cal: CalendarioService;
  let ficha: FichaService;
  let lacunas: LacunasService;
  let painel: PainelService;
  let bernardo: number;
  let t3A27: SchoolClass;
  let t2A26: SchoolClass;

  beforeEach(async () => {
    b = await criarBaseTeste('2027-03-10');
    const policy = new PolicyService(b.ds, b.relogio);
    g = new GestaoService(b.ds, policy, b.relogio);
    cal = new CalendarioService(b.ds, policy, b.relogio);
    ficha = new FichaService(b.ds, policy, b.relogio);
    lacunas = new LacunasService(b.ds, policy, b.relogio);
    painel = new PainelService(b.ds, policy, b.relogio);
    bernardo = (await b.aluno('Bernardo')).id;
    t2A26 = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });

    // calendário de 2027 e encerramento de 2026 (fluxo real da coordenação)
    await b.ds.getRepository(Period).insert([
      { anoLetivo: 2027, bimestre: 1, inicio: '2027-02-08', fim: '2027-04-23', estado: 'ABERTO' },
      { anoLetivo: 2027, bimestre: 2, inicio: '2027-04-26', fim: '2027-07-02', estado: 'ABERTO' },
      { anoLetivo: 2027, bimestre: 3, inicio: '2027-07-19', fim: '2027-09-24', estado: 'ABERTO' },
      { anoLetivo: 2027, bimestre: 4, inicio: '2027-09-27', fim: '2027-12-17', estado: 'ABERTO' },
    ]);
    for (const bim of [3, 4]) await cal.fecharBimestre(b.coord, 2026, bim, 'Fim do ano letivo.');
    await cal.fecharAno(b.coord, 2026, 'Todos os bimestres fechados.');

    // passagem do Bernardo para o 3º A de 2027, com professora vinculada
    const t = await g.criarTurma(b.coord, { nome: '3º A', etapa: 3, anoLetivo: 2027 });
    t3A27 = await b.ds.getRepository(SchoolClass).findOneByOrFail({ id: t.id });
    await g.criarVinculo(b.coord, { classId: t3A27.id, userId: b.carlos.id, tipo: 'TITULAR', de: '2027-02-01' });
    await g.passagemAno(b.coord, bernardo, { turmaId: t3A27.id });
  });
  afterEach(() => b.ds.destroy());

  const lacunasHoje = async () => (await ficha.ficha(b.coord, bernardo)).lacunas;

  it('a matrícula de 2027 permanece e 2026 continua elegível para herança', async () => {
    const antes = await lacunasHoje();
    expect(antes.itens.some((i) => i.origem.anoLetivo === 2026)).toBe(true); // herda o 2º ano

    await cal.reabrirAno(b.coord, 2026, 'Correção de registro do 4º bimestre.');
    await cal.reabrirBimestre(b.coord, 2026, 4, 'Correção de registro do 4º bimestre.');

    const ctx27 = await b.ds.getRepository(PedagogicalContext).findOneByOrFail({ studentId: bernardo, anoLetivo: 2027 });
    expect(await b.ds.getRepository(Enrollment).findOneByOrFail({ contextId: ctx27.id })).toMatchObject({ classId: t3A27.id, de: '2027-02-08', ate: null });
    expect(await b.ds.getRepository(YearClosure).existsBy({ anoLetivo: 2026 })).toBe(true); // "já foi encerrado" não se perde
    const depois = await lacunasHoje();
    expect(depois.decomposicao).toEqual(antes.decomposicao);
    expect(depois.itens.map((i) => i.skillId)).toEqual(antes.itens.map((i) => i.skillId));
  });

  it('uma correção antiga, feita depois da reabertura, não supera a consolidação de 2027', async () => {
    await lacunas.registrar(b.carlos, bernardo, 'H02-LP01', { tipo: 'CONSOLIDACAO', justificativa: 'Lê frases com compreensão em 2027.' });
    expect((await lacunasHoje()).itens.find((i) => i.skillId === 'H02-LP01')).toMatchObject({ situacao: 'CONSOLIDADA', pendente: false });

    await cal.reabrirAno(b.coord, 2026, 'Correção de registro do 4º bimestre.');
    await cal.reabrirBimestre(b.coord, 2026, 4, 'Correção de registro do 4º bimestre.');
    // correção no 4º bimestre de 2026, registrada DEPOIS (seq maior) da consolidação de 2027
    const ctx26 = await b.ds.getRepository(PedagogicalContext).findOneByOrFail({ studentId: bernardo, anoLetivo: 2026 });
    await b.ds.transaction(async (m) => m.insert(SkillResponse, {
      contextId: ctx26.id, skillId: 'H02-LP01', catalogVersion: ctx26.catalogVersion, bimestre: 4, nivel: 0, autorId: b.beatriz.id, seq: await nextSeq(m),
    }));

    // a ordem é a do período (2026/4º < 2027/1º), não a da gravação: a consolidação continua valendo
    expect((await lacunasHoje()).itens.find((i) => i.skillId === 'H02-LP01')).toMatchObject({ situacao: 'CONSOLIDADA', pendente: false });
  });

  it('datas de referência passadas não mudam: o 4º bimestre de 2026 ainda conta o Bernardo no 2º A', async () => {
    const antes = await painel.turma(b.coord, t2A26.id, 4);
    await cal.reabrirAno(b.coord, 2026, 'Conferência.');
    const depois = await painel.turma(b.coord, t2A26.id, 4);
    expect(antes.referencia).toMatchObject({ anoLetivo: 2026, bimestre: 4, data: '2026-12-18' });
    expect(depois.N).toBe(antes.N);
    expect(depois.alunos.some((a) => a.id === bernardo)).toBe(true);
    const novo = await painel.turma(b.coord, t3A27.id, 1);
    expect(novo.alunos.map((a) => a.id)).toEqual([bernardo]);
  });
});
