import { Observation, ResponseRevision, SkillResponse } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { TurmasService } from '../escola/turmas.service';
import { AvaliacaoService } from './avaliacao.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/** Integração: serviços reais + SQLite em memória + relógio fixo em 2026-11-16 (bimestres 3 e 4 abertos). */
describe('avaliação bimestral — integração (tarefas 3.1–3.3, 3.5; CR-21)', () => {
  let b: Base;
  let av: AvaliacaoService;
  let turmas: TurmasService;
  let ctxAnaClara: number;
  let anaClaraId: number;

  beforeEach(async () => {
    b = await criarBaseTeste();
    const policy = new PolicyService(b.ds, b.relogio);
    av = new AvaliacaoService(b.ds, policy, b.relogio);
    turmas = new TurmasService(b.ds, policy, b.relogio);
    ctxAnaClara = (await b.contexto('Ana Clara', 2026)).id;
    anaClaraId = (await b.aluno('Ana Clara')).id;
  });
  afterEach(() => b.ds.destroy());

  describe('leituras', () => {
    it('turmas: coordenação vê todas; Beatriz vê só o 2º A, com 8 alunos (CA-10.1, RF-11)', async () => {
      expect((await turmas.listar(b.coord)).map((t) => t.nome)).toEqual(['2º A', '2º B', '1º A']);
      const [t] = await turmas.listar(b.beatriz);
      expect(t).toMatchObject({ nome: '2º A', alunos: 8, meuVinculo: 'TITULAR' });
      expect((await turmas.listar(b.debora))[0].meuVinculo).toBe('SUBSTITUTA');
    });

    it('alunos da turma em ordem alfabética; Carlos não abre a turma do 2º A (403)', async () => {
      const [t] = await turmas.listar(b.beatriz);
      const { alunos } = await turmas.alunos(b.beatriz, t.id);
      expect(alunos.map((a) => a.nome)).toEqual(['Ana Clara', 'Bernardo', 'Cecília', 'Davi', 'Elisa', 'Felipe', 'Giovana', 'Heitor']);
      await expect(turmas.alunos(b.carlos, t.id)).rejects.toMatchObject({ status: 403 });
    });

    it('bimestre sugerido é o 4º; 8 habilidades sem resposta e Beatriz pode editar (CA-01.1, CA-13.1)', async () => {
      const r = await av.ler(b.beatriz, anaClaraId);
      expect(r.periodo).toMatchObject({ bimestre: 4, situacao: 'DISPONIVEL' });
      expect(r.contexto).toMatchObject({ anoLetivo: 2026, etapa: 2, catalogo: 'CAT-v1', turma: { nome: '2º A' } });
      expect(r.habilidades).toHaveLength(8);
      expect(r.habilidades.every((h) => h.resposta === null)).toBe(true);
      expect(r.escrita).toBeNull();
      expect(r.permissao.podeEditar).toBe(true);
      expect(r.contextosDisponiveis.map((c) => c.anoLetivo)).toEqual([2025, 2026]);
    });

    it('histórico de 2025 fica disponível à professora atual, com autoria preservada (cenário "Histórico de aluno atual")', async () => {
      const r = await av.ler(b.beatriz, anaClaraId, 2025, 4);
      expect(r.contexto.etapa).toBe(1);
      expect(r.habilidades[0].resposta?.autorNome).toBe('Profª Ana Paula');
      expect(r.permissao).toMatchObject({ podeEditar: false, codigo: 'PERIODO_FECHADO' });
    });

    it('Carlos não lê aluno do 2º A; Ana Paula não lê Ana Clara (403, CR-21)', async () => {
      await expect(av.ler(b.carlos, anaClaraId)).rejects.toMatchObject({ status: 403 });
      await expect(av.ler(b.anaPaula, anaClaraId)).rejects.toMatchObject({ status: 403 });
    });

    it('coordenação lê tudo, mas a leitura volta sem permissão de edição e salvar dá 403', async () => {
      const r = await av.ler(b.coord, anaClaraId);
      expect(r.permissao.podeEditar).toBe(false);
      await expect(av.salvarHabilidade(b.coord, ctxAnaClara, 'H02-LP01', { bimestre: 4, nivel: 2 }))
        .rejects.toMatchObject({ status: 403, codigo: 'ACESSO_NEGADO' });
    });
  });

  describe('autoria entre titular e substituta (D03, cenário "Titular e substituta simultâneas")', () => {
    it('Beatriz salva; Débora sem versão recebe 409; com versão recebe 403 AUTORIA; mas salva uma habilidade ausente', async () => {
      const salvo = await av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP01', { bimestre: 4, nivel: 2 });
      expect(salvo.resposta).toMatchObject({ nivel: 2, version: 1, autorId: b.beatriz.id });

      await expect(av.salvarHabilidade(b.debora, ctxAnaClara, 'H02-LP01', { bimestre: 4, nivel: 0 }))
        .rejects.toMatchObject({ status: 409, codigo: 'CONFLITO_VERSAO' });
      await expect(av.salvarHabilidade(b.debora, ctxAnaClara, 'H02-LP01', { bimestre: 4, nivel: 0, version: 1, justificativa: 'x' }))
        .rejects.toMatchObject({ status: 403, codigo: 'AUTORIA' });

      const dela = await av.salvarHabilidade(b.debora, ctxAnaClara, 'H02-LP02', { bimestre: 4, nivel: 1 });
      expect(dela.resposta.autorId).toBe(b.debora.id);

      const r = await av.ler(b.debora, anaClaraId);
      const lp01 = r.habilidades.find((h) => h.id === 'H02-LP01')!;
      expect(lp01.resposta).toMatchObject({ nivel: 2, autorNome: 'Profª Beatriz' });
    });

    it('duas criações simultâneas da mesma habilidade: um sucesso e um 409 (CA-13.5)', async () => {
      const resultados = await Promise.allSettled([
        av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-MAT01', { bimestre: 4, nivel: 2 }),
        av.salvarHabilidade(b.debora, ctxAnaClara, 'H02-MAT01', { bimestre: 4, nivel: 0 }),
      ]);
      expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const falha = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(falha.reason).toMatchObject({ status: 409 });
      expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctxAnaClara, skillId: 'H02-MAT01', bimestre: 4 })).toBe(1);
    });
  });

  describe('correção pela autora (D04, RF-13)', () => {
    it('exige justificativa (422), grava revisão, sobe a versão; versão antiga dá 409', async () => {
      await av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP03', { bimestre: 4, nivel: 1 });

      await expect(av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP03', { bimestre: 4, nivel: 2, version: 1 }))
        .rejects.toMatchObject({ status: 422, codigo: 'JUSTIFICATIVA_OBRIGATORIA' });

      const corrigido = await av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP03', {
        bimestre: 4, nivel: 2, version: 1, justificativa: 'Marquei a habilidade errada.',
      });
      expect(corrigido.resposta).toMatchObject({ nivel: 2, version: 2 });
      const revs = await b.ds.getRepository(ResponseRevision).findBy({ responseId: corrigido.resposta.id, tipo: 'HABILIDADE' });
      expect(revs).toEqual([expect.objectContaining({ versaoAnterior: 1, nivelAnterior: 1, nivelNovo: 2, autorId: b.beatriz.id })]);

      await expect(av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP03', { bimestre: 4, nivel: 0, version: 1, justificativa: 'y' }))
        .rejects.toMatchObject({ status: 409 });
    });

    it('salvar o mesmo nível de novo não cria revisão', async () => {
      const r1 = await av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP04', { bimestre: 4, nivel: 1 });
      const r2 = await av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP04', { bimestre: 4, nivel: 1, version: 1 });
      expect(r2.resposta.version).toBe(1);
      expect(await b.ds.getRepository(ResponseRevision).countBy({ responseId: r1.resposta.id })).toBe(0);
    });

    it('escrita: cria e corrige com revisão; nível fora de 0..3 dá 422', async () => {
      const e1 = await av.salvarEscrita(b.beatriz, ctxAnaClara, { bimestre: 4, nivel: 2 });
      const e2 = await av.salvarEscrita(b.beatriz, ctxAnaClara, { bimestre: 4, nivel: 3, version: 1, justificativa: 'Revi a sondagem.' });
      expect(e2.escrita).toMatchObject({ nivel: 3, version: 2 });
      expect(await b.ds.getRepository(ResponseRevision).countBy({ responseId: e1.escrita.id, tipo: 'ESCRITA' })).toBe(1);
      await expect(av.salvarEscrita(b.beatriz, ctxAnaClara, { bimestre: 4, nivel: 4 })).rejects.toMatchObject({ status: 422 });
    });

    it('habilidade de outra etapa é rejeitada (422)', async () => {
      await expect(av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H01-LP01', { bimestre: 4, nivel: 2 }))
        .rejects.toMatchObject({ status: 422 });
    });
  });

  describe('período (D06, CA-13.2)', () => {
    it('bimestre 2 de 2026 dá 422 PERIODO_FECHADO', async () => {
      await expect(av.salvarHabilidade(b.beatriz, ctxAnaClara, 'H02-LP01', { bimestre: 2, nivel: 2 }))
        .rejects.toMatchObject({ status: 422, codigo: 'PERIODO_FECHADO' });
    });
  });

  describe('observações por autora (D02; RN05, RF-04, CA-04.1–04.3)', () => {
    it('3.000 + 1.001 caracteres é rejeitado; 3.000 + 1.000 é aceito', async () => {
      await av.criarObservacao(b.beatriz, ctxAnaClara, { bimestre: 4, texto: 'a'.repeat(3000) });
      await expect(av.criarObservacao(b.debora, ctxAnaClara, { bimestre: 4, texto: 'b'.repeat(1001) }))
        .rejects.toMatchObject({ status: 422, codigo: 'LIMITE_OBSERVACOES' });
      await expect(av.criarObservacao(b.debora, ctxAnaClara, { bimestre: 4, texto: 'b'.repeat(1000) })).resolves.toBeDefined();
      const r = await av.ler(b.debora, anaClaraId);
      expect(r.limiteObservacoes).toEqual({ usado: 4000, max: 4000 });
      expect(r.observacoes.map((o) => [o.autorNome, o.minha])).toEqual([['Profª Beatriz', false], ['Profª Débora', true]]);
    });

    it('texto vazio é rejeitado (a observação é opcional, mas não se cria vazia)', async () => {
      await expect(av.criarObservacao(b.beatriz, ctxAnaClara, { bimestre: 4, texto: '   ' })).rejects.toMatchObject({ status: 422 });
    });

    it('só a autora edita; a versão antiga é guardada e não consome o limite; versão antiga dá 409', async () => {
      const { observacao } = await av.criarObservacao(b.beatriz, ctxAnaClara, { bimestre: 4, texto: 'a'.repeat(3000) });
      await expect(av.editarObservacao(b.debora, observacao.id, { texto: 'outro', version: 1 }))
        .rejects.toMatchObject({ status: 403, codigo: 'AUTORIA' });

      const editada = await av.editarObservacao(b.beatriz, observacao.id, { texto: 'c'.repeat(4000), version: 1 });
      expect(editada.observacao).toMatchObject({ id: observacao.id, version: 2 });
      const antigas = await b.ds.getRepository(Observation).findBy({ contextId: ctxAnaClara, bimestre: 4, vigente: false });
      expect(antigas).toHaveLength(1);
      expect(antigas[0].texto).toHaveLength(3000);
      expect((await av.ler(b.beatriz, anaClaraId)).limiteObservacoes.usado).toBe(4000);

      await expect(av.editarObservacao(b.beatriz, observacao.id, { texto: 'd', version: 1 })).rejects.toMatchObject({ status: 409 });
    });
  });
});
