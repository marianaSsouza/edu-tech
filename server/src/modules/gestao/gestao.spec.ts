import { Enrollment, SchoolClass, SkillResponse, Student, TeacherLink, User } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { AuthService } from '../acesso/auth.service';
import { PolicyService } from '../acesso/policy.service';
import { SessoesService } from '../acesso/sessoes.service';
import { AvaliacaoService } from '../avaliacao/avaliacao.service';
import { GestaoService, nomesParecidos } from './gestao.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/** Tarefa 7.1 — spec gestao-escolar (RF-12, CA-12.1, CA-12.4, RN11, RNF-03). Data de teste: 16/11/2026. */
describe('gestão escolar — cadastros e vínculos', () => {
  let b: Base;
  let g: GestaoService;
  let policy: PolicyService;
  let av: AvaliacaoService;
  let turma2A: SchoolClass;

  beforeEach(async () => {
    b = await criarBaseTeste();
    policy = new PolicyService(b.ds, b.relogio);
    g = new GestaoService(b.ds, policy, b.relogio);
    av = new AvaliacaoService(b.ds, policy, b.relogio);
    turma2A = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
  });
  afterEach(() => b.ds.destroy());

  it('CA-12.4: professora não acessa nenhuma operação administrativa (403)', async () => {
    const tentativas = [
      () => g.resumo(b.beatriz),
      () => g.criarAluno(b.beatriz, { nome: 'Teste', turmaId: turma2A.id }),
      () => g.criarTurma(b.beatriz, { nome: '3º C', etapa: 3, anoLetivo: 2026 }),
      () => g.criarConta(b.beatriz, { nome: 'X', email: 'x@escola.exemplo' }),
      () => g.criarVinculo(b.beatriz, { classId: turma2A.id, userId: b.beatriz.id, tipo: 'TITULAR', de: '2026-11-16' }),
      () => g.definirAtiva(b.beatriz, b.carlos.id, false),
      () => g.novaSenha(b.beatriz, b.beatriz.id),
      () => g.arquivarAluno(b.beatriz, 1),
    ];
    for (const t of tentativas) await expect(t()).rejects.toMatchObject({ status: 403 });
  });

  it('cenário "Elevação indevida" (acesso-e-permissoes): professora não cria conta de coordenação nem muda o próprio papel', async () => {
    await expect(g.criarConta(b.beatriz, { nome: 'Beatriz 2', email: 'beatriz2@escola.exemplo', papel: 'COORDENACAO' })).rejects.toMatchObject({ status: 403 });
    await expect(g.novaSenha(b.beatriz, b.coord.id)).rejects.toMatchObject({ status: 403 });
    expect(await b.ds.getRepository(User).findOneByOrFail({ id: b.beatriz.id })).toMatchObject({ papel: 'PROFESSOR' });
    expect(await b.ds.getRepository(User).countBy({ email: 'beatriz2@escola.exemplo' })).toBe(0);
    // não existe operação que altere o papel de uma conta: nem a coordenação troca o papel depois de criada
    expect(Object.getOwnPropertyNames(GestaoService.prototype).filter((m) => /papel/i.test(m))).toEqual([]);
  });

  it('CA-12.1: coordenação cria turma e vínculo; a professora passa a ver a turma', async () => {
    const t = await g.criarTurma(b.coord, { nome: '3º C', etapa: 3, anoLetivo: 2026 });
    await expect(g.criarTurma(b.coord, { nome: '3º c', etapa: 3, anoLetivo: 2026 })).rejects.toMatchObject({ status: 409, codigo: 'TURMA_DUPLICADA' });
    await g.criarVinculo(b.coord, { classId: t.id, userId: b.carlos.id, tipo: 'TITULAR', de: '2026-11-16' });
    expect(await policy.turmasVinculadasHoje(b.carlos.id)).toContain(t.id);
  });

  describe('cenário "Possível duplicidade"', () => {
    it('nome igual, com erro de digitação ou mesmo primeiro nome na turma é sinalizado; sem CPF', () => {
      expect(nomesParecidos('bernardo', 'Bernardo', false)).toBe(true);
      expect(nomesParecidos('Bernado', 'Bernardo', false)).toBe(true);
      expect(nomesParecidos('Ana Luíza', 'Ana Clara', true)).toBe(true);
      expect(nomesParecidos('Ana Luíza', 'Ana Clara', false)).toBe(false);
      expect(nomesParecidos('Lucas', 'Bernardo', true)).toBe(false);
    });

    it('sinaliza sem mesclar: só cadastra com confirmação, e o novo aluno nasce sem o histórico do outro', async () => {
      const antes = await b.ds.getRepository(Student).count();
      const erro = await g.criarAluno(b.coord, { nome: 'Bernado', turmaId: turma2A.id }).catch((e) => e);
      expect(erro).toMatchObject({ status: 409, codigo: 'POSSIVEL_DUPLICIDADE' });
      expect((erro.getResponse() as { parecidos: Array<{ nome: string; turma: string }> }).parecidos)
        .toEqual([expect.objectContaining({ nome: 'Bernardo', turma: '2º A (2026)' })]);
      expect(await b.ds.getRepository(Student).count()).toBe(antes); // nada criado

      const novo = await g.criarAluno(b.coord, { nome: 'Bernado', turmaId: turma2A.id, confirmarDuplicidade: true });
      const bernardo = await b.aluno('Bernardo');
      expect(novo.id).not.toBe(bernardo.id);
      const ctxNovo = (await b.ds.query(`SELECT id FROM contextos_pedagogicos WHERE studentId = ?`, [novo.id]))[0].id;
      expect(await b.ds.getRepository(SkillResponse).countBy({ contextId: ctxNovo })).toBe(0);
      expect(await b.ds.getRepository(Enrollment).countBy({ contextId: ctxNovo })).toBe(1);
    });

    it('nome sem parecido cadastra direto, com matrícula na turma a partir de hoje', async () => {
      const novo = await g.criarAluno(b.coord, { nome: 'Lucas Andrade', turmaId: turma2A.id });
      const r = await g.resumo(b.coord);
      expect(r.alunos.find((a) => a.id === novo.id)).toMatchObject({ arquivado: false, turmaAtual: { id: turma2A.id } });
      await expect(g.criarAluno(b.coord, { nome: '', turmaId: turma2A.id })).rejects.toMatchObject({ status: 422 });
    });
  });

  describe('vigência dos vínculos docentes (RN11)', () => {
    it('cenário "Substituição autorizada": segunda titular é recusada; substituta explícita coexiste e as duas acessam', async () => {
      const nova = await g.criarConta(b.coord, { nome: 'Profª Elaine', email: 'elaine@escola.exemplo' });
      await expect(g.criarVinculo(b.coord, { classId: turma2A.id, userId: nova.id, tipo: 'TITULAR', de: '2026-11-16' }))
        .rejects.toMatchObject({ status: 409, codigo: 'TITULAR_EXISTENTE' });
      await g.criarVinculo(b.coord, { classId: turma2A.id, userId: nova.id, tipo: 'SUBSTITUTA', de: '2026-11-16' });
      expect(await policy.turmasVinculadasHoje(nova.id)).toContain(turma2A.id);
      expect(await policy.turmasVinculadasHoje(b.beatriz.id)).toContain(turma2A.id);
      await expect(g.criarVinculo(b.coord, { classId: turma2A.id, userId: nova.id, tipo: 'SUBSTITUTA', de: '2026-12-01' }))
        .rejects.toMatchObject({ status: 409, codigo: 'VINCULO_DUPLICADO' });
    });

    it('cenário "Vínculo encerrado": a professora deixa de registrar; a autoria passada continua', async () => {
      const ctx = await b.contexto('Ana Clara', 2026);
      await av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP01', { bimestre: 4, nivel: 2 });
      const vinculo = await b.ds.getRepository(TeacherLink).findOneByOrFail({ userId: b.beatriz.id, classId: turma2A.id });
      await g.encerrarVinculo(b.coord, vinculo.id, { ate: '2026-11-15' });

      await expect(av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP02', { bimestre: 4, nivel: 1 })).rejects.toMatchObject({ status: 403 });
      expect(await b.ds.getRepository(SkillResponse).findOneBy({ contextId: ctx.id, skillId: 'H02-LP01', bimestre: 4 }))
        .toMatchObject({ autorId: b.beatriz.id, nivel: 2 });
      expect(await b.ds.getRepository(TeacherLink).countBy({ id: vinculo.id })).toBe(1); // encerrado, não apagado
    });

    it('valida datas, papel e conta ativa', async () => {
      await expect(g.criarVinculo(b.coord, { classId: turma2A.id, userId: b.carlos.id, tipo: 'SUBSTITUTA', de: '2026-12-01', ate: '2026-11-01' }))
        .rejects.toMatchObject({ status: 422 });
      await expect(g.criarVinculo(b.coord, { classId: turma2A.id, userId: b.coord.id, tipo: 'SUBSTITUTA', de: '2026-11-16' }))
        .rejects.toMatchObject({ codigo: 'NAO_E_PROFESSORA' });
      await expect(g.criarVinculo(b.coord, { classId: turma2A.id, userId: b.carlos.id, tipo: 'SUBSTITUTA', de: '2025-11-16' }))
        .rejects.toMatchObject({ codigo: 'FORA_DO_ANO' });
      await expect(g.criarVinculo(b.coord, { classId: turma2A.id, userId: b.carlos.id, tipo: 'OUTRO', de: '2026-11-16' }))
        .rejects.toMatchObject({ status: 422 });
      await g.definirAtiva(b.coord, b.carlos.id, false);
      await expect(g.criarVinculo(b.coord, { classId: turma2A.id, userId: b.carlos.id, tipo: 'SUBSTITUTA', de: '2026-11-16' }))
        .rejects.toMatchObject({ codigo: 'CONTA_DESATIVADA' });
    });
  });

  describe('contas', () => {
    it('conta nova entra com a senha temporária mostrada uma vez; a senha não fica em texto simples', async () => {
      const auth = new AuthService(b.ds, new SessoesService());
      const nova = await g.criarConta(b.coord, { nome: 'Profª Elaine', email: 'Elaine@Escola.exemplo' });
      expect(nova).toMatchObject({ email: 'elaine@escola.exemplo', papel: 'PROFESSOR', senhaTemporaria: expect.stringMatching(/^.{10}$/) });
      const salvo = await b.ds.getRepository(User).findOneByOrFail({ id: nova.id });
      expect(salvo.senhaHash).not.toContain(nova.senhaTemporaria);
      await expect(auth.login('elaine@escola.exemplo', nova.senhaTemporaria)).resolves.toBeTruthy();
      await expect(g.criarConta(b.coord, { nome: 'Outra', email: 'elaine@escola.exemplo' })).rejects.toMatchObject({ codigo: 'EMAIL_EM_USO' });

      const trocada = await g.novaSenha(b.coord, nova.id);
      await expect(auth.login('elaine@escola.exemplo', nova.senhaTemporaria)).rejects.toMatchObject({ status: 401 });
      await expect(auth.login('elaine@escola.exemplo', trocada.senhaTemporaria)).resolves.toBeTruthy();
    });

    it('desativar corta o acesso sem apagar a conta; a coordenação não desativa a si mesma', async () => {
      const auth = new AuthService(b.ds, new SessoesService());
      const { token } = await auth.login('carlos@escola.exemplo', 'demo1234');
      await g.definirAtiva(b.coord, b.carlos.id, false);
      expect(await auth.usuarioDaSessao(token)).toBeNull();
      await g.definirAtiva(b.coord, b.carlos.id, true);
      await expect(auth.login('carlos@escola.exemplo', 'demo1234')).resolves.toBeTruthy();
      await expect(g.definirAtiva(b.coord, b.coord.id, false)).rejects.toMatchObject({ codigo: 'PROPRIA_CONTA' });
    });
  });

  it('turma criada por engano: só a vazia pode ser excluída; com histórico, nunca', async () => {
    const errada = await g.criarTurma(b.coord, { nome: '3º C', etapa: 3, anoLetivo: 2027 });
    await expect(g.criarAluno(b.coord, { nome: 'Lucas Andrade', turmaId: errada.id })).rejects.toMatchObject({ codigo: 'ANO_DIFERENTE' });
    await expect(g.excluirTurma(b.beatriz, errada.id)).rejects.toMatchObject({ status: 403 });
    // vínculo que ainda não começou pode ser cancelado; depois a turma fica vazia e pode ser excluída
    const futuro = await g.criarVinculo(b.coord, { classId: errada.id, userId: b.debora.id, tipo: 'TITULAR', de: '2027-02-01' });
    await expect(g.excluirTurma(b.coord, errada.id)).rejects.toMatchObject({ codigo: 'TURMA_COM_HISTORICO' });
    await g.cancelarVinculo(b.coord, futuro.id);
    const vigente = await b.ds.getRepository(TeacherLink).findOneByOrFail({ userId: b.beatriz.id, classId: turma2A.id });
    await expect(g.cancelarVinculo(b.coord, vigente.id)).rejects.toMatchObject({ codigo: 'VINCULO_JA_COMECOU' });
    await g.excluirTurma(b.coord, errada.id);
    expect(await b.ds.getRepository(SchoolClass).countBy({ id: errada.id })).toBe(0);
    await expect(g.excluirTurma(b.coord, turma2A.id)).rejects.toMatchObject({ codigo: 'TURMA_COM_HISTORICO' });
    expect(await b.ds.getRepository(SchoolClass).countBy({ id: turma2A.id })).toBe(1);
  });

  it('arquivamento: encerra a matrícula e marca o aluno, sem apagar avaliações', async () => {
    const ana = await b.aluno('Ana Clara');
    const respostasAntes = await b.ds.query(`SELECT COUNT(*) n FROM respostas_habilidade r JOIN contextos_pedagogicos c ON c.id = r.contextId WHERE c.studentId = ?`, [ana.id]);
    const r = await g.arquivarAluno(b.coord, ana.id);
    expect(r).toMatchObject({ arquivado: true, matriculasEncerradas: 1 });
    const resumo = await g.resumo(b.coord);
    expect(resumo.alunos.find((a) => a.id === ana.id)).toMatchObject({ arquivado: true });
    const respostasDepois = await b.ds.query(`SELECT COUNT(*) n FROM respostas_habilidade r JOIN contextos_pedagogicos c ON c.id = r.contextId WHERE c.studentId = ?`, [ana.id]);
    expect(respostasDepois).toEqual(respostasAntes);
    await expect(g.arquivarAluno(b.coord, ana.id)).rejects.toMatchObject({ codigo: 'JA_ARQUIVADO' });
  });
});
