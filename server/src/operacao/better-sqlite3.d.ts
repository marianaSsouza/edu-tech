/**
 * Tipos mínimos do better-sqlite3 (já é dependência do projeto, usado pelo TypeORM), só com o que a
 * cópia de segurança usa. Evita acrescentar @types/better-sqlite3 só para isso.
 */
declare module 'better-sqlite3' {
  interface Statement {
    all(...params: unknown[]): unknown[];
    raw(ligado?: boolean): Statement;
  }
  class Database {
    constructor(arquivo: string, opcoes?: { readonly?: boolean; fileMustExist?: boolean });
    prepare(sql: string): Statement;
    pragma(sql: string, opcoes?: { simple?: boolean }): unknown;
    backup(destino: string): Promise<unknown>;
    close(): void;
  }
  export = Database;
}
