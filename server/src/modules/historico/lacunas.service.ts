import { Body, Controller, Injectable, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CatalogSkill, PedagogicalContext, PedagogicalEvent, Period, User, YearClosure } from '../../database/entities';
import { UsuarioAtual } from '../../common/auth';
import { dadosInvalidos, naoEncontrado } from '../../common/erros';
import { exclusivo } from '../../common/exclusivo';
import { Relogio } from '../../common/relogio';
import { nextSeq } from '../../common/sequence';
import { bimestreSugerido } from '../../domain/periodo';
import { LIMITE_TEXTO_ATENCAO } from '../../domain/atencao';
import { PolicyService } from '../acesso/policy.service';

/**
 * Tarefa 4.3 (RF-07, CA-07.1–07.4, CR-06): consolidação e reavaliação de habilidade herdada.
 * É um evento NOVO no contexto atual (bimestre em andamento), com origem e justificativa.
 * Nunca altera a avaliação do ano anterior. Mesmas regras de escrita: vínculo atual e período aberto.
 */
@Injectable()
export class LacunasService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  async registrar(u: User, studentId: number, skillId: string, body: { tipo?: unknown; nivel?: unknown; justificativa?: unknown }) {
    const tipo = body?.tipo;
    if (tipo !== 'CONSOLIDACAO' && tipo !== 'REAVALIACAO') throw dadosInvalidos('Tipo deve ser CONSOLIDACAO ou REAVALIACAO.');
    const nivel = tipo === 'CONSOLIDACAO' ? 2 : body?.nivel;
    if (tipo === 'REAVALIACAO' && nivel !== 0 && nivel !== 1) {
      throw dadosInvalidos('Na reavaliação, o nível deve ser Não consolidada (0) ou Em desenvolvimento (1). Para Consolidada, use consolidação.');
    }
    const just = body?.justificativa;
    if (typeof just !== 'string' || !just.trim()) throw dadosInvalidos('Descreva a evidência ou a justificativa.');
    if (Array.from(just.trim()).length > LIMITE_TEXTO_ATENCAO) throw dadosInvalidos(`A justificativa pode ter no máximo ${LIMITE_TEXTO_ATENCAO} caracteres.`);

    return exclusivo(() => this.ds.transaction(async (m) => {
      const contextos = await m.find(PedagogicalContext, { where: { studentId }, order: { anoLetivo: 'ASC', id: 'ASC' } });
      if (!contextos.length) throw naoEncontrado('Aluno não encontrado.');
      const atual = contextos[contextos.length - 1];
      const periodos = await m.findBy(Period, { anoLetivo: atual.anoLetivo });
      const bimestre = bimestreSugerido(periodos, this.relogio.hoje());
      await this.policy.exigirEscrita(u, atual, bimestre, m);

      // a habilidade precisa ser herdada: prevista num ano anterior cursado e encerrado ao menos uma vez
      const encerrados = (await m.find(YearClosure)).map((y) => y.anoLetivo);
      const origem = [...contextos].reverse().find((c) => c.anoLetivo < atual.anoLetivo && encerrados.includes(c.anoLetivo) &&
        c.etapa === Number(skillId.slice(1, 3)));
      const previstaNaOrigem = origem && (await m.existsBy(CatalogSkill, { id: skillId, catalogVersion: origem.catalogVersion, etapa: origem.etapa }));
      if (!origem || !previstaNaOrigem) throw dadosInvalidos(`A habilidade ${skillId} não é herdada de um ano anterior encerrado deste aluno.`);

      const { identifiers } = await m.insert(PedagogicalEvent, {
        seq: await nextSeq(m), tipo, contextId: atual.id, origemContextId: origem.id, skillId, bimestre,
        nivel: nivel as number, autorId: u.id, justificativa: just.trim(),
      });
      return { evento: { id: identifiers[0].id as number, tipo, skillId, nivel, anoLetivo: atual.anoLetivo, bimestre, origemAnoLetivo: origem.anoLetivo } };
    }));
  }
}

@Controller('alunos')
export class LacunasController {
  constructor(private readonly lacunas: LacunasService) {}

  @Post(':studentId/lacunas/:skillId/eventos')
  registrar(
    @UsuarioAtual() u: User,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('skillId') skillId: string,
    @Body() body: { tipo?: unknown; nivel?: unknown; justificativa?: unknown },
  ) {
    return this.lacunas.registrar(u, studentId, skillId, body);
  }
}
