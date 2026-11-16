import { Enrollment, Movimentacao, PedagogicalContext, SchoolClass, SkillResponse, Student, YearClosure } from '../../database/entities';
import { idsDaEtapa } from '../../database/seed/cat-v1';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { AvaliacaoService } from '../avaliacao/avaliacao.service';
import { FichaService } from '../historico/ficha.service';
import { PainelService } from '../paineis/painel.service';
import { GestaoService } from './gestao.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/**
 * Tarefa 7.2 — spec gestao-escolar (RF-12, CA-12.2, CA-12.3, RN10): matrícula única, transferências,
 * passagem de ano, repetência e mudança excepcional de etapa, sem copiar avaliações. Data de teste: 16/11/2026.
 */
describe('gestão escolar — movimentações do aluno', () => {
  let b: Base;
  let g: GestaoService;
  let av: AvaliacaoService;
  let ficha: FichaService;
  let painel: PainelService;
  let t2A: SchoolClass;
  let t2B: SchoolClass;

  beforeEach(async () => {
    b = await criarBaseTeste();
    const policy = new PolicyService(b.ds, b.relogio);
    g = new GestaoService(b.ds, policy, b.relogio);
    av = new AvaliacaoService(b.ds, policy, b.relogio);
    ficha = new FichaService(b.ds, policy, b.relogio);
    painel = new PainelService(b.ds, policy, b.relogio);
    t2A = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
    t2B = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º B', anoLetivo: 2026 });
  });
  afterEach(() => b.ds.destroy());

  /** Nunca duas matrículas vigentes ao mesmo tempo (matrícula única). */
  async function semSobreposicao(studentId: number) {
    const ms: Array<{ de: string; ate: string | null }> = await b.ds.query(
      `SELECT m.de, m.ate FROM matriculas m JOIN contextos_pedagogicos c ON c.id = m.contextId WHERE c.studentId = ? ORDER BY m.de`, [studentId]);
    for (let i = 1; i < ms.length; i++) expect(ms[i - 1].ate !== null && ms[i - 1].ate! < ms[i].de).toBe(true);
  }

  it('CA-12.4: professora não faz nenhuma movimentação (403)', async () => {
    const bernardo = await b.aluno('Bernardo');
    for (const t of [
      () => g.transferirTurma(b.beatriz, bernardo.id, { turmaId: t2B.id }),
      () => g.transferenciaExterna(b.beatriz, bernardo.id, { justificativa: 'x' }),
      () => g.passagemAno(b.beatriz, bernardo.id, { turmaId: t2B.id }),
      () => g.mudancaEtapa(b.beatriz, bernardo.id, { turmaId: t2B.id, justificativa: 'x' }),
    ]) await expect(t()).rejects.toMatchObject({ status: 403 });
  });

  it('cenário "Transferência durante o bimestre": mesmo registro bimestral, origem visível, uma contagem e autoria respeitada', async () => {
    const bernardo = await b.aluno('Bernardo');
    const ctx = await b.contexto('Bernardo', 2026);
    await av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP01', { bimestre: 4, nivel: 1 }); // registrado antes da troca

    await g.transferirTurma(b.coord, bernardo.id, { turmaId: t2B.id });
    await semSobreposicao(bernardo.id);

    // a nova matrícula referencia o MESMO contexto (nada copiado)
    const mats = await b.ds.getRepository(Enrollment).find({ where: { contextId: ctx.id }, order: { de: 'ASC' } });
    expect(mats.map((m) => [m.classId, m.de, m.ate])).toEqual([[t2A.id, '2026-02-02', '2026-11-15'], [t2B.id, '2026-11-16', null]]);
    expect(await b.ds.getRepository(PedagogicalContext).countBy({ studentId: bernardo.id, anoLetivo: 2026 })).toBe(1);

    // uma única contagem, na turma da data de referência
    const a = await painel.turma(b.coord, t2A.id, 4);
    const bb = await painel.turma(b.coord, t2B.id, 4);
    expect(a.alunos.some((x) => x.id === bernardo.id)).toBe(false);
    expect(bb.alunos.filter((x) => x.id === bernardo.id)).toHaveLength(1);
    expect([a.N, bb.N]).toEqual([7, 5]);

    // turma de origem visível na ficha
    const f = await ficha.ficha(b.coord, bernardo.id);
    expect(f.linhaDoTempo.find((c) => c.contexto.anoLetivo === 2026)!.turmas.map((t) => t.nome)).toEqual(['2º A', '2º B']);

    // a professora de destino preenche o que falta, sem substituir a resposta de outra autora
    await av.salvarHabilidade(b.carlos, ctx.id, 'H02-LP02', { bimestre: 4, nivel: 2 });
    await expect(av.salvarHabilidade(b.carlos, ctx.id, 'H02-LP01', { bimestre: 4, nivel: 2, version: 1 })).rejects.toMatchObject({ status: 403 });
    expect(await b.ds.getRepository(SkillResponse).findOneBy({ contextId: ctx.id, skillId: 'H02-LP01', bimestre: 4 })).toMatchObject({ autorId: b.beatriz.id, nivel: 1 });
    // e a professora de origem perde a escrita
    await expect(av.salvarHabilidade(b.beatriz, ctx.id, 'H02-MAT01', { bimestre: 4, nivel: 1 })).rejects.toMatchObject({ status: 403 });

    expect(await b.ds.getRepository(Movimentacao).findOneBy({ studentId: bernardo.id })).toMatchObject({ tipo: 'TRANSFERENCIA_INTERNA', deClassId: t2A.id, paraClassId: t2B.id, autorId: b.coord.id });
  });

  it('troca de turma recusa outro ano escolar, outro ano letivo e a mesma turma', async () => {
    const davi = await b.aluno('Davi');
    const t3 = await g.criarTurma(b.coord, { nome: '3º A', etapa: 3, anoLetivo: 2026 });
    await expect(g.transferirTurma(b.coord, davi.id, { turmaId: t3.id })).rejects.toMatchObject({ codigo: 'ETAPA_DIFERENTE' });
    await expect(g.transferirTurma(b.coord, davi.id, { turmaId: t2A.id })).rejects.toMatchObject({ codigo: 'MESMA_TURMA' });
    const t2027 = await g.criarTurma(b.coord, { nome: '2º C', etapa: 2, anoLetivo: 2027 });
    await expect(g.transferirTurma(b.coord, davi.id, { turmaId: t2027.id })).rejects.toMatchObject({ codigo: 'ANO_DIFERENTE' });
  });

  it('cenário "Saída da escola": encerra a matrícula no último dia informado, com motivo; histórico fica consultável pela coordenação', async () => {
    const ana = await b.aluno('Ana Clara');
    await expect(g.transferenciaExterna(b.coord, ana.id, { justificativa: '' })).rejects.toMatchObject({ status: 422 });
    await g.transferenciaExterna(b.coord, ana.id, { justificativa: 'Mudou de cidade; transferida para escola municipal.' });
    expect(await b.ds.getRepository(Student).findOneByOrFail({ id: ana.id })).toMatchObject({ ativo: false });
    const ctx = await b.contexto('Ana Clara', 2026);
    expect(await b.ds.getRepository(Enrollment).findOneByOrFail({ contextId: ctx.id })).toMatchObject({ ate: '2026-11-16' });
    expect((await ficha.ficha(b.coord, ana.id)).linhaDoTempo).toHaveLength(2); // 2025 e 2026 continuam
    expect(await b.ds.getRepository(Movimentacao).findOneBy({ studentId: ana.id })).toMatchObject({ tipo: 'TRANSFERENCIA_EXTERNA' });
    await expect(g.transferirTurma(b.coord, ana.id, { turmaId: t2B.id })).rejects.toMatchObject({ codigo: 'ALUNO_ARQUIVADO' });
  });

  describe('passagem de ano e repetência (CA-12.3)', () => {
    let t3A27: { id: number };
    let t2A27: { id: number };
    beforeEach(async () => {
      t3A27 = await g.criarTurma(b.coord, { nome: '3º A', etapa: 3, anoLetivo: 2027 });
      t2A27 = await g.criarTurma(b.coord, { nome: '2º A', etapa: 2, anoLetivo: 2027 });
    });

    it('só depois do fechamento do ano de origem', async () => {
      const ana = await b.aluno('Ana Clara');
      await expect(g.passagemAno(b.coord, ana.id, { turmaId: t3A27.id })).rejects.toMatchObject({ codigo: 'ANO_NAO_FECHADO' });
    });

    it('passagem: nova matrícula e contexto novo, sem copiar avaliações; 2026 fica como estava', async () => {
      await b.ds.getRepository(YearClosure).insert({ anoLetivo: 2026 }); // simula o fechamento do ano (tarefa 7.3)
      const ana = await b.aluno('Ana Clara');
      const ctx26 = await b.contexto('Ana Clara', 2026);
      const respostas26 = await b.ds.getRepository(SkillResponse).countBy({ contextId: ctx26.id });

      const r = await g.passagemAno(b.coord, ana.id, { turmaId: t3A27.id });
      expect(r).toMatchObject({ tipo: 'PASSAGEM_ANO', anoLetivo: 2027 });
      const ctx27 = await b.ds.getRepository(PedagogicalContext).findOneByOrFail({ studentId: ana.id, anoLetivo: 2027 });
      expect(ctx27.etapa).toBe(3);
      expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctx27.id })).toBe(0);
      expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctx26.id })).toBe(respostas26);
      expect(await b.ds.getRepository(Enrollment).findOneByOrFail({ contextId: ctx26.id })).toMatchObject({ ate: '2026-12-18' }); // fim do 4º bimestre
      await semSobreposicao(ana.id);

      await expect(g.passagemAno(b.coord, ana.id, { turmaId: t2A27.id })).rejects.toMatchObject({ codigo: 'ANO_DIFERENTE' }); // já está em 2027
    });

    it('cenário "Repetência": mesma etapa, nova matrícula, mesmos IDs de habilidade', async () => {
      await b.ds.getRepository(YearClosure).insert({ anoLetivo: 2026 });
      const bernardo = await b.aluno('Bernardo');
      const r = await g.passagemAno(b.coord, bernardo.id, { turmaId: t2A27.id });
      expect(r.tipo).toBe('REPETENCIA');
      const contextos = await b.ds.getRepository(PedagogicalContext).find({ where: { studentId: bernardo.id }, order: { anoLetivo: 'ASC' } });
      expect(contextos.map((c) => [c.anoLetivo, c.etapa])).toEqual([[2025, 1], [2026, 2], [2027, 2]]);
      expect(contextos[1].catalogVersion).toBe(contextos[2].catalogVersion); // mesmas habilidades (mesmos IDs) do 2º ano
      expect(idsDaEtapa(2)).toHaveLength(8);
      expect(await b.ds.getRepository(Movimentacao).findOneBy({ studentId: bernardo.id })).toMatchObject({ tipo: 'REPETENCIA' });
    });

    it('recusa pular ou voltar ano escolar na passagem', async () => {
      await b.ds.getRepository(YearClosure).insert({ anoLetivo: 2026 });
      const t5 = await g.criarTurma(b.coord, { nome: '5º A', etapa: 5, anoLetivo: 2027 });
      await expect(g.passagemAno(b.coord, (await b.aluno('Davi')).id, { turmaId: t5.id })).rejects.toMatchObject({ codigo: 'ETAPA_INVALIDA' });
    });
  });

  it('cenário "Mudança excepcional de etapa": contexto novo sem avaliação; o anterior é conservado sem conversão', async () => {
    const davi = await b.aluno('Davi');
    const ctx2 = await b.contexto('Davi', 2026);
    const antes = await b.ds.getRepository(SkillResponse).countBy({ contextId: ctx2.id });
    const t3 = await g.criarTurma(b.coord, { nome: '3º A', etapa: 3, anoLetivo: 2026 });
    await expect(g.mudancaEtapa(b.coord, davi.id, { turmaId: t3.id, justificativa: '' })).rejects.toMatchObject({ status: 422 });
    await expect(g.mudancaEtapa(b.coord, davi.id, { turmaId: t2B.id, justificativa: 'x' })).rejects.toMatchObject({ codigo: 'MESMA_ETAPA' });

    await g.mudancaEtapa(b.coord, davi.id, { turmaId: t3.id, justificativa: 'Avaliação da equipe pedagógica indicou o 3º ano.' });
    const ctx3 = await b.ds.getRepository(PedagogicalContext).findOneByOrFail({ studentId: davi.id, anoLetivo: 2026, etapa: 3 });
    expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctx3.id })).toBe(0);
    expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctx2.id })).toBe(antes);
    await semSobreposicao(davi.id);
    const p = await painel.turma(b.coord, t3.id, 4);
    expect(p.alunos.find((x) => x.id === davi.id)).toMatchObject({ habilidadesAvaliadas: 0, habilidadesPrevistas: 8 });
  });
});
