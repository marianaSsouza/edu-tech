import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** spec atencao-pedagogica (D07): atenção manual com identidade e ciclo de vida próprios. */
@Entity('atencoes_manuais')
export class ManualAttention {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) studentId: number;
  @Column({ type: 'integer' }) autorId: number;
  @Column({ type: 'text' }) justificativa: string; // 1 a 2.000 caracteres
  @Column({ type: 'varchar', default: 'ABERTA' }) situacao: 'ABERTA' | 'ENCERRADA';
  @Column({ type: 'integer' }) anoLetivo: number;
  @Column({ type: 'integer' }) bimestre: number;
  @CreateDateColumn() criadoEm: Date;
}

@Entity('eventos_atencao')
export class AttentionEvent {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'integer' }) attentionId: number;
  @Column({ type: 'varchar' }) tipo: 'COMENTARIO' | 'ENCERRAMENTO' | 'REABERTURA' | 'CORRECAO';
  /** CORRECAO: guarda o texto ANTERIOR (a revisão preservada); nos demais, o texto da ação. */
  @Column({ type: 'text' }) texto: string;
  @Column({ type: 'integer' }) autorId: number;
  /** Tarefa 5.3: período em que a ação aconteceu (corte histórico). Nulo em eventos antigos. */
  @Column({ type: 'integer', nullable: true }) anoLetivo: number | null;
  @Column({ type: 'integer', nullable: true }) bimestre: number | null;
  @CreateDateColumn() criadoEm: Date;
}
