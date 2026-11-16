import { IsNull } from 'typeorm';
import { Enrollment, SchoolClass } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { PainelService } from './painel.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/** Integração do painel (tarefas 6.1–6.3). Hoje = 2026-11-16 (4º bimestre em andamento). */
describe('painel — integração', () => {
  let b: Base;
  let painel: PainelService;
  let turmaA: SchoolClass;
  let turmaB: SchoolClass;

  beforeEach(async () => {
    b = await criarBaseTeste();
    painel = new PainelService(b.ds, new PolicyService(b.ds, b.relogio), b.relogio);
    turmaA = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
    turmaB = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º B', anoLetivo: 2026 });
  });
  afterEach(() => b.ds.destroy());

  /** Move o aluno para outra turma a partir de uma data (fecha a matrícula anterior). */
  const transferir = async (nome: string, destino: SchoolClass, de: string) => {
    const ctx = await b.contexto(nome, 2026);
    await b.ds.getRepository(Enrollment).update({ contextId: ctx.id, ate: IsNull() }, { ate: '2026-09-30' });
    await b.ds.getRepository(Enrollment).insert({ contextId: ctx.id, classId: destino.id, de, ate: null });
  };

  it('CA-11.3 / CR-18: coordenação vê 2º A com agregados e 2º B (4 crianças) com "agregado oculto"', async () => {
    const g = await painel.visaoGeral(b.coord);
    expect(g.referencia).toMatchObject({ anoLetivo: 2026, bimestre: 4, data: '2026-11-16' });
    const [a, bb] = g.turmas;
    expect(a).toMatchObject({ turma: { nome: '2º A' }, N: 8, oculto: false });
    expect(a.indicadores).not.toBeNull();
    expect(bb).toMatchObject({ turma: { nome: '2º B' }, N: 4, oculto: true, indicadores: null });
  });

  it('ocultação vale para os dois perfis; a lista individual continua disponível', async () => {
    const p = await painel.turma(b.carlos, turmaB.id);
    expect(p).toMatchObject({ N: 4, oculto: true, indicadores: null });
    expect(p.alunos.map((x) => x.nome)).toEqual(['Isadora', 'João', 'Lara', 'Mateus']);
  });

  it('2º A no 3º bimestre: cobertura 64/64, escrita alfabética 6/8 = 75,0%, 4 crianças em atenção (CA-10.2/10.4)', async () => {
    const p = await painel.turma(b.beatriz, turmaA.id, 3);
    const i = p.indicadores!;
    expect(i.pares.T).toBe(64);
    expect(i.coberturaHabilidades).toEqual({ n: 64, d: 64, percentual: '100,0%' });
    expect(i.escritaAlfabetica).toEqual({ n: 6, d: 8, percentual: '75,0%' });
    expect(i.emAtencao).toEqual({ n: 4, d: 8, percentual: '50,0%' });
    expect(p.alunos.map((x) => x.nome)).toEqual(['Ana Clara', 'Bernardo', 'Cecília', 'Davi', 'Elisa', 'Felipe', 'Giovana', 'Heitor']);
    expect(p.alunos.find((x) => x.nome === 'Bernardo')!.atencao.motivos).toEqual(['LACUNAS', 'ESCRITA']);
  });

  it('4º bimestre sem registros: 0,0% com aviso, cobertura de escrita 0/8, todos sem escrita (CR-13, CR-16)', async () => {
    const i = (await painel.turma(b.beatriz, turmaA.id, 4)).indicadores!;
    expect(i.semAvaliacoes).toBe(true);
    expect(i.consolidacao.percentual).toBe('0,0%');
    expect(i.coberturaEscrita).toEqual({ n: 0, d: 8, percentual: '0,0%' });
    expect(i.pares.NC).toBe(0);
    expect(i.emAtencao.n + i.atencaoIncompleta).toBe(8);
  });

  it('CA-10.3: transferido conta uma vez, na turma da data de referência; com 5 crianças os agregados aparecem', async () => {
    await transferir('Ana Clara', turmaB, '2026-10-01');
    const atual = await painel.visaoGeral(b.coord, 2026, 4);
    expect(atual.turmas.map((t) => [t.turma.nome, t.N, t.oculto])).toEqual([['2º A', 7, false], ['2º B', 5, false]]);
    const antes = await painel.visaoGeral(b.coord, 2026, 3); // referência = último dia do 3º bimestre (2026-09-25)
    expect(antes.turmas.map((t) => [t.turma.nome, t.N])).toEqual([['2º A', 8], ['2º B', 4]]);
  });

  it('acesso: Carlos não abre o painel do 2º A; Ana Paula não tem turmas hoje', async () => {
    await expect(painel.turma(b.carlos, turmaA.id)).rejects.toMatchObject({ status: 403 });
    expect((await painel.visaoGeral(b.anaPaula)).turmas).toEqual([]);
  });

  it('turma de 2025 (encerrada) usa o último dia do bimestre como referência', async () => {
    const t25 = await b.ds.getRepository(SchoolClass).findOneByOrFail({ anoLetivo: 2025 });
    const p = await painel.turma(b.coord, t25.id, 4);
    expect(p.referencia).toMatchObject({ data: '2025-12-19', situacao: 'ENCERRADO' });
    expect(p.N).toBe(12);
  });
});
