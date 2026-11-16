import { Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { Period, SchoolClass, TeacherLink, TipoVinculo, User, YearClosure } from '../../database/entities';
import { bimestreSugerido, situacaoPeriodo } from '../../domain/periodo';
import { naoEncontrado } from '../../common/erros';
import { Relogio } from '../../common/relogio';
import { PolicyService } from '../acesso/policy.service';

export interface TurmaResumo {
  id: number; nome: string; etapa: number; anoLetivo: number; alunos: number; meuVinculo: TipoVinculo | null;
  professores?: Array<{ nome: string; tipo: TipoVinculo }>; anoEncerrado?: boolean;
}
export interface AlunoDaTurma { id: number; nome: string; contextId: number; de: string; ate: string | null }

/**
 * spec acesso-e-permissoes / paineis (consulta operacional, RF-11, CA-10.1):
 * coordenação vê todas as turmas; professora só as vinculadas hoje.
 * Turma do ano corrente conta as matrículas vigentes hoje; turma de ano passado conta quem passou por ela.
 */
@Injectable()
export class TurmasService {
  constructor(private readonly ds: DataSource, private readonly policy: PolicyService, private readonly relogio: Relogio) {}

  async listar(u: User): Promise<TurmaResumo[]> {
    const ids = this.policy.ehCoordenacao(u) ? null : await this.policy.turmasVinculadasHoje(u.id);
    const turmas = await this.ds.getRepository(SchoolClass).find({
      where: ids ? { id: In(ids) } : {},
      order: { anoLetivo: 'DESC', nome: 'ASC' },
    });
    const hoje = this.relogio.hoje();
    const vinculos = ids
      ? await this.ds.getRepository(TeacherLink).find({ where: { userId: u.id, classId: In(ids) } })
      : [];
    const resultado: TurmaResumo[] = [];
    const todosVinculos = await this.ds.getRepository(TeacherLink).find({ where: { classId: In(turmas.map((t) => t.id).concat(-1)) }, relations: { user: true } });
    const encerrados = (await this.ds.getRepository(YearClosure).find()).map((y) => y.anoLetivo);
    for (const t of turmas) {
      const alunos = (await this.alunosDe(t, hoje)).length;
      const v = vinculos.find((x) => x.classId === t.id && x.de <= hoje && (x.ate === null || x.ate >= hoje));
      // docentes vigentes hoje; para turma de ano passado, quem esteve vinculado (apresentação dos cartões)
      const anoPassado = t.anoLetivo < Number(hoje.slice(0, 4));
      const professores = todosVinculos
        .filter((x) => x.classId === t.id && (anoPassado || (x.de <= hoje && (x.ate === null || x.ate >= hoje))))
        .map((x) => ({ nome: x.user.nome, tipo: x.tipo }));
      resultado.push({
        id: t.id, nome: t.nome, etapa: t.etapa, anoLetivo: t.anoLetivo, alunos, meuVinculo: v?.tipo ?? null,
        professores, anoEncerrado: encerrados.includes(t.anoLetivo),
      });
    }
    return resultado;
  }

  /** Bimestre em andamento (para o subtítulo da tela de turmas). */
  async periodoAtual() {
    const hoje = this.relogio.hoje();
    const ano = Number(hoje.slice(0, 4));
    const periodos = await this.ds.getRepository(Period).find({ where: { anoLetivo: ano }, order: { bimestre: 'ASC' } });
    if (!periodos.length) return null;
    const p = periodos.find((x) => x.bimestre === bimestreSugerido(periodos, hoje))!;
    return { anoLetivo: ano, bimestre: p.bimestre, inicio: p.inicio, fim: p.fim, situacao: situacaoPeriodo(p, hoje) };
  }

  async alunos(u: User, classId: number): Promise<{ turma: TurmaResumo; alunos: AlunoDaTurma[] }> {
    const t = await this.ds.getRepository(SchoolClass).findOneBy({ id: classId });
    if (!t) throw naoEncontrado('Turma não encontrada.');
    await this.policy.exigirLeituraTurma(u, classId);
    const hoje = this.relogio.hoje();
    const alunos = await this.alunosDe(t, hoje);
    const v = this.policy.ehCoordenacao(u)
      ? null
      : await this.ds.getRepository(TeacherLink).findOneBy({ userId: u.id, classId });
    return {
      turma: { id: t.id, nome: t.nome, etapa: t.etapa, anoLetivo: t.anoLetivo, alunos: alunos.length, meuVinculo: v?.tipo ?? null },
      alunos,
    };
  }

  /** Lista alfabética (CA-10.1). Ano corrente: matrícula vigente hoje. Ano passado: todas as matrículas da turma. */
  private async alunosDe(t: SchoolClass, hoje: string): Promise<AlunoDaTurma[]> {
    const anoCorrente = Number(hoje.slice(0, 4));
    const soVigentes = t.anoLetivo >= anoCorrente;
    const linhas: AlunoDaTurma[] = await this.ds.query(
      `SELECT s.id AS id, s.nome AS nome, c.id AS contextId, mt.de AS de, mt.ate AS ate
         FROM matriculas mt
         JOIN contextos_pedagogicos c ON c.id = mt.contextId
         JOIN alunos s ON s.id = c.studentId
        WHERE mt.classId = ? ${soVigentes ? 'AND mt.de <= ? AND (mt.ate IS NULL OR mt.ate >= ?)' : ''}
        ORDER BY s.nome COLLATE NOCASE, s.id`,
      soVigentes ? [t.id, hoje, hoje] : [t.id],
    );
    // um aluno pode ter passado duas vezes pela mesma turma: mantém a matrícula mais recente
    const unicos = new Map<number, AlunoDaTurma>();
    for (const l of linhas) {
      const atual = unicos.get(l.id);
      if (!atual || l.de > atual.de) unicos.set(l.id, l);
    }
    return [...unicos.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }
}
