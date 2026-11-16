import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import {
  AttentionEvent, CatalogSkill, Enrollment, ManualAttention, Observation, PedagogicalContext, PedagogicalEvent, Period, ResponseRevision,
  SchoolClass, SkillResponse, TeacherLink, User, WritingResponse, YearClosure,
} from '../../database/entities';
import { naoEncontrado } from '../../common/erros';
import { Relogio } from '../../common/relogio';
import { bimestreSugerido, situacaoPeriodo } from '../../domain/periodo';
import { calcularLacunas, Marcacao, resumoAnual, ultimaObservacao } from '../../domain/lacunas';
import { avaliarAtencao, LIMITE_LACUNAS } from '../../domain/atencao';
import { PolicyService } from '../acesso/policy.service';

interface Revisao { versaoAnterior: number; nivelAnterior: number | null; nivelNovo: number | null; autorNome: string; justificativa: string; em: string }
interface Celula { nivel: number; autorNome: string; revisoes: Revisao[] }

/**
 * spec historico-pedagogico + lacunas-herdadas (tarefas 4.1, 4.2): ficha do aluno com linha do tempo por ano,
 * resumo anual, revisões identificadas e lacunas herdadas na referência atual. Somente leitura.
 */
@Injectable()
export class FichaService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  async ficha(u: User, studentId: number) {
    await this.policy.exigirLeituraAluno(u, studentId);
    const ds = this.ds;
    const hoje = this.relogio.hoje();

    const contextos = await ds.getRepository(PedagogicalContext).find({
      where: { studentId }, relations: { student: true }, order: { anoLetivo: 'ASC', id: 'ASC' },
    });
    if (!contextos.length) throw naoEncontrado('Este aluno ainda não tem contexto pedagógico.');
    const ctxIds = contextos.map((c) => c.id);
    const anos = [...new Set(contextos.map((c) => c.anoLetivo))];

    const [usuarios, periodos, encerrados, skills, respostas, escritas, observacoes, eventos, matriculas] = await Promise.all([
      ds.getRepository(User).find(),
      ds.getRepository(Period).find({ where: { anoLetivo: In(anos) }, order: { bimestre: 'ASC' } }),
      ds.getRepository(YearClosure).find(),
      ds.getRepository(CatalogSkill).find({ order: { ordem: 'ASC' } }),
      ds.getRepository(SkillResponse).findBy({ contextId: In(ctxIds) }),
      ds.getRepository(WritingResponse).findBy({ contextId: In(ctxIds) }),
      ds.getRepository(Observation).find({ where: { contextId: In(ctxIds), vigente: true }, order: { id: 'ASC' } }),
      ds.getRepository(PedagogicalEvent).find({ where: { contextId: In(ctxIds) }, order: { seq: 'ASC' } }),
      ds.getRepository(Enrollment).find({ where: { contextId: In(ctxIds) }, order: { de: 'ASC' } }),
    ]);
    const nome = (id: number) => usuarios.find((x) => x.id === id)?.nome ?? '—';
    const revisoes = await ds.getRepository(ResponseRevision).find({
      where: [
        { tipo: 'HABILIDADE', responseId: In(respostas.map((r) => r.id).concat(-1)) },
        { tipo: 'ESCRITA', responseId: In(escritas.map((r) => r.id).concat(-1)) },
      ],
      order: { id: 'ASC' },
    });
    const revDe = (tipo: 'HABILIDADE' | 'ESCRITA', id: number): Revisao[] =>
      revisoes.filter((r) => r.tipo === tipo && r.responseId === id).map((r) => ({
        versaoAnterior: r.versaoAnterior, nivelAnterior: r.nivelAnterior, nivelNovo: r.nivelNovo,
        autorNome: nome(r.autorId), justificativa: r.justificativa, em: new Date(r.criadoEm).toISOString(),
      }));
    const turmas = await ds.getRepository(SchoolClass).findBy({ id: In(matriculas.map((m) => m.classId).concat(-1)) });
    const vinculos = await ds.getRepository(TeacherLink).findBy({ classId: In(turmas.map((t) => t.id).concat(-1)) });

    // ---- marcações (avaliações vigentes + eventos), base de resumo anual e lacunas ----
    const anoDoCtx = new Map(contextos.map((c) => [c.id, c.anoLetivo]));
    const marcacoes: Marcacao[] = [
      ...respostas.map((r) => ({
        skillId: r.skillId, contextId: r.contextId, anoLetivo: anoDoCtx.get(r.contextId)!, bimestre: r.bimestre,
        seq: r.seq, nivel: r.nivel, tipo: 'AVALIACAO' as const, autorId: r.autorId,
      })),
      ...eventos.map((e) => ({
        skillId: e.skillId, contextId: e.contextId, anoLetivo: anoDoCtx.get(e.contextId)!, bimestre: e.bimestre,
        seq: e.seq, nivel: e.nivel, tipo: e.tipo, autorId: e.autorId,
      })),
    ];

    // ---- linha do tempo por contexto ----
    const linhaDoTempo = contextos.map((c) => {
      const doAno = periodos.filter((p) => p.anoLetivo === c.anoLetivo);
      const skillsCtx = skills.filter((s) => s.etapa === c.etapa && s.catalogVersion === c.catalogVersion);
      const resumo = resumoAnual(skillsCtx.map((s) => s.id), marcacoes.filter((m) => m.contextId === c.id));
      const mats = matriculas.filter((m) => m.contextId === c.id);
      const turmasCtx = mats.map((m) => {
        const t = turmas.find((x) => x.id === m.classId)!;
        return { id: t.id, nome: t.nome, de: m.de, ate: m.ate };
      });
      const professoras = vinculos
        .filter((v) => mats.some((m) => m.classId === v.classId))
        .map((v) => ({ nome: nome(v.userId), tipo: v.tipo, de: v.de, ate: v.ate }));
      const obsCtx = observacoes.filter((o) => o.contextId === c.id);
      const ultima = ultimaObservacao(obsCtx.map((o) => ({ ...o, ordem: o.id })));

      return {
        contexto: { id: c.id, anoLetivo: c.anoLetivo, etapa: c.etapa, catalogo: c.catalogVersion },
        turmas: turmasCtx,
        professoras,
        periodos: doAno.map((p) => ({ bimestre: p.bimestre, estado: p.estado, situacao: situacaoPeriodo(p, hoje) })),
        anoEncerrado: encerrados.some((e) => e.anoLetivo === c.anoLetivo),
        habilidades: skillsCtx.map((s) => {
          const porBimestre: Array<Celula | null> = [1, 2, 3, 4].map((b) => {
            const r = respostas.find((x) => x.contextId === c.id && x.skillId === s.id && x.bimestre === b);
            return r ? { nivel: r.nivel, autorNome: nome(r.autorId), revisoes: revDe('HABILIDADE', r.id) } : null;
          });
          const ra = resumo.get(s.id);
          return { id: s.id, area: s.area, texto: s.texto, porBimestre, resumoAnual: ra ? { nivel: ra.nivel, bimestre: ra.bimestre } : null };
        }),
        escrita: [1, 2, 3, 4].map((b) => {
          const r = escritas.find((x) => x.contextId === c.id && x.bimestre === b);
          return r ? { nivel: r.nivel, autorNome: nome(r.autorId), revisoes: revDe('ESCRITA', r.id) } : null;
        }),
        observacoes: obsCtx.map((o) => ({ id: o.id, bimestre: o.bimestre, texto: o.texto, autorNome: nome(o.autorId) })),
        ultimaObservacao: ultima ? { bimestre: ultima.bimestre, texto: ultima.texto, autorNome: nome(ultima.autorId) } : null,
      };
    });

    // ---- lacunas herdadas na referência atual (contexto mais recente, bimestre em andamento) ----
    const atual = contextos[contextos.length - 1];
    const referencia = { anoLetivo: atual.anoLetivo, bimestre: bimestreSugerido(periodos.filter((p) => p.anoLetivo === atual.anoLetivo), hoje) };
    const elegiveis = contextos
      .filter((c) => c.anoLetivo < atual.anoLetivo && encerrados.some((e) => e.anoLetivo === c.anoLetivo))
      .map((c) => ({
        contextId: c.id, anoLetivo: c.anoLetivo, etapa: c.etapa,
        skillIds: skills.filter((s) => s.etapa === c.etapa && s.catalogVersion === c.catalogVersion).map((s) => s.id),
      }));
    const { itens, decomposicao } = calcularLacunas({ contextosElegiveis: elegiveis, marcacoes, referencia });
    const textoSkill = (id: string) => skills.find((s) => s.id === id)?.texto ?? '';

    // ---- atenção pedagógica na referência atual (RN08/RN09) ----
    const manuais = await ds.getRepository(ManualAttention).find({ where: { studentId }, order: { id: 'ASC' } });
    const eventosAtencao = await ds.getRepository(AttentionEvent).find({
      where: { attentionId: In(manuais.map((x) => x.id).concat(-1)) }, order: { id: 'ASC' },
    });
    const escritaRef = escritas.find((e) => e.contextId === atual.id && e.bimestre === referencia.bimestre) ?? null;
    const avaliacaoAtencao = avaliarAtencao({
      lacunasPendentes: decomposicao.total,
      escrita: escritaRef ? escritaRef.nivel : null,
      etapa: atual.etapa,
      bimestre: referencia.bimestre,
      manuaisAtivas: manuais.filter((x) => x.situacao === 'ABERTA').length,
    });
    const podeAgir = !this.policy.ehCoordenacao(u) && (await this.policy.temVinculoAtualComAluno(u.id, studentId));

    return {
      atencao: {
        referencia: { ...referencia, etapa: atual.etapa },
        ...avaliacaoAtencao,
        escrita: escritaRef ? escritaRef.nivel : null,
        lacunasPendentes: decomposicao.total,
        limiteLacunas: LIMITE_LACUNAS,
        podeAgir,
        manuais: manuais.map((x) => ({
          id: x.id, justificativa: x.justificativa, situacao: x.situacao, autorNome: nome(x.autorId),
          anoLetivo: x.anoLetivo, bimestre: x.bimestre, em: new Date(x.criadoEm).toISOString(),
          eventos: eventosAtencao.filter((e) => e.attentionId === x.id).map((e) => ({
            id: e.id, tipo: e.tipo, texto: e.texto, autorNome: nome(e.autorId), em: new Date(e.criadoEm).toISOString(),
          })),
        })),
      },
      aluno: { id: atual.student.id, nome: atual.student.nome },
      // RN14: ingressante depois do 1º ano sem contexto anterior conhecido → limitação explícita, sem lacunas inventadas
      historicoAnteriorIndisponivel: contextos[0].etapa > 1,
      linhaDoTempo,
      lacunas: {
        referencia,
        decomposicao,
        itens: itens.map((i) => ({
          skillId: i.skillId, texto: textoSkill(i.skillId), origem: i.origem, situacao: i.situacao, pendente: i.pendente,
          ultima: i.ultima && {
            nivel: i.ultima.nivel, anoLetivo: i.ultima.anoLetivo, bimestre: i.ultima.bimestre, tipo: i.ultima.tipo, autorNome: nome(i.ultima.autorId),
          },
        })),
        eventos: eventos.map((e) => ({
          id: e.id, tipo: e.tipo, skillId: e.skillId, texto: textoSkill(e.skillId), nivel: e.nivel,
          anoLetivo: anoDoCtx.get(e.contextId)!, bimestre: e.bimestre, autorNome: nome(e.autorId),
          justificativa: e.justificativa, em: new Date(e.criadoEm).toISOString(),
          origemAnoLetivo: e.origemContextId ? anoDoCtx.get(e.origemContextId) ?? null : null,
        })),
      },
    };
  }
}
