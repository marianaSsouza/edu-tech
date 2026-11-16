import { User } from '../../database/entities';
import { SENHA_DEMO } from '../../database/seed/seed';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { AuthService } from './auth.service';
import { PolicyService } from './policy.service';
import { lerCookie, SessoesService } from './sessoes.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

describe('acesso e permissões (tarefas 2.1 e 2.2)', () => {
  let b: Base;
  let auth: AuthService;
  let policy: PolicyService;

  beforeEach(async () => {
    b = await criarBaseTeste();
    auth = new AuthService(b.ds, new SessoesService());
    policy = new PolicyService(b.ds, b.relogio);
  });
  afterEach(() => b.ds.destroy());

  describe('login (RN11, RNF-02)', () => {
    it('login correto abre sessão e a sessão identifica a pessoa', async () => {
      const { token, usuario } = await auth.login('Beatriz@escola.exemplo ', SENHA_DEMO);
      expect(usuario).toEqual({ id: b.beatriz.id, nome: b.beatriz.nome, email: 'beatriz@escola.exemplo', papel: 'PROFESSOR' });
      expect(usuario).not.toHaveProperty('senhaHash');
      expect((await auth.usuarioDaSessao(token))?.id).toBe(b.beatriz.id);
    });

    it('senha errada dá 401', async () => {
      await expect(auth.login('beatriz@escola.exemplo', 'errada')).rejects.toMatchObject({ status: 401, codigo: 'NAO_AUTENTICADO' });
    });

    it('conta desativada dá 401 e a sessão aberta antes deixa de valer (cenário "Desativação de professora")', async () => {
      const { token } = await auth.login('debora@escola.exemplo', SENHA_DEMO);
      await b.ds.getRepository(User).update({ id: b.debora.id }, { ativo: false });
      expect(await auth.usuarioDaSessao(token)).toBeNull();
      await expect(auth.login('debora@escola.exemplo', SENHA_DEMO)).rejects.toMatchObject({ status: 401 });
    });

    it('logout encerra a sessão', async () => {
      const { token } = await auth.login('carlos@escola.exemplo', SENHA_DEMO);
      auth.logout(token);
      expect(await auth.usuarioDaSessao(token)).toBeNull();
    });

    it('lê o cookie da sessão no cabeçalho', () => {
      expect(lerCookie('a=1; fio_sessao=abc123; b=2', 'fio_sessao')).toBe('abc123');
      expect(lerCookie(undefined, 'fio_sessao')).toBeUndefined();
    });
  });

  describe('leitura de aluno (RN06, RF-11, CR-21)', () => {
    it('professora vinculada lê aluno da própria turma', async () => {
      const anaClara = await b.aluno('Ana Clara');
      await expect(policy.exigirLeituraAluno(b.beatriz, anaClara.id)).resolves.toBeUndefined();
      await expect(policy.exigirLeituraAluno(b.debora, anaClara.id)).resolves.toBeUndefined();
    });

    it('Carlos (2º B) não lê aluno do 2º A: 403', async () => {
      const anaClara = await b.aluno('Ana Clara');
      await expect(policy.exigirLeituraAluno(b.carlos, anaClara.id)).rejects.toMatchObject({ status: 403, codigo: 'ACESSO_NEGADO' });
    });

    it('Ana Paula não lê ex-aluna, mesmo sendo autora dos registros de 2025: 403 (cenário "Ex-aluno sem vínculo")', async () => {
      const anaClara = await b.aluno('Ana Clara');
      await expect(policy.exigirLeituraAluno(b.anaPaula, anaClara.id)).rejects.toMatchObject({ status: 403 });
    });

    it('coordenação lê qualquer aluno; aluno inexistente dá 404', async () => {
      const mateus = await b.aluno('Mateus');
      await expect(policy.exigirLeituraAluno(b.coord, mateus.id)).resolves.toBeUndefined();
      await expect(policy.exigirLeituraAluno(b.coord, 99999)).rejects.toMatchObject({ status: 404 });
    });

    it('turmas: professora só as vinculadas hoje', async () => {
      expect(await policy.turmasVinculadasHoje(b.anaPaula.id)).toEqual([]);
      expect(await policy.turmasVinculadasHoje(b.carlos.id)).toHaveLength(1);
    });
  });

  describe('escrita pedagógica (RF-11, RF-13, CA-13.2)', () => {
    it('Beatriz pode escrever no 4º bimestre de 2026', async () => {
      const ctx = await b.contexto('Ana Clara', 2026);
      expect(await policy.avaliarEscrita(b.beatriz, ctx, 4)).toEqual({ pode: true, codigo: 'OK', motivo: null });
    });

    it('coordenação nunca escreve (cenário "Coordenação tenta editar")', async () => {
      const ctx = await b.contexto('Ana Clara', 2026);
      await expect(policy.exigirEscrita(b.coord, ctx, 4)).rejects.toMatchObject({ status: 403, codigo: 'ACESSO_NEGADO' });
    });

    it('bimestre 2 de 2026 está fechado: 422 PERIODO_FECHADO', async () => {
      const ctx = await b.contexto('Ana Clara', 2026);
      await expect(policy.exigirEscrita(b.beatriz, ctx, 2)).rejects.toMatchObject({ status: 422, codigo: 'PERIODO_FECHADO' });
    });

    it('bimestre que ainda não começou: 422 PERIODO_FUTURO', async () => {
      const b2 = await criarBaseTeste('2026-09-01');
      try {
        const p = new PolicyService(b2.ds, b2.relogio);
        const ctx = await b2.contexto('Ana Clara', 2026);
        await expect(p.exigirEscrita(b2.beatriz, ctx, 4)).rejects.toMatchObject({ status: 422, codigo: 'PERIODO_FUTURO' });
      } finally {
        await b2.ds.destroy();
      }
    });

    it('Carlos não escreve para aluno do 2º A: 403', async () => {
      const ctx = await b.contexto('Ana Clara', 2026);
      await expect(policy.exigirEscrita(b.carlos, ctx, 4)).rejects.toMatchObject({ status: 403 });
    });
  });
});
