import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, VersionColumn } from 'typeorm';

export type TipoEvento = 'CONSOLIDACAO' | 'REAVALIACAO';

/**
 * spec lacunas-herdadas (D04/D05): consolidação e reavaliação de lacuna são eventos pedagógicos
 * distintos, com versão própria. `seq` vem do contador global (common/sequence.ts).
 */
@Entity('eventos_pedagogicos')
export class PedagogicalEvent {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer', unique: true }) seq: number;
  @Column({ type: 'varchar' }) tipo: TipoEvento;
  @Column({ type: 'integer' }) contextId: number; // contexto atual (onde o evento acontece)
  @Column({ type: 'integer', nullable: true }) origemContextId: number | null; // contexto onde a lacuna nasceu
  @Column({ type: 'varchar' }) skillId: string;
  @Column({ type: 'integer' }) bimestre: number; // período pedagógico do evento
  @Column({ type: 'integer' }) nivel: number;
  @Column({ type: 'integer' }) autorId: number;
  @Column({ type: 'text' }) justificativa: string;
  @VersionColumn() version: number;
  @CreateDateColumn() criadoEm: Date;
}
