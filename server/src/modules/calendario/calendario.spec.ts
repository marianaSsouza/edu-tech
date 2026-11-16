import { SchoolClass, YearClosure } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { AvaliacaoService } from '../avaliacao/avaliacao.service';
import { FichaService } from '../historico/ficha.service';
import { PainelService } from '../paineis/painel.service';
import { CalendarioService } from './calendario.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/** Tarefa 7.3 — calendário: fechamento e reabertura (RF-13, CA-13.2/13.3, D06). */
describe('calendário — integração', () => {
  let b: Base;
  let cal: CalendarioService;
  let av: AvaliacaoService;
  let ficha: FichaService;
  let painel: PainelService;

  beforeEach(async () => {
    b = await criarBaseTeste();
    const policy = new PolicyService(b.ds, b.relogio);
    cal = new CalendarioService(b.ds, policy, b.relogio);
    av = new AvaliacaoService(b.ds, policy, b.relogio);
    ficha = new FichaService(b.ds, policy, b.relogio);
    painel = new PainelService(b.ds, policy, b.relogio);
  });
  afterEach(() => b.ds.destroy());

  it('só a coordenação gerencia o calendário (403 para professora)', async () => {
    await expect(cal.visao(b.beatriz)).rejects.toMatchObject({ status: 403 });
    await expect(cal.fecharBimestre(b.beatriz, 2026, 4, 'x')).rejects.toMatchObject({ status: 403 });
  });

  it('CA-13.2 "Fechar bimestre incompleto": mostra ausências, fecha com justificativa, bloqueia escrita e não fabrica avaliações', async () => {
    const aus = await cal.ausencias(b.coord, 2026, 4);
    expect(aus.turmas.map((t) => [t.turma.nome, t.alunos, t.paresSemAvaliacao, t.alunosSemEscrita])).toEqual([['2º A', 8, 64, 8], ['2º B', 4, 32, 4]]);

    await expect(cal.fecharBimestre(b.coord, 2026, 4, '  ')).rejects.toMatchObject({ status: 422 });
    await cal.fecharBimestre(b.coord, 2026, 4, 'Encerramento do 4º bimestre conforme calendário.');
    const ctx = await b.contexto('Ana Clara', 2026);
    await expect(av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP01', { bimestre: 4, nivel: 2 })).rejects.toMatchObject({ status: 422, codigo: 'PERIODO_FECHADO' });
    expect((await cal.ausencias(b.coord, 2026, 4)).turmas[0].paresSemAvaliacao).toBe(64); // ausências continuam ausências
    await expect(cal.fecharBimestre(b.coord, 2026, 4, 'de novo')).rejects.toMatchObject({ status: 422, codigo: 'JA_FECHADO' });

    const v = await cal.visao(b.coord);
    expect(v.anos[0].trilha[0]).toMatchObject({ tipo: 'FECHAR_BIMESTRE', bimestre: 4, autorNome: 'Coordenação Pedagógica' });
  });

  it('CA-13.3 "Ano com período aberto": não fecha o ano com bimestre aberto; com os quatro fechados, fecha', async () => {
    await expect(cal.fecharAno(b.coord, 2026, 'Fim do ano.')).rejects.toMatchObject({ status: 422, codigo: 'BIMESTRE_ABERTO' });
    await cal.fecharBimestre(b.coord, 2026, 3, 'Fim do 3º.');
    await cal.fecharBimestre(b.coord, 2026, 4, 'Fim do 4º.');
    await cal.fecharAno(b.coord, 2026, 'Fim do ano.');
    expect(await b.ds.getRepository(YearClosure).existsBy({ anoLetivo: 2026 })).toBe(true);
    expect((await cal.visao(b.coord)).anos[0].anoFechado).toBe(true);
  });

  it('"Reabertura após passagem de ano": exige reabrir o ano; a herança e a matrícula de 2026 continuam', async () => {
    await expect(cal.reabrirBimestre(b.coord, 2025, 4, 'Correção de lançamento.')).rejects.toMatchObject({ status: 422, codigo: 'ANO_FECHADO' });
    await cal.reabrirAno(b.coord, 2025, 'Correção autorizada de lançamentos de 2025.');
    await cal.reabrirBimestre(b.coord, 2025, 4, 'Correção de lançamento.');

    const bernardo = await b.aluno('Bernardo');
    const f = await ficha.ficha(b.beatriz, bernardo.id);
    expect(f.lacunas.decomposicao.total).toBe(6); // continua elegível para herança
    expect(f.linhaDoTempo.map((c) => c.contexto.anoLetivo)).toEqual([2025, 2026]); // matrícula de 2026 intacta

    // "Período passado reaberto": a população continua sendo a do último dia do bimestre
    const t25 = await b.ds.getRepository(SchoolClass).findOneByOrFail({ anoLetivo: 2025 });
    expect((await painel.turma(b.coord, t25.id, 4)).referencia.data).toBe('2025-12-19');
  });

  it('período futuro não pode ser fechado', async () => {
    const b2 = await criarBaseTeste('2026-09-01');
    try {
      const c2 = new CalendarioService(b2.ds, new PolicyService(b2.ds, b2.relogio), b2.relogio);
      await expect(c2.fecharBimestre(b2.coord, 2026, 4, 'cedo demais')).rejects.toMatchObject({ status: 422, codigo: 'PERIODO_FUTURO' });
    } finally {
      await b2.ds.destroy();
    }
  });

  it('correção antiga pela autora em bimestre reaberto: grava revisão e a ficha identifica o original (acesso e histórico)', async () => {
    const ctx = await b.contexto('Ana Clara', 2026);
    await expect(av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP01', { bimestre: 1, nivel: 2, version: 1, justificativa: 'x' }))
      .rejects.toMatchObject({ codigo: 'PERIODO_FECHADO' });
    await cal.reabrirBimestre(b.coord, 2026, 1, 'Correção de lançamento do 1º bimestre.');
    const r = await av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP01', { bimestre: 1, nivel: 2, version: 1, justificativa: 'Lançado no nível errado.' });
    expect(r.resposta).toMatchObject({ nivel: 2, version: 2 });
    await expect(av.salvarHabilidade(b.debora, ctx.id, 'H02-LP02', { bimestre: 1, nivel: 2, version: 1, justificativa: 'x' }))
      .rejects.toMatchObject({ status: 403, codigo: 'AUTORIA' }); // reabrir não dá autoria a outra professora
    const f = await ficha.ficha(b.coord, ctx.studentId);
    const cel = f.linhaDoTempo[1].habilidades.find((h) => h.id === 'H02-LP01')!.porBimestre[0]!;
    expect(cel.revisoes[0]).toMatchObject({ nivelAnterior: 1, nivelNovo: 2, justificativa: 'Lançado no nível errado.' });
  });
});
