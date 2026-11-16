import { Column, CreateDateColumn, Entity, PrimaryColumn, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type EstadoPeriodo = 'ABERTO' | 'FECHADO' | 'REABERTO';

/** spec calendario-letivo (D06): um calendário por escola/ano, quatro bimestres. */
@Entity('periodos')
@Unique(['anoLetivo', 'bimestre'])
export class Period {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) anoLetivo: number;
  @Column({ type: 'integer' }) bimestre: number; // 1 a 4
  @Column({ type: 'varchar' }) inicio: string;
  @Column({ type: 'varchar' }) fim: string;
  @Column({ type: 'varchar', default: 'ABERTO' }) estado: EstadoPeriodo;
  @Column({ type: 'text', nullable: true }) justificativa: string | null;
}

/** D06: registra que o ano JÁ FOI encerrado, separado do estado atual (reabrir não retira a herança). */
@Entity('anos_encerrados')
export class YearClosure {
  @PrimaryColumn({ type: 'integer' }) anoLetivo: number;
  @CreateDateColumn() encerradoEm: Date;
}
