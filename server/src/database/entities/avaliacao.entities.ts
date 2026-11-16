import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn,
  PrimaryGeneratedColumn, Unique, UpdateDateColumn, VersionColumn,
} from 'typeorm';
import { User } from './acesso.entities';
import { PedagogicalContext } from './escola.entities';

/** D05: contador global de ordem de registro (compartilhado por respostas e eventos). Veja common/sequence.ts. */
@Entity('sequencias')
export class SequenceCounter {
  @PrimaryColumn({ type: 'varchar' }) nome: string;
  @Column({ type: 'integer' }) valor: number;
}

/**
 * spec avaliacao-bimestral (D03/D04). Uma única resposta vigente por habilidade/contexto/bimestre.
 * Ausência de avaliação = ausência de linha (nunca nível 0, D08). Nível 0 = Não consolidada.
 */
@Entity('respostas_habilidade')
@Unique(['contextId', 'skillId', 'bimestre'])
export class SkillResponse {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) contextId: number;
  @ManyToOne(() => PedagogicalContext, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contextId' })
  context: PedagogicalContext;
  @Column({ type: 'varchar' }) skillId: string;
  @Column({ type: 'varchar' }) catalogVersion: string;
  @Column({ type: 'integer' }) bimestre: number;
  @Column({ type: 'integer' }) nivel: number; // 0 Não consolidada, 1 Em desenvolvimento, 2 Consolidada
  @Column({ type: 'integer' }) autorId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorId' })
  autor: User;
  @Column({ type: 'integer', unique: true }) seq: number;
  @VersionColumn() version: number;
  @CreateDateColumn() criadoEm: Date;
  @UpdateDateColumn() atualizadoEm: Date;
}

@Entity('respostas_escrita')
@Unique(['contextId', 'bimestre'])
export class WritingResponse {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) contextId: number;
  @ManyToOne(() => PedagogicalContext, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contextId' })
  context: PedagogicalContext;
  @Column({ type: 'integer' }) bimestre: number;
  @Column({ type: 'integer' }) nivel: number; // 0 Pré-silábico, 1 Silábico, 2 Silábico-alfabético, 3 Alfabético
  @Column({ type: 'integer' }) autorId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorId' })
  autor: User;
  @VersionColumn() version: number;
  @CreateDateColumn() criadoEm: Date;
  @UpdateDateColumn() atualizadoEm: Date;
}

/** D04: versão anterior preservada com autora, instante e justificativa. */
@Entity('revisoes_resposta')
export class ResponseRevision {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar' }) tipo: 'HABILIDADE' | 'ESCRITA';
  @Column({ type: 'integer' }) responseId: number;
  @Column({ type: 'integer' }) versaoAnterior: number;
  @Column({ type: 'integer', nullable: true }) nivelAnterior: number | null;
  @Column({ type: 'integer', nullable: true }) nivelNovo: number | null; // null = resposta limpa
  // onde a resposta estava (permite mostrar a resposta limpa, cuja linha deixa de existir — tarefa 3.4)
  @Column({ type: 'integer', nullable: true }) contextId: number | null;
  @Column({ type: 'varchar', nullable: true }) skillId: string | null;
  @Column({ type: 'integer', nullable: true }) bimestre: number | null;
  @Column({ type: 'integer' }) autorId: number;
  @Column({ type: 'text' }) justificativa: string;
  @CreateDateColumn() criadoEm: Date;
}

/** D02: observações independentes por autora; limite compartilhado de 4.000 caracteres vigentes por aluno/bimestre. */
@Entity('observacoes')
export class Observation {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) contextId: number;
  @ManyToOne(() => PedagogicalContext, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contextId' })
  context: PedagogicalContext;
  @Column({ type: 'integer' }) bimestre: number;
  @Column({ type: 'integer' }) autorId: number;
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'autorId' })
  autor: User;
  @Column({ type: 'text' }) texto: string;
  @Column({ type: 'boolean', default: true }) vigente: boolean;
  @VersionColumn() version: number;
  @CreateDateColumn() criadoEm: Date;
  @UpdateDateColumn() atualizadoEm: Date;
}
