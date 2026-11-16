import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import {
  CatalogSkill, Enrollment, Observation, PedagogicalContext, Period, ResponseRevision, SchoolClass,
  SkillResponse, User, WritingResponse,
} from '../../database/entities';
import { nextSeq } from '../../common/sequence';
import { exclusivo } from '../../common/exclusivo';
import { conflitoVersao, dadosInvalidos, ehViolacaoUnica, ErroApi, naoEncontrado } from '../../common/erros';
import { Relogio } from '../../common/relogio';
import { decidirEscritaResposta } from '../../domain/autoria';
import { bimestreSugerido, situacaoPeriodo, SituacaoPeriodo } from '../../domain/periodo';
import { LIMITE_OBSERVACOES, verificarLimite } from '../../domain/observacoes';
import { PolicyService } from '../acesso/policy.service';

export interface RespostaDto { id: number; nivel: number; version: number; autorId: number; autorNome: string }
export interface ObservacaoDto {
  id: number; texto: string; version: number; autorId: number; autorNome: string; minha: boolean; atualizadoEm: string;
}

export interface SalvarRespostaBody { bimestre?: unknown; nivel?: unknown; version?: unknown; justificativa?: unknown }

const inteiro = (v: unknown, min: number, max: number, campo: string): number => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    throw dadosInvalidos(`${campo} deve ser um número inteiro de ${min} a ${max}.`);
  }
  return n;
};
const versaoOpcional = (v: unknown): number | null => (v === undefined || v === null ? null : inteiro(v, 1, Number.MAX_SAFE_INTEGER, 'version'));
const textoOpcional = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/**
 * spec avaliacao-bimestral (tarefas 3.1–3.3, 3.5): leitura da avaliação por bimestre e gravação de
 * habilidade, escrita e observações. Toda gravação: mutex → transação → autorização → regra de autoria.
 */
@Injectable()
export class AvaliacaoService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  // ---------------------------------------------------------------- leitura

  async ler(u: User, studentId: number, anoParam?: number, bimestreParam?: number) {
    await this.policy.exigirLeituraAluno(u, studentId);
    const ds = this.ds;
    const hoje = this.relogio.hoje();

    const contextos = await ds.getRepository(PedagogicalContext).find({
      where: { studentId }, relations: { student: true }, order: { anoLetivo: 'ASC', id: 'ASC' },
    });
    if (!contextos.length) throw naoEncontrado('Este aluno ainda não tem contexto pedagógico.');
    const ctx = anoParam ? contextos.filter((c) => c.anoLetivo === anoParam).pop() : contextos[contextos.length - 1];
    if (!ctx) throw naoEncontrado(`Não há registro deste aluno em ${anoParam}.`);

    const periodos = await ds.getRepository(Period).find({ where: { anoLetivo: ctx.anoLetivo }, order: { bimestre: 'ASC' } });
    if (!periodos.length) throw naoEncontrado(`O calendário de ${ctx.anoLetivo} não está cadastrado.`);
    const bimestre = bimestreParam ?? bimestreSugerido(periodos, hoje);
    const periodo = periodos.find((p) => p.bimestre === bimestre);
    if (!periodo) throw naoEncontrado(`O ${bimestre}º bimestre de ${ctx.anoLetivo} não está no calendário.`);

    const turma = await this.turmaDoContexto(ds.manager, ctx.id);
    const permissao = await this.policy.avaliarEscrita(u, ctx, bimestre);

    const skills = await ds.getRepository(CatalogSkill).find({
      where: { etapa: ctx.etapa, catalogVersion: ctx.catalogVersion }, order: { ordem: 'ASC' },
    });
    const respostas = await ds.getRepository(SkillResponse).find({
      where: { contextId: ctx.id, bimestre }, relations: { autor: true },
    });
    const escrita = await ds.getRepository(WritingResponse).findOne({
      where: { contextId: ctx.id, bimestre }, relations: { autor: true },
    });
    const observacoes = await ds.getRepository(Observation).find({
      where: { contextId: ctx.id, bimestre, vigente: true }, relations: { autor: true }, order: { criadoEm: 'ASC', id: 'ASC' },
    });
    const usado = verificarLimite(observacoes, '').usado;

    return {
      aluno: { id: ctx.student.id, nome: ctx.student.nome },
      contexto: { id: ctx.id, anoLetivo: ctx.anoLetivo, etapa: ctx.etapa, catalogo: ctx.catalogVersion, turma },
      contextosDisponiveis: contextos.map((c) => ({ id: c.id, anoLetivo: c.anoLetivo, etapa: c.etapa })),
      periodo: this.periodoDto(periodo, hoje),
      periodos: periodos.map((p) => this.periodoDto(p, hoje)),
      permissao: { podeEditar: permissao.pode, codigo: permissao.codigo, motivo: permissao.motivo },
      habilidades: skills.map((s) => {
        const r = respostas.find((x) => x.skillId === s.id);
        return { id: s.id, area: s.area, texto: s.texto, exemplo: s.exemplo, resposta: r ? this.respostaDto(r, r.autor) : null };
      }),
      escrita: escrita ? this.respostaDto(escrita, escrita.autor) : null,
      observacoes: observacoes.map((o) => this.observacaoDto(o, o.autor, u.id)),
      limiteObservacoes: { usado, max: LIMITE_OBSERVACOES },
    };
  }

  // ---------------------------------------------------------------- gravação de respostas

  async salvarHabilidade(u: User, contextId: number, skillId: string, body: SalvarRespostaBody) {
    const bimestre = inteiro(body?.bimestre, 1, 4, 'bimestre');
    const nivel = inteiro(body?.nivel, 0, 2, 'nivel');
    return this.gravar(async (m) => {
      const ctx = await this.contextoOu404(m, contextId);
      const skill = await m.findOneBy(CatalogSkill, { id: skillId, catalogVersion: ctx.catalogVersion });
      if (!skill || skill.etapa !== ctx.etapa) {
        throw dadosInvalidos(`A habilidade ${skillId} não pertence ao catálogo ${ctx.catalogVersion} da etapa ${ctx.etapa}.`);
      }
      await this.policy.exigirEscrita(u, ctx, bimestre, m);
      const existente = await m.findOneBy(SkillResponse, { contextId, skillId, bimestre });
      const salvo = await this.criarOuCorrigir(m, u, 'HABILIDADE', existente, nivel, body, async () => {
        await m.insert(SkillResponse, {
          contextId, skillId, catalogVersion: ctx.catalogVersion, bimestre, nivel, autorId: u.id, seq: await nextSeq(m),
        });
        return m.findOneByOrFail(SkillResponse, { contextId, skillId, bimestre });
      });
      return { skillId, resposta: salvo };
    });
  }

  async salvarEscrita(u: User, contextId: number, body: SalvarRespostaBody) {
    const bimestre = inteiro(body?.bimestre, 1, 4, 'bimestre');
    const nivel = inteiro(body?.nivel, 0, 3, 'nivel');
    return this.gravar(async (m) => {
      const ctx = await this.contextoOu404(m, contextId);
      await this.policy.exigirEscrita(u, ctx, bimestre, m);
      const existente = await m.findOneBy(WritingResponse, { contextId, bimestre });
      const salvo = await this.criarOuCorrigir(m, u, 'ESCRITA', existente, nivel, body, async () => {
        await m.insert(WritingResponse, { contextId, bimestre, nivel, autorId: u.id });
        return m.findOneByOrFail(WritingResponse, { contextId, bimestre });
      });
      return { escrita: salvo };
    });
  }

  /**
   * Tarefa 3.4 (RF-13, cenário "Limpeza de resposta"): a autora atualmente vinculada limpa, com justificativa,
   * uma resposta equivocada em período aberto. A vigente passa a "Sem avaliação" (ausência = sem linha, D08)
   * e a versão anterior fica em ResponseRevision com nivelNovo = null. Ausência não é regressão.
   */
  async limpar(u: User, contextId: number, alvo: { tipo: 'HABILIDADE'; skillId: string } | { tipo: 'ESCRITA' }, body: SalvarRespostaBody) {
    const bimestre = inteiro(body?.bimestre, 1, 4, 'bimestre');
    const versao = versaoOpcional(body?.version);
    if (versao === null) throw dadosInvalidos('Informe a versão da resposta que será limpa.');
    const justificativa = textoOpcional(body?.justificativa);
    return this.gravar(async (m) => {
      const ctx = await this.contextoOu404(m, contextId);
      await this.policy.exigirEscrita(u, ctx, bimestre, m);
      const Entidade = alvo.tipo === 'HABILIDADE' ? SkillResponse : WritingResponse;
      const existente = alvo.tipo === 'HABILIDADE'
        ? await m.findOneBy(SkillResponse, { contextId, skillId: alvo.skillId, bimestre })
        : await m.findOneBy(WritingResponse, { contextId, bimestre });
      if (!existente) throw conflitoVersao('Esta resposta já não existe. Atualize a tela e confira.');
      const decisao = decidirEscritaResposta({ existente, usuarioId: u.id, versaoRecebida: versao, justificativa });
      if (!decisao.ok) throw new ErroApi(decisao.status, decisao.codigo, decisao.mensagem);

      await m.insert(ResponseRevision, {
        tipo: alvo.tipo, responseId: existente.id, versaoAnterior: existente.version, nivelAnterior: existente.nivel, nivelNovo: null,
        contextId, skillId: alvo.tipo === 'HABILIDADE' ? alvo.skillId : null, bimestre, autorId: u.id, justificativa: justificativa!.trim(),
      });
      const r = await m.delete(Entidade, { id: existente.id, version: existente.version });
      if (r.affected !== 1) throw conflitoVersao();
      return { limpa: true, tipo: alvo.tipo, ...(alvo.tipo === 'HABILIDADE' ? { skillId: alvo.skillId } : {}), bimestre };
    });
  }

  /** D03/D04: cria, ou corrige preservando a versão anterior em ResponseRevision (mesma transação). */
  private async criarOuCorrigir(
    m: EntityManager,
    u: User,
    tipo: 'HABILIDADE' | 'ESCRITA',
    existente: SkillResponse | WritingResponse | null,
    nivel: number,
    body: SalvarRespostaBody,
    criar: () => Promise<SkillResponse | WritingResponse>,
  ): Promise<RespostaDto> {
    const versaoRecebida = versaoOpcional(body?.version);
    const justificativa = textoOpcional(body?.justificativa);

    // Nada mudou: devolve a resposta como está, sem criar revisão.
    if (existente && existente.autorId === u.id && versaoRecebida === existente.version && existente.nivel === nivel) {
      return this.respostaDto(existente, u);
    }
    const decisao = decidirEscritaResposta({ existente, usuarioId: u.id, versaoRecebida, justificativa });
    if (!decisao.ok) throw new ErroApi(decisao.status, decisao.codigo, decisao.mensagem);

    if (decisao.acao === 'CRIAR') return this.respostaDto(await criar(), u);

    const e = existente!;
    await m.insert(ResponseRevision, {
      tipo, responseId: e.id, versaoAnterior: e.version, nivelAnterior: e.nivel, nivelNovo: nivel,
      contextId: e.contextId, skillId: tipo === 'HABILIDADE' ? (e as SkillResponse).skillId : null, bimestre: e.bimestre,
      autorId: u.id, justificativa: justificativa!.trim(),
    });
    const Entidade = tipo === 'HABILIDADE' ? SkillResponse : WritingResponse;
    const r = await m.update(Entidade, { id: e.id, version: e.version }, { nivel, version: e.version + 1 });
    if (r.affected !== 1) throw conflitoVersao();
    return this.respostaDto(await m.findOneByOrFail(Entidade, { id: e.id }), u);
  }

  // ---------------------------------------------------------------- observações

  async criarObservacao(u: User, contextId: number, body: { bimestre?: unknown; texto?: unknown }) {
    const bimestre = inteiro(body?.bimestre, 1, 4, 'bimestre');
    const texto = this.textoObservacao(body?.texto);
    return this.gravar(async (m) => {
      const ctx = await this.contextoOu404(m, contextId);
      await this.policy.exigirEscrita(u, ctx, bimestre, m);
      const vigentes = await m.findBy(Observation, { contextId, bimestre, vigente: true });
      this.exigirLimite(verificarLimite(vigentes, texto));
      const { identifiers } = await m.insert(Observation, { contextId, bimestre, autorId: u.id, texto, vigente: true });
      const obs = await m.findOneByOrFail(Observation, { id: identifiers[0].id });
      return { observacao: this.observacaoDto(obs, u, u.id) };
    });
  }

  /** Só a autora edita; o texto antigo vira linha `vigente = false` (não consome o limite) e a principal sobe de versão. */
  async editarObservacao(u: User, id: number, body: { texto?: unknown; version?: unknown }) {
    const texto = this.textoObservacao(body?.texto);
    const versao = versaoOpcional(body?.version);
    if (versao === null) throw dadosInvalidos('Informe a versão da observação que está sendo editada.');
    return this.gravar(async (m) => {
      const obs = await m.findOneBy(Observation, { id, vigente: true });
      if (!obs) throw naoEncontrado('Observação não encontrada.');
      const ctx = await this.contextoOu404(m, obs.contextId);
      await this.policy.exigirEscrita(u, ctx, obs.bimestre, m);
      if (obs.autorId !== u.id) {
        throw new ErroApi(403, 'AUTORIA', 'Só a autora pode corrigir esta observação. Você pode acrescentar uma observação própria.');
      }
      if (obs.version !== versao) throw conflitoVersao('Esta observação mudou desde que a tela foi aberta. Atualize a tela e confira.');
      if (obs.texto === texto) return { observacao: this.observacaoDto(obs, u, u.id) };
      const vigentes = await m.findBy(Observation, { contextId: obs.contextId, bimestre: obs.bimestre, vigente: true });
      this.exigirLimite(verificarLimite(vigentes, texto, obs.id));
      await m.insert(Observation, {
        contextId: obs.contextId, bimestre: obs.bimestre, autorId: obs.autorId, texto: obs.texto, vigente: false,
      });
      const r = await m.update(Observation, { id: obs.id, version: obs.version }, { texto, version: obs.version + 1 });
      if (r.affected !== 1) throw conflitoVersao();
      return { observacao: this.observacaoDto(await m.findOneByOrFail(Observation, { id: obs.id }), u, u.id) };
    });
  }

  // ---------------------------------------------------------------- apoio

  /** Uma gravação por vez (mutex) dentro de transação; violação UNIQUE vira 409 (CA-13.5). */
  private async gravar<T>(fn: (m: EntityManager) => Promise<T>): Promise<T> {
    try {
      return await exclusivo(() => this.ds.transaction(fn));
    } catch (e) {
      if (ehViolacaoUnica(e)) throw conflitoVersao();
      throw e;
    }
  }

  private textoObservacao(v: unknown): string {
    if (typeof v !== 'string' || !v.trim()) throw dadosInvalidos('Escreva o texto da observação.');
    return v.trim();
  }

  private exigirLimite(r: { cabe: boolean; usado: number; max: number }) {
    if (!r.cabe) {
      throw new ErroApi(422, 'LIMITE_OBSERVACOES',
        `As observações deste aluno no bimestre somariam ${r.usado} caracteres; o limite é ${r.max}. Encurte o texto.`);
    }
  }

  private async contextoOu404(m: EntityManager, id: number): Promise<PedagogicalContext> {
    const ctx = await m.findOneBy(PedagogicalContext, { id });
    if (!ctx) throw naoEncontrado('Contexto pedagógico não encontrado.');
    return ctx;
  }

  /** Turma da matrícula mais recente do contexto (mostra a origem em caso de transferência). */
  private async turmaDoContexto(m: EntityManager, contextId: number) {
    const mats = await m.find(Enrollment, { where: { contextId }, order: { de: 'DESC', id: 'DESC' } });
    if (!mats.length) return null;
    const turmas = await m.findBy(SchoolClass, { id: In(mats.map((x) => x.classId)) });
    const t = turmas.find((x) => x.id === mats[0].classId)!;
    return { id: t.id, nome: t.nome };
  }

  private periodoDto(p: Period, hoje: string): {
    bimestre: number; inicio: string; fim: string; estado: string; situacao: SituacaoPeriodo;
  } {
    return { bimestre: p.bimestre, inicio: p.inicio, fim: p.fim, estado: p.estado, situacao: situacaoPeriodo(p, hoje) };
  }

  private respostaDto(r: SkillResponse | WritingResponse, autor: User | null | undefined): RespostaDto {
    return { id: r.id, nivel: r.nivel, version: r.version, autorId: r.autorId, autorNome: autor?.id === r.autorId ? autor.nome : '' };
  }

  private observacaoDto(o: Observation, autor: User, usuarioId: number): ObservacaoDto {
    return {
      id: o.id, texto: o.texto, version: o.version, autorId: o.autorId, autorNome: autor?.nome ?? '',
      minha: o.autorId === usuarioId, atualizadoEm: new Date(o.atualizadoEm).toISOString(),
    };
  }
}
