import { DataSource } from 'typeorm';
import { CAT_V1, CATALOGO_VERSAO_ATUAL } from '../../database/seed/cat-v1';
import { CatalogSkill } from '../../database/entities';

/** Garante CAT-v1 no banco. Idempotente: chave (id, versão). Nunca altera o texto de uma versão publicada além da carga inicial. */
export async function carregarCatalogo(ds: DataSource): Promise<void> {
  await ds.getRepository(CatalogSkill).upsert(
    CAT_V1.map((h, i) => ({ ...h, catalogVersion: CATALOGO_VERSAO_ATUAL, ordem: i + 1 })),
    ['id', 'catalogVersion'],
  );
}
