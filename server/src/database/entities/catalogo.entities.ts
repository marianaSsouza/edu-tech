import { Column, Entity, PrimaryColumn } from 'typeorm';

/** spec catalogo-pedagogico (D08): ID estável + versão do catálogo; imutável por contexto. */
@Entity('habilidades_catalogo')
export class CatalogSkill {
  @PrimaryColumn({ type: 'varchar' }) id: string; // ex.: H02-LP01
  @PrimaryColumn({ type: 'varchar' }) catalogVersion: string; // ex.: CAT-v1
  @Column({ type: 'integer' }) etapa: number;
  @Column({ type: 'varchar' }) area: string; // LP | MAT
  @Column({ type: 'varchar' }) texto: string;
  @Column({ type: 'varchar' }) exemplo: string;
  @Column({ type: 'integer' }) ordem: number;
}
