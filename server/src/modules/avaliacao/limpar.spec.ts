import { ResponseRevision, SchoolClass, SkillResponse } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { FichaService } from '../historico/ficha.service';
import { PainelService } from '../paineis/painel.service';
import { AvaliacaoService } from './avaliacao.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/** Tarefa 3.4 — limpeza justificada de resposta (RF-13, RNF-01/03; cenário "Limpeza de resposta"). */
describe('limpar resposta — integração', () => {
  let b: Base;
  let av: AvaliacaoService;
  let ficha: FichaService;
  let painel: PainelService;
  let ctxId: number;
  let alunoId: number;

  beforeEach(async () => {
    b = await criarBaseTeste();
    const policy = new PolicyService(b.ds, b.relogio);
    av = new AvaliacaoService(b.ds, policy, b.relogio);
    ficha = new FichaService(b.ds, policy, b.relogio);
    painel = new PainelService(b.ds, policy, b.relogio);
    const ctx = await b.contexto('Ana Clara', 2026);
    ctxId = ctx.id;
    alunoId = ctx.studentId;
  });
  afterEach(() => b.ds.destroy());

  it('a autora limpa com justificativa: vigente fica Sem avaliação e a versão anterior continua consultável', async () => {
    await av.salvarHabilidade(b.beatriz, ctxId, 'H02-LP01', { bimestre: 4, nivel: 0 });
    await av.limpar(b.beatriz, ctxId, { tipo: 'HABILIDADE', skillId: 'H02-LP01' }, { bimestre: 4, version: 1, justificativa: 'Marquei o aluno errado.' });

    const r = await av.ler(b.beatriz, alunoId, 2026, 4);
    expect(r.habilidades.find((h) => h.id === 'H02-LP01')!.resposta).toBeNull();
    expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctxId, skillId: 'H02-LP01', bimestre: 4 })).toBe(0);
    const rev = await b.ds.getRepository(ResponseRevision).findOneByOrFail({ contextId: ctxId, skillId: 'H02-LP01', bimestre: 4 });
    expect(rev).toMatchObject({ nivelAnterior: 0, nivelNovo: null, justificativa: 'Marquei o aluno errado.', autorId: b.beatriz.id });

    // a ficha mostra a célula limpa com a revisão; não vira regressão nem "Não consolidada"
    const f = await ficha.ficha(b.coord, alunoId);
    const cel = f.linhaDoTempo[1].habilidades.find((h) => h.id === 'H02-LP01')!.porBimestre[3]!;
    expect(cel).toMatchObject({ nivel: null, revisoes: [expect.objectContaining({ nivelAnterior: 0, nivelNovo: null })] });

    // o campo volta a ficar livre: pode ser preenchido de novo, sem versão
    await expect(av.salvarHabilidade(b.beatriz, ctxId, 'H02-LP01', { bimestre: 4, nivel: 2 })).resolves.toBeDefined();
  });

  it('escrita também pode ser limpa; o painel passa a contar a escrita como ausente', async () => {
    await av.salvarEscrita(b.beatriz, ctxId, { bimestre: 4, nivel: 3 });
    await av.limpar(b.beatriz, ctxId, { tipo: 'ESCRITA' }, { bimestre: 4, version: 1, justificativa: 'Sondagem ainda não aplicada.' });
    const turma = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
    const p = await painel.turma(b.beatriz, turma.id, 4);
    expect(p.alunos.find((a) => a.nome === 'Ana Clara')!.escrita).toBeNull();
    expect(p.indicadores!.coberturaEscrita.n).toBe(0);
  });

  it('regras: sem justificativa 422; outra autora 403 AUTORIA; versão antiga 409; coordenação 403; bimestre fechado 422', async () => {
    await av.salvarHabilidade(b.beatriz, ctxId, 'H02-LP02', { bimestre: 4, nivel: 1 });
    const alvo = { tipo: 'HABILIDADE' as const, skillId: 'H02-LP02' };
    await expect(av.limpar(b.beatriz, ctxId, alvo, { bimestre: 4, version: 1 })).rejects.toMatchObject({ status: 422, codigo: 'JUSTIFICATIVA_OBRIGATORIA' });
    await expect(av.limpar(b.debora, ctxId, alvo, { bimestre: 4, version: 1, justificativa: 'x' })).rejects.toMatchObject({ status: 403, codigo: 'AUTORIA' });
    await expect(av.limpar(b.beatriz, ctxId, alvo, { bimestre: 4, version: 2, justificativa: 'x' })).rejects.toMatchObject({ status: 409 });
    await expect(av.limpar(b.coord, ctxId, alvo, { bimestre: 4, version: 1, justificativa: 'x' })).rejects.toMatchObject({ status: 403 });
    await expect(av.limpar(b.beatriz, ctxId, { tipo: 'HABILIDADE', skillId: 'H02-LP01' }, { bimestre: 2, version: 1, justificativa: 'x' }))
      .rejects.toMatchObject({ status: 422, codigo: 'PERIODO_FECHADO' });
    expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctxId, skillId: 'H02-LP02', bimestre: 4 })).toBe(1);
  });
});
