/**
 * Mutex assíncrono para escritas pedagógicas.
 * O driver better-sqlite3 do TypeORM usa UMA conexão: duas transações concorrentes se aninhariam.
 * Por isso toda gravação passa por `exclusivo(() => ds.transaction(...))`, uma de cada vez.
 */
let fila: Promise<unknown> = Promise.resolve();

export function exclusivo<T>(fn: () => Promise<T>): Promise<T> {
  const resultado = fila.then(fn, fn);
  fila = resultado.catch(() => undefined);
  return resultado;
}
