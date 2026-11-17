import { Body, Controller, Injectable, Module, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AttentionEvent, ManualAttention, PedagogicalContext, Period, Student, User } from '../../database/entities';
import { UsuarioAtual } from '../../common/auth';
import { acessoNegado, dadosInvalidos, ErroApi, naoEncontrado } from '../../common/erros';
import { exclusivo } from '../../common/exclusivo';
import { Relogio } from '../../common/relogio';
import { LIMITE_TEXTO_ATENCAO, textoAtencaoValido } from '../../domain/atencao';
import { bimestreSugerido } from '../../domain/periodo';
import { PolicyService } from '../acesso/policy.service';

type TipoEvento = 'COMENTARIO' | 'ENCERRAMENTO' | 'REABERTURA';

/**
 * Atenção manual (RN09, RF-09; D07). Ações atuais de professora com vínculo atual com o aluno,
 * mesmo com o bimestre de abertura fechado. Coordenação só consulta. Nada encerra a atenção automaticamente.
 */
@Injectable()
export class AtencaoService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  async abrir(u: User, studentId: number, justificativa: unknown) {
    const texto = this.texto(justificativa, 'Escreva a justificativa da atenção.');
    return exclusivo(() => this.ds.transaction(async (m) => {
      if (!(await m.existsBy(Student, { id: studentId }))) throw naoEncontrado('Aluno não encontrado.');
      await this.exigirAcao(u, studentId, m);
      const ref = await this.referenciaAtual(m, studentId);
      const { identifiers } = await m.insert(ManualAttention, {
        studentId, autorId: u.id, justificativa: texto, situacao: 'ABERTA', anoLetivo: ref.anoLetivo, bimestre: ref.bimestre,
      });
      return { atencao: { id: identifiers[0].id as number } };
    }));
  }

  async registrarEvento(u: User, attentionId: number, body: { tipo?: unknown; texto?: unknown }) {
    const tipo = body?.tipo as TipoEvento;
    if (!['COMENTARIO', 'ENCERRAMENTO', 'REABERTURA'].includes(tipo)) throw dadosInvalidos('Tipo de ação inválido.');
    const texto = this.texto(body?.texto, tipo === 'COMENTARIO' ? 'Escreva o comentário.' : 'Escreva o motivo.');
    return exclusivo(() => this.ds.transaction(async (m) => {
      const a = await m.findOneBy(ManualAttention, { id: attentionId });
      if (!a) throw naoEncontrado('Atenção não encontrada.');
      await this.exigirAcao(u, a.studentId, m);
      if (tipo === 'ENCERRAMENTO' && a.situacao !== 'ABERTA') throw new ErroApi(409, 'CONFLITO_VERSAO', 'Esta atenção já está encerrada. Atualize a tela.');
      if (tipo === 'REABERTURA' && a.situacao !== 'ENCERRADA') throw new ErroApi(409, 'CONFLITO_VERSAO', 'Esta atenção já está aberta. Atualize a tela.');
      const ref = await this.referenciaAtual(m, a.studentId); // tarefa 5.3: período da ação, para o corte histórico
      await m.insert(AttentionEvent, { attentionId, tipo, texto, autorId: u.id, anoLetivo: ref.anoLetivo, bimestre: ref.bimestre });
      if (tipo !== 'COMENTARIO') {
        await m.update(ManualAttention, { id: attentionId }, { situacao: tipo === 'ENCERRAMENTO' ? 'ENCERRADA' : 'ABERTA' });
      }
      return { ok: true };
    }));
  }

  /**
   * Tarefa 5.2 (spec "Abertura e autoria de atenção manual"): só a AUTORA, com vínculo atual, corrige o texto
   * original. A versão anterior fica preservada num evento CORRECAO (texto anterior, quem corrigiu e quando).
   */
  async corrigirTexto(u: User, attentionId: number, novoTexto: unknown) {
    const texto = this.texto(novoTexto, 'Escreva o texto corrigido.');
    return exclusivo(() => this.ds.transaction(async (m) => {
      const a = await m.findOneBy(ManualAttention, { id: attentionId });
      if (!a) throw naoEncontrado('Atenção não encontrada.');
      await this.exigirAcao(u, a.studentId, m);
      if (a.autorId !== u.id) throw new ErroApi(403, 'AUTORIA', 'Só a autora pode corrigir o texto original. Você pode registrar um comentário.');
      if (a.justificativa === texto) throw dadosInvalidos('O texto corrigido é igual ao atual.');
      const ref = await this.referenciaAtual(m, a.studentId);
      await m.insert(AttentionEvent, { attentionId, tipo: 'CORRECAO', texto: a.justificativa, autorId: u.id, anoLetivo: ref.anoLetivo, bimestre: ref.bimestre });
      await m.update(ManualAttention, { id: attentionId }, { justificativa: texto });
      return { ok: true };
    }));
  }

  /** Coordenação nunca age; professora precisa de vínculo atual com o aluno (não depende do período). */
  private async exigirAcao(u: User, studentId: number, m: EntityManager) {
    if (this.policy.ehCoordenacao(u)) throw acessoNegado('A coordenação consulta a atenção pedagógica, mas não abre nem encerra.');
    if (!(await this.policy.temVinculoAtualComAluno(u.id, studentId, m))) throw acessoNegado('Você não tem vínculo atual com este aluno.');
  }

  private async referenciaAtual(m: EntityManager, studentId: number) {
    const ctx = await m.findOne(PedagogicalContext, { where: { studentId }, order: { anoLetivo: 'DESC' } });
    if (!ctx) throw naoEncontrado('Este aluno ainda não tem contexto pedagógico.');
    const periodos = await m.findBy(Period, { anoLetivo: ctx.anoLetivo });
    return { anoLetivo: ctx.anoLetivo, bimestre: bimestreSugerido(periodos, this.relogio.hoje()) };
  }

  private texto(v: unknown, vazio: string): string {
    if (typeof v !== 'string' || !v.trim()) throw dadosInvalidos(vazio);
    if (!textoAtencaoValido(v)) throw dadosInvalidos(`O texto pode ter no máximo ${LIMITE_TEXTO_ATENCAO} caracteres.`);
    return v.trim();
  }
}

@Controller()
export class AtencaoController {
  constructor(private readonly atencao: AtencaoService) {}

  @Post('alunos/:studentId/atencoes')
  abrir(@UsuarioAtual() u: User, @Param('studentId', ParseIntPipe) studentId: number, @Body() body: { justificativa?: unknown }) {
    return this.atencao.abrir(u, studentId, body?.justificativa);
  }

  @Post('atencoes/:id/correcao')
  corrigir(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number, @Body() body: { texto?: unknown }) {
    return this.atencao.corrigirTexto(u, id, body?.texto);
  }

  @Post('atencoes/:id/eventos')
  evento(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number, @Body() body: { tipo?: unknown; texto?: unknown }) {
    return this.atencao.registrarEvento(u, id, body);
  }
}

@Module({ controllers: [AtencaoController], providers: [AtencaoService] })
export class AtencaoModule {}
