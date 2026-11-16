import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type Papel = 'PROFESSOR' | 'COORDENACAO';

/** spec acesso-e-permissoes — contas individuais (D03). Sem cadastro público. */
@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ type: 'varchar' }) nome: string;
  @Column({ type: 'varchar', unique: true }) email: string;
  @Column({ type: 'varchar' }) senhaHash: string;
  @Column({ type: 'varchar' }) papel: Papel;
  @Column({ type: 'boolean', default: true }) ativo: boolean;
  @CreateDateColumn() criadoEm: Date;
}
