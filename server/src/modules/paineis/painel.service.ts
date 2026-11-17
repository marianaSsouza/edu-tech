import { Controller, Get, Injectable, Module, Param, ParseIntPipe, Query } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import {
  AttentionEvent, CatalogSkill, Enrollment, ManualAttention, PedagogicalContext, PedagogicalEvent, Period, SchoolClass,
  SkillResponse, Student, User, WritingResponse, YearClosure,
} from '../../database/entities';
import { UsuarioAtual } from '../../common/auth';
import { dadosInvalidos, naoEncontrado } from '../../common/erros';
import { Relogio } from '../../common/relogio';
import { avaliarAtencao, LIMITE_LACUNAS, manualAtivaEm } from '../../domain/atencao';
import { calcularLacunas, Marcacao } from '../../domain/lacunas';
import { agregadosVisiveis, agregar, AlunoPainel, evolucaoEscrita, GRUPO_MINIMO } from '../../domain/painel';
import { bimestreSugerido, situacaoPeriodo } from '../../domain/periodo';
import { PolicyService } from '../acesso/policy.service';

interface Referencia { anoLetivo: number; bimestre: number; data: string; situacao: string }

/**
 * spec paineis-e-indicadores (tarefas 6.1–6.3): população pela matrícula na data de referência,
 * respostas só do bimestre, atenção e lacunas pelas mesmas funções da ficha (domain/), e ocultação N<5.
 */
@Injectable()
export class PainelService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  /** Visão geral: turmas do ano (coordenação: todas; professora: vinculadas hoje) com agregados ou "oculto". */
  async visaoGeral(u: User, anoParam?: number, bimestreParam?: number) {
    const anos = (await this.ds.query(`SELECT DISTINCT anoLetivo FROM turmas ORDER BY anoLetivo DESC`)).map((x: { anoLetivo: number }) => x.anoLetivo);
    const ids = this.policy.ehCoordenacao(u) ? null : await this.policy.turmasVinculadasHoje(u.id);
    const visiveis = await this.ds.getRepository(SchoolClass).find({ where: ids ? { id: In(ids) } : {}, order: { anoLetivo: 'DESC', nome: 'ASC' } });
    const anosVisiveis = anos.filter((a: number) => visiveis.some((t) => t.anoLetivo === a));
    const ano = anoParam ?? anosVisiveis[0] ?? Number(this.relogio.hoje().slice(0, 4));
    const { ref, periodos } = await this.referencia(ano, bimestreParam);
    const turmas = [];
    for (const t of visiveis.filter((x) => x.anoLetivo === ano)) {
      const r = await this.calcular(t, ref);
      turmas.push({ turma: { id: t.id, nome: t.nome, etapa: t.etapa, anoLetivo: t.anoLetivo }, N: r.N, oculto: r.oculto, indicadores: r.indicadores });
    }
    return { referencia: ref, periodos, anosDisponiveis: anosVisiveis, grupoMinimo: GRUPO_MINIMO, turmas };
  }

  /** Painel de uma turma: indicadores (ou oculto) e lista alfabética de alunos, sem ranking. */
  async turma(u: User, classId: number, bimestreParam?: number, compararParam?: number) {
    const t = await this.ds.getRepository(SchoolClass).findOneBy({ id: classId });
    if (!t) throw naoEncontrado('Turma não encontrada.');
    await this.policy.exigirLeituraTurma(u, classId);
    const { ref, periodos } = await this.referencia(t.anoLetivo, bimestreParam);
    const r = await this.calcular(t, ref);
    return {
      turma: { id: t.id, nome: t.nome, etapa: t.etapa, anoLetivo: t.anoLetivo },
      referencia: ref, periodos, grupoMinimo: GRUPO_MINIMO, limiteLacunas: LIMITE_LACUNAS,
      N: r.N, oculto: r.oculto, indicadores: r.indicadores, alunos: r.alunos,
      // nomes e áreas das habilidades do ano da turma (só para exibição; os cálculos usam os ids)
      habilidades: (await this.ds.getRepository(CatalogSkill).find({ where: { etapa: t.etapa }, order: { ordem: 'ASC' } }))
        .filter((h, i, todos) => todos.findIndex((x) => x.id === h.id) === i)
        .map((h) => ({ id: h.id, area: h.area, texto: h.texto })),
      evolucao: r.oculto || ref.situacao === 'FUTURO' ? null : await this.evolucao(r.contextos, ref.bimestre, compararParam ?? 1),
    };
  }

  /** Tarefa 8.2: compara a escrita do bimestre A (padrão: 1º) com a do selecionado (B), para os alunos da turma em B. */
  private async evolucao(contextos: number[], b: number, a: number) {
    if (a >= b) return { a, b, mensagem: 'Selecione dois bimestres distintos: o de comparação precisa ser anterior ao selecionado.' };
    const escritas = await this.ds.getRepository(WritingResponse).findBy({ contextId: In(contextos.concat(-1)), bimestre: In([a, b]) });
    const nivel = (ctx: number, bim: number) => escritas.find((e) => e.contextId === ctx && e.bimestre === bim)?.nivel ?? null;
    return { a, b, mensagem: null, ...evolucaoEscrita(contextos.map((c) => ({ a: nivel(c, a), b: nivel(c, b) }))) };
  }

  /** D06: período passado usa o último dia; período em andamento usa hoje; futuro não tem população nem indicadores. */
  private async referencia(ano: number, bimestreParam?: number): Promise<{ ref: Referencia; periodos: Array<{ bimestre: number; situacao: string }> }> {
    const hoje = this.relogio.hoje();
    const periodos = await this.ds.getRepository(Period).find({ where: { anoLetivo: ano }, order: { bimestre: 'ASC' } });
    if (!periodos.length) throw naoEncontrado(`O calendário de ${ano} não está cadastrado.`);
    const bimestre = bimestreParam ?? bimestreSugerido(periodos, hoje);
    const p = periodos.find((x) => x.bimestre === bimestre);
    if (!p) throw dadosInvalidos('Bimestre inválido.');
    const situacao = situacaoPeriodo(p, hoje);
    const data = situacao === 'FUTURO' ? p.inicio : p.fim < hoje ? p.fim : hoje;
    return {
      ref: { anoLetivo: ano, bimestre, data, situacao: p.inicio > hoje ? 'FUTURO' : p.fim < hoje ? 'ENCERRADO' : 'EM_ANDAMENTO' },
      periodos: periodos.map((x) => ({ bimestre: x.bimestre, situacao: situacaoPeriodo(x, hoje) })),
    };
  }

  private async calcular(t: SchoolClass, ref: Referencia) {
    const ds = this.ds;
    if (ref.situacao === 'FUTURO') return { N: 0, oculto: false, indicadores: null, alunos: [], contextos: [] as number[] };

    // ---- população: matrícula vigente na data de referência (transferido conta só na turma de destino) ----
    const mats = await ds.query(
      `SELECT mt.contextId AS contextId FROM matriculas mt JOIN contextos_pedagogicos c ON c.id = mt.contextId
        WHERE mt.classId = ? AND c.anoLetivo = ? AND mt.de <= ? AND (mt.ate IS NULL OR mt.ate >= ?)`,
      [t.id, ref.anoLetivo, ref.data, ref.data],
    ) as Array<{ contextId: number }>;
    const ctxs = await ds.getRepository(PedagogicalContext).findBy({ id: In(mats.map((x) => x.contextId).concat(-1)) });
    const studentIds = [...new Set(ctxs.map((c) => c.studentId))];
    const alunosDb = await ds.getRepository(Student).findBy({ id: In(studentIds.concat(-1)) });

    // ---- dados de apoio em lote ----
    const todosCtx = await ds.getRepository(PedagogicalContext).findBy({ studentId: In(studentIds.concat(-1)) });
    const todosIds = todosCtx.map((c) => c.id).concat(-1);
    const [skills, respostas, escritas, eventos, encerrados, manuais] = await Promise.all([
      ds.getRepository(CatalogSkill).find({ order: { ordem: 'ASC' } }),
      ds.getRepository(SkillResponse).findBy({ contextId: In(todosIds) }),
      ds.getRepository(WritingResponse).findBy({ contextId: In(ctxs.map((c) => c.id).concat(-1)), bimestre: ref.bimestre }),
      ds.getRepository(PedagogicalEvent).findBy({ contextId: In(todosIds) }),
      ds.getRepository(YearClosure).find(),
      ds.getRepository(ManualAttention).findBy({ studentId: In(studentIds.concat(-1)) }),
    ]);
    const eventosAtencao = await ds.getRepository(AttentionEvent).findBy({ attentionId: In(manuais.map((x) => x.id).concat(-1)) });
    const anoDoCtx = new Map(todosCtx.map((c) => [c.id, c.anoLetivo]));
    const skillsDe = (c: PedagogicalContext) => skills.filter((s) => s.etapa === c.etapa && s.catalogVersion === c.catalogVersion).map((s) => s.id);

    const alunos = [];
    const paraAgregar: AlunoPainel[] = [];
    for (const c of ctxs) {
      const s = alunosDb.find((x) => x.id === c.studentId)!;
      const ctxDoAluno = todosCtx.filter((x) => x.studentId === c.studentId);
      const ids = new Set(ctxDoAluno.map((x) => x.id));
      const marcacoes: Marcacao[] = [
        ...respostas.filter((r) => ids.has(r.contextId)).map((r) => ({
          skillId: r.skillId, contextId: r.contextId, anoLetivo: anoDoCtx.get(r.contextId)!, bimestre: r.bimestre,
          seq: r.seq, nivel: r.nivel, tipo: 'AVALIACAO' as const, autorId: r.autorId,
        })),
        ...eventos.filter((e) => ids.has(e.contextId)).map((e) => ({
          skillId: e.skillId, contextId: e.contextId, anoLetivo: anoDoCtx.get(e.contextId)!, bimestre: e.bimestre,
          seq: e.seq, nivel: e.nivel, tipo: e.tipo, autorId: e.autorId,
        })),
      ];
      const elegiveis = ctxDoAluno
        .filter((x) => x.anoLetivo < ref.anoLetivo && encerrados.some((e) => e.anoLetivo === x.anoLetivo))
        .map((x) => ({ contextId: x.id, anoLetivo: x.anoLetivo, etapa: x.etapa, skillIds: skillsDe(x) }));
      const { itens, decomposicao } = calcularLacunas({ contextosElegiveis: elegiveis, marcacoes, referencia: ref });

      const escrita = escritas.find((e) => e.contextId === c.id)?.nivel ?? null;
      // atenção manual ativa NA referência: aberta até ela e não encerrada até ela (CR-23, tarefa 5.3)
      const manuaisAtivas = manuais.filter((x) => x.studentId === c.studentId &&
        manualAtivaEm(x, eventosAtencao.filter((e) => e.attentionId === x.id), ref)).length;
      const atencao = avaliarAtencao({ lacunasPendentes: decomposicao.total, escrita, etapa: c.etapa, bimestre: ref.bimestre, manuaisAtivas });

      const skillIds = skillsDe(c);
      const respostasBim: Record<string, number> = {};
      for (const r of respostas) if (r.contextId === c.id && r.bimestre === ref.bimestre) respostasBim[r.skillId] = r.nivel;

      paraAgregar.push({ skillIds, respostas: respostasBim, escrita, atencao: atencao.estado, lacunas: itens });
      alunos.push({
        id: s.id, nome: s.nome, escrita,
        habilidadesAvaliadas: Object.keys(respostasBim).length, habilidadesPrevistas: skillIds.length,
        lacunas: decomposicao, atencao: { estado: atencao.estado, motivos: atencao.motivos, escritaAusente: atencao.escritaAusente },
      });
    }
    alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    const N = alunos.length;
    const oculto = !agregadosVisiveis(N);
    // RN13: com N < 5, nenhum agregado sai do servidor (a lista individual continua para quem pode consultar)
    return { N, oculto, indicadores: oculto ? null : agregar(paraAgregar), alunos, contextos: ctxs.map((c) => c.id) };
  }
}

const numero = (v?: string) => {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isInteger(n)) throw dadosInvalidos('Filtro inválido.');
  return n;
};

@Controller('painel')
export class PainelController {
  constructor(private readonly painel: PainelService) {}

  @Get()
  geral(@UsuarioAtual() u: User, @Query('ano') ano?: string, @Query('bimestre') bimestre?: string) {
    return this.painel.visaoGeral(u, numero(ano), numero(bimestre));
  }

  @Get('turmas/:id')
  turma(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number, @Query('bimestre') bimestre?: string, @Query('comparar') comparar?: string) {
    return this.painel.turma(u, id, numero(bimestre), numero(comparar));
  }
}

@Module({ controllers: [PainelController], providers: [PainelService] })
export class PaineisModule {}
