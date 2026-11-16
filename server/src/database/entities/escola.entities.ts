import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from './acesso.entities';

/** spec gestao-escolar. Datas civis são guardadas como texto 'AAAA-MM-DD' (D06, America/Sao_Paulo). */
@Entity('alunos')
export class Student {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar' }) nome: string;
  @Column({ type: 'boolean', default: true }) ativo: boolean;
}

@Entity('turmas')
export class SchoolClass {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar' }) nome: string;
  @Column({ type: 'integer' }) etapa: number; // 1 a 5
  @Column({ type: 'integer' }) anoLetivo: number;
}

/** D02: contexto = aluno + ano letivo + etapa cursada, com catálogo fixado. É a identidade da avaliação. */
@Entity('contextos_pedagogicos')
@Unique(['studentId', 'anoLetivo', 'etapa'])
export class PedagogicalContext {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) studentId: number;
  @ManyToOne(() => Student, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'studentId' })
  student: Student;
  @Column({ type: 'integer' }) anoLetivo: number;
  @Column({ type: 'integer' }) etapa: number;
  @Column({ type: 'varchar', default: 'CAT-v1' }) catalogVersion: string;
}

/** D02: a matrícula registra a movimentação entre turmas; transferir NÃO copia avaliações. */
@Entity('matriculas')
export class Enrollment {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) contextId: number;
  @ManyToOne(() => PedagogicalContext, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contextId' })
  context: PedagogicalContext;
  @Column({ type: 'integer' }) classId: number;
  @ManyToOne(() => SchoolClass, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'classId' })
  schoolClass: SchoolClass;
  @Column({ type: 'varchar' }) de: string;
  @Column({ type: 'varchar', nullable: true }) ate: string | null;
}

export type TipoVinculo = 'TITULAR' | 'SUBSTITUTA';

/** D03: vínculo docente com vigência; titular e substituta podem coexistir. */
@Entity('vinculos_docentes')
export class TeacherLink {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) userId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;
  @Column({ type: 'integer' }) classId: number;
  @ManyToOne(() => SchoolClass, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'classId' })
  schoolClass: SchoolClass;
  @Column({ type: 'varchar' }) tipo: TipoVinculo;
  @Column({ type: 'varchar' }) de: string;
  @Column({ type: 'varchar', nullable: true }) ate: string | null;
}
