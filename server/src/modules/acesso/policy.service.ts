import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { Period, Student, User } from '../../database/entities';
import { acessoNegado, ErroApi, naoEncontrado } from '../../common/erros';
import { Relogio } from '../../common/relogio';
import { situacaoPeriodo } from '../../domain/periodo';

export type CodigoEscrita = 'OK' | 'ACESSO_NEGADO' | 'NAO_ENCONTRADO' | 'PERIODO_FUTURO' | 'PERIODO_FECHADO';
export interface AvaliacaoEscrita { pode: boolean; codigo: CodigoEscrita; motivo: string | null }

const STATUS: Record<Exclude<CodigoEscrita, 'OK'>, number> = {
  ACESSO_NEGADO: 403, NAO_ENCONTRADO: 404, PERIODO_FUTURO: 422, PERIODO_FECHADO: 422,
};

/**
 * D16: ÚNICO lugar que decide autorização (papel + vínculo vigente + período). Autoria fica em domain/autoria.ts.
 * Nenhum controller decide sozinho; é isso que permite verificar CR-21 por integração.
 */
@Injectable()
export class PolicyService {
  constructor(private readonly ds: DataSource, private readonly relogio: Relogio) {}

  ehCoordenacao(u: User): boolean {
    return u.papel === 'COORDENACAO';
  }

  /** Vínculo docente vigente HOJE com a turma da matrícula vigente HOJE do aluno (RN06, RF-11). */
  async temVinculoAtualComAluno(userId: number, studentId: number, m: EntityManager = this.ds.manager): Promise<boolean> {
    const hoje = this.relogio.hoje();
    const linhas = await m.query(
      `SELECT 1 FROM matriculas mt
         JOIN contextos_pedagogicos c ON c.id = mt.contextId
         JOIN vinculos_docentes v ON v.classId = mt.classId
        WHERE c.studentId = ? AND v.userId = ?
          AND mt.de <= ? AND (mt.ate IS NULL OR mt.ate >= ?)
          AND v.de <= ? AND (v.ate IS NULL OR v.ate >= ?)
        LIMIT 1`,
      [studentId, userId, hoje, hoje, hoje, hoje],
    );
    return linhas.length > 0;
  }

  /** IDs das turmas com vínculo vigente hoje (professora). */
  async turmasVinculadasHoje(userId: number): Promise<number[]> {
    const hoje = this.relogio.hoje();
    const linhas: Array<{ classId: number }> = await this.ds.query(
      `SELECT DISTINCT classId FROM vinculos_docentes WHERE userId = ? AND de <= ? AND (ate IS NULL OR ate >= ?)`,
      [userId, hoje, hoje],
    );
    return linhas.map((l) => l.classId);
  }

  /** Coordenação lê todas as turmas; professora só as vinculadas hoje. */
  async exigirLeituraTurma(u: User, classId: number): Promise<void> {
    if (this.ehCoordenacao(u)) return;
    if (!(await this.turmasVinculadasHoje(u.id)).includes(classId)) throw acessoNegado('Você não tem vínculo atual com esta turma.');
  }

  /**
   * Coordenação lê todos os alunos, inclusive sem matrícula atual. Professora só alunos com vínculo atual;
   * ex-aluno é negado mesmo que ela seja autora de registros antigos (CR-21, cenário "Ex-aluno sem vínculo").
   */
  async exigirLeituraAluno(u: User, studentId: number): Promise<void> {
    if (this.ehCoordenacao(u)) {
      if (!(await this.ds.getRepository(Student).existsBy({ id: studentId }))) throw naoEncontrado('Aluno não encontrado.');
      return;
    }
    if (!(await this.temVinculoAtualComAluno(u.id, studentId))) {
      throw acessoNegado('Você não tem vínculo atual com este aluno.');
    }
  }

  /**
   * Escrita pedagógica (RF-11, RF-13): coordenação nunca escreve; professora precisa de vínculo atual com o aluno
   * e de período (anoLetivo, bimestre) existente, já iniciado e não fechado. Não exige que a turma atual seja a original.
   * Devolve a decisão (para o flag `podeEditar` na leitura) sem lançar erro.
   */
  async avaliarEscrita(
    u: User,
    contexto: { studentId: number; anoLetivo: number },
    bimestre: number,
    m: EntityManager = this.ds.manager,
  ): Promise<AvaliacaoEscrita> {
    if (this.ehCoordenacao(u)) {
      return { pode: false, codigo: 'ACESSO_NEGADO', motivo: 'A coordenação consulta os registros, mas não edita conteúdo pedagógico.' };
    }
    if (!(await this.temVinculoAtualComAluno(u.id, contexto.studentId, m))) {
      return { pode: false, codigo: 'ACESSO_NEGADO', motivo: 'Você não tem vínculo atual com este aluno.' };
    }
    const periodo = await m.findOneBy(Period, { anoLetivo: contexto.anoLetivo, bimestre });
    if (!periodo) {
      return { pode: false, codigo: 'NAO_ENCONTRADO', motivo: `O ${bimestre}º bimestre de ${contexto.anoLetivo} não está no calendário.` };
    }
    const situacao = situacaoPeriodo(periodo, this.relogio.hoje());
    if (situacao === 'FUTURO') {
      return { pode: false, codigo: 'PERIODO_FUTURO', motivo: 'Este bimestre ainda não começou; não aceita registros.' };
    }
    if (situacao === 'FECHADO') {
      return { pode: false, codigo: 'PERIODO_FECHADO', motivo: 'Este bimestre está fechado. Somente consulta.' };
    }
    return { pode: true, codigo: 'OK', motivo: null };
  }

  /** Igual a `avaliarEscrita`, mas lança o erro padronizado (403/404/422). */
  async exigirEscrita(
    u: User,
    contexto: { studentId: number; anoLetivo: number },
    bimestre: number,
    m: EntityManager = this.ds.manager,
  ): Promise<void> {
    const r = await this.avaliarEscrita(u, contexto, bimestre, m);
    if (!r.pode) throw new ErroApi(STATUS[r.codigo as Exclude<CodigoEscrita, 'OK'>], r.codigo, r.motivo!);
  }
}
