import { Body, Controller, Get, Injectable, Module, Param, ParseIntPipe, Post } from '@nestjs/common';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { DataSource, EntityManager } from 'typeorm';
import { UsuarioAtual } from '../../common/auth';
import { acessoNegado, dadosInvalidos, ErroApi, naoEncontrado } from '../../common/erros';
import { exclusivo } from '../../common/exclusivo';
import { Relogio } from '../../common/relogio';
import { Enrollment, Papel, PedagogicalContext, SchoolClass, Student, TeacherLink, TipoVinculo, User } from '../../database/entities';
import { CATALOGO_VERSAO_ATUAL } from '../../database/seed/cat-v1';
import { PolicyService } from '../acesso/policy.service';

/**
 * Tarefa 7.1 — spec gestao-escolar (RF-12, CA-12.1/12.4, RN11, RNF-03/05).
 * Só a coordenação: cadastros de alunos, turmas e contas; vínculos docentes com vigência.
 * - Duplicidade de aluno é SINALIZADA (nome e contexto parecidos), nunca mesclada; sem CPF.
 * - Nada com histórico é apagado: aluno é arquivado, conta é desativada, vínculo é encerrado.
 * - Titular e substituta só coexistem quando a coordenação cadastra explicitamente uma SUBSTITUTA.
 * Transferências, passagem de ano e repetência ficam na tarefa 7.2.
 */

const regra = (codigo: string, mensagem: string) => new ErroApi(422, codigo, mensagem);
const conflito = (codigo: string, mensagem: string) => new ErroApi(409, codigo, mensagem);
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const FIM_ABERTO = '9999-12-31';

/** Nome comparável: sem acento, minúsculo, espaços simples. */
export function normalizarNome(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Distância de edição (letras trocadas, a mais ou a menos). */
function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

/**
 * Cenário "Possível duplicidade": nome igual ou quase igual (até 2 letras de diferença) em qualquer lugar,
 * ou mesmo primeiro nome na mesma turma. Só sinaliza; quem decide é a coordenação.
 */
export function nomesParecidos(novo: string, existente: string, mesmaTurma: boolean): boolean {
  const a = normalizarNome(novo);
  const b = normalizarNome(existente);
  if (a === b || distancia(a, b) <= 2) return true;
  return mesmaTurma && a.split(' ')[0] === b.split(' ')[0];
}

const texto = (v: unknown, campo: string, max = 120): string => {
  if (typeof v !== 'string' || !v.trim()) throw dadosInvalidos(`Informe ${campo}.`);
  if (v.trim().length > max) throw dadosInvalidos(`${campo[0].toUpperCase()}${campo.slice(1)} pode ter até ${max} caracteres.`);
  return v.trim().replace(/\s+/g, ' ');
};
const inteiro = (v: unknown, min: number, max: number, campo: string): number => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) throw dadosInvalidos(`${campo} deve ser um número de ${min} a ${max}.`);
  return n;
};
const data = (v: unknown, campo: string): string => {
  if (typeof v !== 'string' || !DATA.test(v) || Number.isNaN(Date.parse(v))) throw dadosInvalidos(`${campo} deve ser uma data válida (AAAA-MM-DD).`);
  return v;
};
const sobrepoe = (a: { de: string; ate: string | null }, b: { de: string; ate: string | null }) =>
  a.de <= (b.ate ?? FIM_ABERTO) && b.de <= (a.ate ?? FIM_ABERTO);

/** Senha temporária legível (sem 0/O, 1/l), mostrada uma única vez para a coordenação entregar à pessoa. */
function senhaTemporaria(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 10 }, () => letras[randomInt(letras.length)]).join('');
}

@Injectable()
export class GestaoService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  private exigirCoordenacao(u: User) {
    // CA-12.4: professora não acessa operações administrativas
    if (!this.policy.ehCoordenacao(u)) throw acessoNegado('Somente a coordenação administra cadastros e vínculos.');
  }

  private gravar<T>(fn: (m: EntityManager) => Promise<T>): Promise<T> {
    return exclusivo(() => this.ds.transaction(fn));
  }

  /** Tudo o que a tela de gestão precisa, numa chamada. */
  async resumo(u: User) {
    this.exigirCoordenacao(u);
    const hoje = this.relogio.hoje();
    const turmas = await this.ds.getRepository(SchoolClass).find({ order: { anoLetivo: 'DESC', etapa: 'ASC', nome: 'ASC' } });
    const usuarios = await this.ds.getRepository(User).find({ order: { nome: 'ASC' } });
    const vinculos = await this.ds.getRepository(TeacherLink).find({ order: { de: 'ASC' } });
    const nomeDe = new Map(usuarios.map((x) => [x.id, x.nome]));
    const matriculas: Array<{ studentId: number; classId: number; de: string; ate: string | null }> = await this.ds.query(
      `SELECT c.studentId, m.classId, m.de, m.ate FROM matriculas m JOIN contextos_pedagogicos c ON c.id = m.contextId`,
    );
    const vigente = (x: { de: string; ate: string | null }) => x.de <= hoje && (x.ate === null || x.ate >= hoje);
    const alunos = await this.ds.getRepository(Student).find({ order: { nome: 'ASC' } });
    const nomeTurma = new Map(turmas.map((t) => [t.id, `${t.nome} (${t.anoLetivo})`]));

    return {
      hoje,
      anoAtual: Number(hoje.slice(0, 4)),
      turmas: turmas.map((t) => ({
        id: t.id, nome: t.nome, etapa: t.etapa, anoLetivo: t.anoLetivo,
        alunosHoje: matriculas.filter((m) => m.classId === t.id && vigente(m)).length,
        vazia: !matriculas.some((m) => m.classId === t.id) && !vinculos.some((v) => v.classId === t.id), // pode ser excluída
        vinculos: vinculos.filter((v) => v.classId === t.id).map((v) => ({
          id: v.id, userId: v.userId, nome: nomeDe.get(v.userId) ?? '—', tipo: v.tipo, de: v.de, ate: v.ate,
          situacao: v.de > hoje ? 'FUTURO' : vigente(v) ? 'VIGENTE' : 'ENCERRADO',
        })),
      })),
      usuarios: usuarios.map((x) => ({ id: x.id, nome: x.nome, email: x.email, papel: x.papel, ativo: x.ativo })),
      alunos: alunos.map((a) => {
        const atual = matriculas.find((m) => m.studentId === a.id && vigente(m));
        return { id: a.id, nome: a.nome, arquivado: !a.ativo, turmaAtual: atual ? { id: atual.classId, nome: nomeTurma.get(atual.classId) ?? '—' } : null };
      }),
    };
  }

  // ---------------------------------------------------------------- alunos

  /**
   * Cadastro de aluno com matrícula numa turma do ano atual. Se houver nomes parecidos, devolve 409
   * POSSIVEL_DUPLICIDADE com a lista; a coordenação confirma com `confirmarDuplicidade: true` (nada é mesclado).
   */
  async criarAluno(u: User, body: { nome?: unknown; turmaId?: unknown; confirmarDuplicidade?: unknown }) {
    this.exigirCoordenacao(u);
    const nome = texto(body?.nome, 'o nome do aluno', 80);
    const turmaId = inteiro(body?.turmaId, 1, Number.MAX_SAFE_INTEGER, 'turma');
    const hoje = this.relogio.hoje();
    return this.gravar(async (m) => {
      const turma = await m.findOneBy(SchoolClass, { id: turmaId });
      if (!turma) throw naoEncontrado('Turma não encontrada.');
      if (turma.anoLetivo !== Number(hoje.slice(0, 4))) {
        throw regra('ANO_DIFERENTE', `Novos alunos entram em turmas de ${hoje.slice(0, 4)}. Matrícula em outro ano é feita na passagem de ano.`);
      }

      if (body?.confirmarDuplicidade !== true) {
        const existentes: Array<{ id: number; nome: string; ativo: number; classId: number | null; turma: string | null; anoLetivo: number | null }> = await m.query(
          `SELECT a.id, a.nome, a.ativo, m.classId, t.nome AS turma, t.anoLetivo
             FROM alunos a
             LEFT JOIN contextos_pedagogicos c ON c.studentId = a.id
             LEFT JOIN matriculas m ON m.contextId = c.id AND m.de <= ? AND (m.ate IS NULL OR m.ate >= ?)
             LEFT JOIN turmas t ON t.id = m.classId`,
          [hoje, hoje],
        );
        const parecidos = new Map<number, { id: number; nome: string; turma: string | null; arquivado: boolean }>();
        for (const e of existentes) {
          if (nomesParecidos(nome, e.nome, e.classId === turmaId)) {
            const atual = parecidos.get(e.id);
            if (!atual || (!atual.turma && e.turma)) {
              parecidos.set(e.id, { id: e.id, nome: e.nome, turma: e.turma ? `${e.turma} (${e.anoLetivo})` : null, arquivado: !e.ativo });
            }
          }
        }
        if (parecidos.size > 0) {
          throw new ErroApi(409, 'POSSIVEL_DUPLICIDADE', 'Já existe aluno com nome parecido. Confira se não é a mesma criança antes de cadastrar.',
            { parecidos: [...parecidos.values()] });
        }
      }

      const aluno = await m.save(m.create(Student, { nome }));
      const ctx = await m.save(m.create(PedagogicalContext, { studentId: aluno.id, anoLetivo: turma.anoLetivo, etapa: turma.etapa, catalogVersion: CATALOGO_VERSAO_ATUAL }));
      await m.insert(Enrollment, { contextId: ctx.id, classId: turma.id, de: hoje, ate: null });
      return { id: aluno.id, nome: aluno.nome, turma: { id: turma.id, nome: turma.nome } };
    });
  }

  async renomearAluno(u: User, id: number, body: { nome?: unknown }) {
    this.exigirCoordenacao(u);
    const nome = texto(body?.nome, 'o nome do aluno', 80);
    return this.gravar(async (m) => {
      const a = await m.findOneBy(Student, { id });
      if (!a) throw naoEncontrado('Aluno não encontrado.');
      await m.update(Student, { id }, { nome });
      return { id, nome };
    });
  }

  /**
   * Arquivar (cadastro com histórico não é apagado): encerra a matrícula vigente hoje e marca o aluno como arquivado.
   * Avaliações, observações e eventos continuam consultáveis pela coordenação.
   */
  async arquivarAluno(u: User, id: number) {
    this.exigirCoordenacao(u);
    const hoje = this.relogio.hoje();
    return this.gravar(async (m) => {
      const a = await m.findOneBy(Student, { id });
      if (!a) throw naoEncontrado('Aluno não encontrado.');
      if (!a.ativo) throw regra('JA_ARQUIVADO', 'Este aluno já está arquivado.');
      const vigentes: Array<{ id: number }> = await m.query(
        `SELECT m.id FROM matriculas m JOIN contextos_pedagogicos c ON c.id = m.contextId
          WHERE c.studentId = ? AND m.de <= ? AND (m.ate IS NULL OR m.ate >= ?)`,
        [id, hoje, hoje],
      );
      for (const mt of vigentes) await m.update(Enrollment, { id: mt.id }, { ate: hoje });
      await m.update(Student, { id }, { ativo: false });
      return { id, arquivado: true, matriculasEncerradas: vigentes.length };
    });
  }

  // ---------------------------------------------------------------- turmas

  async criarTurma(u: User, body: { nome?: unknown; etapa?: unknown; anoLetivo?: unknown }) {
    this.exigirCoordenacao(u);
    const nome = texto(body?.nome, 'o nome da turma', 20);
    const etapa = inteiro(body?.etapa, 1, 5, 'O ano escolar');
    const anoAtual = Number(this.relogio.hoje().slice(0, 4));
    const anoLetivo = inteiro(body?.anoLetivo, anoAtual, anoAtual + 1, 'O ano letivo');
    return this.gravar(async (m) => {
      const repetida = (await m.find(SchoolClass, { where: { anoLetivo } })).find((t) => normalizarNome(t.nome) === normalizarNome(nome));
      if (repetida) throw conflito('TURMA_DUPLICADA', `Já existe a turma ${repetida.nome} em ${anoLetivo}.`);
      const t = await m.save(m.create(SchoolClass, { nome, etapa, anoLetivo }));
      return { id: t.id, nome: t.nome, etapa: t.etapa, anoLetivo: t.anoLetivo };
    });
  }

  /**
   * Desfaz um cadastro de turma feito por engano. Só turma VAZIA (nenhuma matrícula e nenhum vínculo, em
   * qualquer data): sem histórico, não há o que preservar. Turma com histórico nunca é apagada.
   */
  async excluirTurma(u: User, id: number) {
    this.exigirCoordenacao(u);
    return this.gravar(async (m) => {
      const t = await m.findOneBy(SchoolClass, { id });
      if (!t) throw naoEncontrado('Turma não encontrada.');
      const matriculas = await m.countBy(Enrollment, { classId: id });
      const vinculos = await m.countBy(TeacherLink, { classId: id });
      if (matriculas > 0 || vinculos > 0) {
        throw regra('TURMA_COM_HISTORICO', `A turma ${t.nome} já tem alunos ou professoras registrados e não pode ser excluída: o histórico é preservado.`);
      }
      await m.delete(SchoolClass, { id });
      return { id, excluida: true };
    });
  }

  // ---------------------------------------------------------------- contas

  /** Conta individual criada pela coordenação (não há cadastro público). A senha temporária aparece só nesta resposta. */
  async criarConta(u: User, body: { nome?: unknown; email?: unknown; papel?: unknown }) {
    this.exigirCoordenacao(u);
    const nome = texto(body?.nome, 'o nome', 80);
    const email = texto(body?.email, 'o e-mail', 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw dadosInvalidos('Informe um e-mail válido.');
    const papel: Papel = body?.papel === 'COORDENACAO' ? 'COORDENACAO' : 'PROFESSOR';
    const senha = senhaTemporaria();
    const senhaHash = await bcrypt.hash(senha, 10);
    return this.gravar(async (m) => {
      if (await m.existsBy(User, { email })) throw conflito('EMAIL_EM_USO', 'Já existe uma conta com este e-mail.');
      const novo = await m.save(m.create(User, { nome, email, senhaHash, papel }));
      return { id: novo.id, nome, email, papel, senhaTemporaria: senha };
    });
  }

  async definirAtiva(u: User, id: number, ativo: boolean) {
    this.exigirCoordenacao(u);
    if (id === u.id && !ativo) throw regra('PROPRIA_CONTA', 'Você não pode desativar a sua própria conta.');
    return this.gravar(async (m) => {
      const alvo = await m.findOneBy(User, { id });
      if (!alvo) throw naoEncontrado('Conta não encontrada.');
      await m.update(User, { id }, { ativo }); // desativar corta a sessão na próxima requisição (AuthService)
      return { id, ativo };
    });
  }

  /** Esqueci minha senha: a coordenação gera uma nova senha temporária e entrega à pessoa. */
  async novaSenha(u: User, id: number) {
    this.exigirCoordenacao(u);
    const senha = senhaTemporaria();
    const senhaHash = await bcrypt.hash(senha, 10);
    return this.gravar(async (m) => {
      const alvo = await m.findOneBy(User, { id });
      if (!alvo) throw naoEncontrado('Conta não encontrada.');
      await m.update(User, { id }, { senhaHash });
      return { id, senhaTemporaria: senha };
    });
  }

  // ---------------------------------------------------------------- vínculos

  async criarVinculo(u: User, body: { classId?: unknown; userId?: unknown; tipo?: unknown; de?: unknown; ate?: unknown }) {
    this.exigirCoordenacao(u);
    const classId = inteiro(body?.classId, 1, Number.MAX_SAFE_INTEGER, 'turma');
    const userId = inteiro(body?.userId, 1, Number.MAX_SAFE_INTEGER, 'professora');
    if (body?.tipo !== 'TITULAR' && body?.tipo !== 'SUBSTITUTA') throw dadosInvalidos('Escolha se o vínculo é de titular ou de substituta.');
    const tipo: TipoVinculo = body.tipo;
    const de = data(body?.de, 'O início');
    const ate = body?.ate === null || body?.ate === undefined || body?.ate === '' ? null : data(body.ate, 'O fim');
    if (ate !== null && ate < de) throw dadosInvalidos('O fim do vínculo não pode ser antes do início.');

    return this.gravar(async (m) => {
      const turma = await m.findOneBy(SchoolClass, { id: classId });
      if (!turma) throw naoEncontrado('Turma não encontrada.');
      const prof = await m.findOneBy(User, { id: userId });
      if (!prof) throw naoEncontrado('Conta não encontrada.');
      if (prof.papel !== 'PROFESSOR') throw regra('NAO_E_PROFESSORA', 'Só contas de professora recebem vínculo com turma.');
      if (!prof.ativo) throw regra('CONTA_DESATIVADA', 'Esta conta está desativada. Reative antes de criar o vínculo.');
      if (Number(de.slice(0, 4)) !== turma.anoLetivo) throw regra('FORA_DO_ANO', `O vínculo com ${turma.nome} precisa começar em ${turma.anoLetivo}.`);

      const novo = { de, ate };
      const daTurma = await m.find(TeacherLink, { where: { classId } });
      if (daTurma.some((v) => v.userId === userId && sobrepoe(v, novo))) {
        throw conflito('VINCULO_DUPLICADO', `${prof.nome} já tem vínculo com ${turma.nome} nesse período.`);
      }
      const titular = daTurma.find((v) => v.tipo === 'TITULAR' && sobrepoe(v, novo));
      if (tipo === 'TITULAR' && titular) {
        throw conflito('TITULAR_EXISTENTE',
          'A turma já tem titular nesse período. Encerre o vínculo da titular atual ou cadastre esta professora como substituta (as duas convivem).');
      }
      const v = await m.save(m.create(TeacherLink, { classId, userId, tipo, de, ate }));
      return { id: v.id, classId, userId, tipo, de, ate };
    });
  }

  /**
   * Cancelar vínculo que AINDA NÃO COMEÇOU (cadastro por engano): como nunca valeu, não há autoria a preservar.
   * Vínculo que já começou só pode ser encerrado.
   */
  async cancelarVinculo(u: User, id: number) {
    this.exigirCoordenacao(u);
    const hoje = this.relogio.hoje();
    return this.gravar(async (m) => {
      const v = await m.findOneBy(TeacherLink, { id });
      if (!v) throw naoEncontrado('Vínculo não encontrado.');
      if (v.de <= hoje) throw regra('VINCULO_JA_COMECOU', 'Este vínculo já começou: use "Encerrar vínculo" para preservar o histórico.');
      await m.delete(TeacherLink, { id });
      return { id, cancelado: true };
    });
  }

  /** Encerrar (não apagar): a partir do dia seguinte ao fim, a professora não registra nem corrige pelo vínculo; a autoria passada fica. */
  async encerrarVinculo(u: User, id: number, body: { ate?: unknown }) {
    this.exigirCoordenacao(u);
    const ate = data(body?.ate, 'A data de fim');
    return this.gravar(async (m) => {
      const v = await m.findOneBy(TeacherLink, { id });
      if (!v) throw naoEncontrado('Vínculo não encontrado.');
      if (ate < v.de) throw dadosInvalidos('O fim do vínculo não pode ser antes do início.');
      if (v.ate !== null && v.ate < this.relogio.hoje()) throw regra('JA_ENCERRADO', 'Este vínculo já terminou.');
      await m.update(TeacherLink, { id }, { ate });
      return { id, ate };
    });
  }
}

@Controller('gestao')
export class GestaoController {
  constructor(private readonly g: GestaoService) {}

  @Get() resumo(@UsuarioAtual() u: User) { return this.g.resumo(u); }
  @Post('alunos') criarAluno(@UsuarioAtual() u: User, @Body() b: { nome?: unknown; turmaId?: unknown; confirmarDuplicidade?: unknown }) { return this.g.criarAluno(u, b); }
  @Post('alunos/:id/nome') renomear(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number, @Body() b: { nome?: unknown }) { return this.g.renomearAluno(u, id, b); }
  @Post('alunos/:id/arquivar') arquivar(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number) { return this.g.arquivarAluno(u, id); }
  @Post('turmas') criarTurma(@UsuarioAtual() u: User, @Body() b: { nome?: unknown; etapa?: unknown; anoLetivo?: unknown }) { return this.g.criarTurma(u, b); }
  @Post('turmas/:id/excluir') excluirTurma(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number) { return this.g.excluirTurma(u, id); }
  @Post('contas') criarConta(@UsuarioAtual() u: User, @Body() b: { nome?: unknown; email?: unknown; papel?: unknown }) { return this.g.criarConta(u, b); }
  @Post('contas/:id/desativar') desativar(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number) { return this.g.definirAtiva(u, id, false); }
  @Post('contas/:id/reativar') reativar(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number) { return this.g.definirAtiva(u, id, true); }
  @Post('contas/:id/nova-senha') novaSenha(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number) { return this.g.novaSenha(u, id); }
  @Post('vinculos') criarVinculo(@UsuarioAtual() u: User, @Body() b: { classId?: unknown; userId?: unknown; tipo?: unknown; de?: unknown; ate?: unknown }) { return this.g.criarVinculo(u, b); }
  @Post('vinculos/:id/cancelar') cancelar(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number) { return this.g.cancelarVinculo(u, id); }
  @Post('vinculos/:id/encerrar') encerrar(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number, @Body() b: { ate?: unknown }) { return this.g.encerrarVinculo(u, id, b); }
}

@Module({ controllers: [GestaoController], providers: [GestaoService] })
export class GestaoModule {}

