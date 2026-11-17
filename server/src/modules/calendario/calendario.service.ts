import { Body, Controller, Get, Injectable, Module, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import {
  CalendarEvent, CatalogSkill, PedagogicalContext, Period, SchoolClass, SkillResponse, TipoEventoCalendario, User, WritingResponse, YearClosure,
} from '../../database/entities';
import { UsuarioAtual } from '../../common/auth';
import { acessoNegado, dadosInvalidos, ErroApi, naoEncontrado } from '../../common/erros';
import { exclusivo } from '../../common/exclusivo';
import { Relogio } from '../../common/relogio';
import { situacaoPeriodo } from '../../domain/periodo';
import { PolicyService } from '../acesso/policy.service';

/**
 * Tarefa 7.3 — spec calendario-letivo (RF-13, CA-13.2/13.3, D06).
 * Coordenação fecha e reabre bimestres e o ano, sempre com justificativa e trilha.
 * Fechar aceita registros incompletos (mostra as ausências antes); ano só fecha com os quatro bimestres fechados;
 * reabrir bimestre de ano fechado exige reabrir o ano. Reabrir o ano NÃO retira a herança (anos_encerrados fica).
 */
@Injectable()
export class CalendarioService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  /** Todos consultam datas e situação dos bimestres; só a coordenação vê a trilha e age (fechar/reabrir). */
  async visao(u: User) {
    const coord = this.policy.ehCoordenacao(u);
    const hoje = this.relogio.hoje();
    const periodos = await this.ds.getRepository(Period).find({ order: { anoLetivo: 'DESC', bimestre: 'ASC' } });
    const eventos = await this.ds.getRepository(CalendarEvent).find({ order: { id: 'DESC' } });
    const usuarios = await this.ds.getRepository(User).find();
    const anos = [...new Set(periodos.map((p) => p.anoLetivo))];
    const resultado = [];
    for (const ano of anos) {
      resultado.push({
        anoLetivo: ano,
        anoFechado: await this.anoFechado(this.ds.manager, ano),
        jaEncerradoAlgumaVez: await this.ds.getRepository(YearClosure).existsBy({ anoLetivo: ano }),
        periodos: periodos.filter((p) => p.anoLetivo === ano).map((p) => ({
          bimestre: p.bimestre, inicio: p.inicio, fim: p.fim, estado: p.estado, situacao: situacaoPeriodo(p, hoje), justificativa: coord ? p.justificativa : null,
        })),
        trilha: eventos.filter((e) => coord && e.anoLetivo === ano).map((e) => ({
          id: e.id, tipo: e.tipo, bimestre: e.bimestre, justificativa: e.justificativa,
          autorNome: usuarios.find((x) => x.id === e.autorId)?.nome ?? '—', em: new Date(e.criadoEm).toISOString(),
        })),
      });
    }
    return { podeGerenciar: coord, anos: resultado };
  }

  /** CA-13.2: antes de fechar, a coordenação vê o que está sem avaliação em cada turma. */
  async ausencias(u: User, ano: number, bimestre: number) {
    this.exigirCoordenacao(u);
    const p = await this.periodo(this.ds.manager, ano, bimestre);
    const hoje = this.relogio.hoje();
    const ref = p.fim < hoje ? p.fim : hoje;
    const turmas = await this.ds.getRepository(SchoolClass).find({ where: { anoLetivo: ano }, order: { nome: 'ASC' } });
    const resultado = [];
    for (const t of turmas) {
      const ctxIds: number[] = (await this.ds.query(
        `SELECT mt.contextId AS id FROM matriculas mt WHERE mt.classId = ? AND mt.de <= ? AND (mt.ate IS NULL OR mt.ate >= ?)`,
        [t.id, ref, ref],
      )).map((x: { id: number }) => x.id);
      const ctxs = ctxIds.length ? await this.ds.getRepository(PedagogicalContext).findBy({ id: In(ctxIds) }) : [];
      let previstos = 0;
      let avaliados = 0;
      let semEscrita = 0;
      for (const c of ctxs) {
        previstos += await this.ds.getRepository(CatalogSkill).countBy({ etapa: c.etapa, catalogVersion: c.catalogVersion });
        avaliados += await this.ds.getRepository(SkillResponse).countBy({ contextId: c.id, bimestre });
        if (!(await this.ds.getRepository(WritingResponse).existsBy({ contextId: c.id, bimestre }))) semEscrita++;
      }
      resultado.push({ turma: { id: t.id, nome: t.nome }, alunos: ctxs.length, paresPrevistos: previstos, paresSemAvaliacao: previstos - avaliados, alunosSemEscrita: semEscrita });
    }
    return { anoLetivo: ano, bimestre, turmas: resultado };
  }

  fecharBimestre(u: User, ano: number, bimestre: number, justificativa: unknown) {
    return this.acao(u, justificativa, async (m, just) => {
      const p = await this.periodo(m, ano, bimestre);
      if (situacaoPeriodo(p, this.relogio.hoje()) === 'FUTURO') throw regra('PERIODO_FUTURO', 'Este bimestre ainda não começou; não pode ser fechado.');
      if (p.estado === 'FECHADO') throw regra('JA_FECHADO', 'Este bimestre já está fechado.');
      await m.update(Period, { id: p.id }, { estado: 'FECHADO', justificativa: just });
      await this.registrar(m, ano, bimestre, 'FECHAR_BIMESTRE', just, u);
    });
  }

  reabrirBimestre(u: User, ano: number, bimestre: number, justificativa: unknown) {
    return this.acao(u, justificativa, async (m, just) => {
      const p = await this.periodo(m, ano, bimestre);
      if (p.estado !== 'FECHADO') throw regra('NAO_FECHADO', 'Este bimestre não está fechado.');
      if (await this.anoFechado(m, ano)) throw regra('ANO_FECHADO', `O ano letivo ${ano} está fechado. Reabra o ano antes de reabrir um bimestre.`);
      await m.update(Period, { id: p.id }, { estado: 'REABERTO', justificativa: just });
      await this.registrar(m, ano, bimestre, 'REABRIR_BIMESTRE', just, u);
    });
  }

  fecharAno(u: User, ano: number, justificativa: unknown) {
    return this.acao(u, justificativa, async (m, just) => {
      const periodos = await m.findBy(Period, { anoLetivo: ano });
      if (!periodos.length) throw naoEncontrado(`O calendário de ${ano} não está cadastrado.`);
      if (await this.anoFechado(m, ano)) throw regra('JA_FECHADO', `O ano letivo ${ano} já está fechado.`);
      const abertos = periodos.filter((p) => p.estado !== 'FECHADO').map((p) => `${p.bimestre}º`);
      if (periodos.length < 4 || abertos.length) {
        throw regra('BIMESTRE_ABERTO', `Para fechar o ano, os quatro bimestres precisam estar fechados. Ainda abertos: ${abertos.join(', ')}.`);
      }
      // D06: registra que o ano JÁ FOI encerrado (mantém a primeira data se já existir)
      if (!(await m.existsBy(YearClosure, { anoLetivo: ano }))) await m.insert(YearClosure, { anoLetivo: ano });
      await this.registrar(m, ano, null, 'FECHAR_ANO', just, u);
    });
  }

  reabrirAno(u: User, ano: number, justificativa: unknown) {
    return this.acao(u, justificativa, async (m, just) => {
      if (!(await this.anoFechado(m, ano))) throw regra('NAO_FECHADO', `O ano letivo ${ano} não está fechado.`);
      // anos_encerrados NÃO é apagado: as habilidades continuam elegíveis para herança (D06)
      await this.registrar(m, ano, null, 'REABRIR_ANO', just, u);
    });
  }

  // ---------------------------------------------------------------- apoio

  /** Ano fechado agora = já encerrado e a última ação sobre o ano não foi reabertura. */
  private async anoFechado(m: EntityManager, ano: number): Promise<boolean> {
    if (!(await m.existsBy(YearClosure, { anoLetivo: ano }))) return false;
    const ultima = await m.findOne(CalendarEvent, {
      where: [{ anoLetivo: ano, tipo: 'FECHAR_ANO' }, { anoLetivo: ano, tipo: 'REABRIR_ANO' }], order: { id: 'DESC' },
    });
    return !ultima || ultima.tipo === 'FECHAR_ANO';
  }

  private async acao(u: User, justificativa: unknown, fn: (m: EntityManager, just: string) => Promise<void>) {
    this.exigirCoordenacao(u);
    if (typeof justificativa !== 'string' || !justificativa.trim()) throw dadosInvalidos('Informe a justificativa.');
    if (Array.from(justificativa.trim()).length > 2000) throw dadosInvalidos('A justificativa pode ter no máximo 2000 caracteres.');
    await exclusivo(() => this.ds.transaction((m) => fn(m, justificativa.trim())));
    return { ok: true };
  }

  private registrar(m: EntityManager, ano: number, bimestre: number | null, tipo: TipoEventoCalendario, justificativa: string, u: User) {
    return m.insert(CalendarEvent, { anoLetivo: ano, bimestre, tipo, justificativa, autorId: u.id });
  }

  private async periodo(m: EntityManager, ano: number, bimestre: number) {
    const p = await m.findOneBy(Period, { anoLetivo: ano, bimestre });
    if (!p) throw naoEncontrado(`O ${bimestre}º bimestre de ${ano} não está no calendário.`);
    return p;
  }

  private exigirCoordenacao(u: User) {
    if (!this.policy.ehCoordenacao(u)) throw acessoNegado('Somente a coordenação gerencia o calendário.');
  }
}

const regra = (codigo: string, mensagem: string) => new ErroApi(422, codigo, mensagem);

@Controller('calendario')
export class CalendarioController {
  constructor(private readonly cal: CalendarioService) {}

  @Get()
  visao(@UsuarioAtual() u: User) {
    return this.cal.visao(u);
  }

  @Get(':ano/bimestres/:bim/ausencias')
  ausencias(@UsuarioAtual() u: User, @Param('ano', ParseIntPipe) ano: number, @Param('bim', ParseIntPipe) bim: number) {
    return this.cal.ausencias(u, ano, bim);
  }

  @Post(':ano/bimestres/:bim/fechar')
  fecharBimestre(@UsuarioAtual() u: User, @Param('ano', ParseIntPipe) ano: number, @Param('bim', ParseIntPipe) bim: number, @Body() b: { justificativa?: unknown }) {
    return this.cal.fecharBimestre(u, ano, bim, b?.justificativa);
  }

  @Post(':ano/bimestres/:bim/reabrir')
  reabrirBimestre(@UsuarioAtual() u: User, @Param('ano', ParseIntPipe) ano: number, @Param('bim', ParseIntPipe) bim: number, @Body() b: { justificativa?: unknown }) {
    return this.cal.reabrirBimestre(u, ano, bim, b?.justificativa);
  }

  @Post(':ano/fechar')
  fecharAno(@UsuarioAtual() u: User, @Param('ano', ParseIntPipe) ano: number, @Body() b: { justificativa?: unknown }) {
    return this.cal.fecharAno(u, ano, b?.justificativa);
  }

  @Post(':ano/reabrir')
  reabrirAno(@UsuarioAtual() u: User, @Param('ano', ParseIntPipe) ano: number, @Body() b: { justificativa?: unknown }) {
    return this.cal.reabrirAno(u, ano, b?.justificativa);
  }
}

@Module({ controllers: [CalendarioController], providers: [CalendarioService] })
export class CalendarioModule {}
