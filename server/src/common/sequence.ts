import { EntityManager } from 'typeorm';

/**
 * D05: ordem total persistente de registro (evita empate de relógio).
 * Deve ser chamada DENTRO da transação que grava a resposta/evento, usando o mesmo `manager`.
 */
export async function nextSeq(manager: EntityManager): Promise<number> {
  await manager.query(
    `INSERT INTO sequencias (nome, valor) VALUES ('registro', 1)
     ON CONFLICT(nome) DO UPDATE SET valor = valor + 1`,
  );
  const rows: Array<{ valor: number }> = await manager.query(`SELECT valor FROM sequencias WHERE nome = 'registro'`);
  return rows[0].valor;
}
