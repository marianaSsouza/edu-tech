import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { ALL_ENTITIES } from './entities';

/** Arquivo do banco: <raiz do projeto>/data/fio.sqlite (ou DB_PATH). Funciona em src/ e em dist/. */
export function dbPath(): string {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  return join(__dirname, '..', '..', '..', 'data', 'fio.sqlite');
}

export function buildDataSourceOptions(database: string = dbPath()): DataSourceOptions {
  if (database !== ':memory:') mkdirSync(dirname(database), { recursive: true });
  return {
    type: 'better-sqlite3',
    database,
    entities: ALL_ENTITIES,
    // MVP: o esquema nasce das entidades. Sem migrações (não há dados legados, ver Migration Plan do design).
    synchronize: true,
    prepareDatabase: (db: any) => {
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
    },
  };
}
