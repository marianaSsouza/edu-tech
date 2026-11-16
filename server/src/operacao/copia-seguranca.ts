/// <reference path="./better-sqlite3.d.ts" />
import Database from 'better-sqlite3';
import { createHash } from 'crypto';
import { closeSync, copyFileSync, existsSync, mkdirSync, openSync, readSync, rmSync } from 'fs';
import { dirname } from 'path';

/**
 * Tarefa 9.1 / RNF-05 — cópia de segurança e restauração da base de demonstração.
 * Decisão do design: com SQLite, a cópia é o próprio arquivo de dados. Usamos a API de backup do SQLite,
 * que gera uma cópia consistente mesmo com o servidor ligado (modo WAL).
 */

/** Tabelas cujo conteúdo prova "vínculos, histórico, versões e autoria" (RNF-05; cenário "Restauração antes da entrega"). */
export const TABELAS_CHAVE: Array<{ tabela: string; rotulo: string }> = [
  { tabela: 'usuarios', rotulo: 'Contas' },
  { tabela: 'turmas', rotulo: 'Turmas' },
  { tabela: 'alunos', rotulo: 'Alunos' },
  { tabela: 'matriculas', rotulo: 'Matrículas' },
  { tabela: 'vinculos_docentes', rotulo: 'Vínculos docentes' },
  { tabela: 'respostas_habilidade', rotulo: 'Avaliações de habilidade (com versão e autora)' },
  { tabela: 'respostas_escrita', rotulo: 'Avaliações de escrita (com versão e autora)' },
  { tabela: 'revisoes_resposta', rotulo: 'Revisões (correções e limpezas)' },
  { tabela: 'observacoes', rotulo: 'Observações' },
  { tabela: 'eventos_pedagogicos', rotulo: 'Consolidações e reavaliações' },
  { tabela: 'atencoes_manuais', rotulo: 'Atenções manuais' },
  { tabela: 'eventos_atencao', rotulo: 'Eventos de atenção' },
  { tabela: 'periodos', rotulo: 'Bimestres' },
  { tabela: 'eventos_calendario', rotulo: 'Fechamentos e reaberturas' },
];

export interface ImpressaoTabela { tabela: string; linhas: number; hash: string }

/**
 * "Impressão digital" do banco: para cada tabela, número de linhas e um hash SHA-256 de todas as linhas
 * em ordem. Se dois bancos têm a mesma impressão, têm exatamente o mesmo conteúdo (ids, versões, autoras, datas).
 */
export function impressaoDigital(arquivo: string): ImpressaoTabela[] {
  const db = new Database(arquivo, { readonly: true, fileMustExist: true });
  try {
    const tabelas = (db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all() as Array<{ name: string }>)
      .map((t) => t.name);
    return tabelas.map((tabela) => {
      const linhas = db.prepare(`SELECT * FROM "${tabela}" ORDER BY rowid`).raw().all();
      const hash = createHash('sha256').update(JSON.stringify(linhas)).digest('hex');
      return { tabela, linhas: linhas.length, hash };
    });
  } finally {
    db.close();
  }
}

export function verificarIntegridade(arquivo: string): void {
  // todo banco SQLite começa com estes 16 bytes; sem eles, nem tenta abrir
  const cabecalho = Buffer.alloc(16);
  const fd = openSync(arquivo, 'r');
  try { readSync(fd, cabecalho, 0, 16, 0); } finally { closeSync(fd); }
  if (cabecalho.toString('latin1') !== 'SQLite format 3\u0000') throw new Error(`O arquivo ${arquivo} não é um banco SQLite.`);
  const db = new Database(arquivo, { readonly: true, fileMustExist: true });
  try {
    const r = db.pragma('integrity_check', { simple: true });
    if (r !== 'ok') throw new Error(`O arquivo ${arquivo} está corrompido: ${String(r)}`);
  } finally {
    db.close();
  }
}

/** Gera a cópia de segurança (consistente mesmo com o servidor ligado) e confere a integridade dela. */
export async function fazerCopia(origem: string, destino: string): Promise<void> {
  if (!existsSync(origem)) throw new Error(`Banco não encontrado: ${origem}. Rode "npm run seed" antes.`);
  mkdirSync(dirname(destino), { recursive: true });
  const db = new Database(origem, { readonly: true, fileMustExist: true });
  try {
    await db.backup(destino);
  } finally {
    db.close();
  }
  verificarIntegridade(destino);
}

/**
 * Restaura uma cópia sobre o banco de destino. O SERVIDOR PRECISA ESTAR DESLIGADO.
 * Antes de sobrescrever, guarda o banco atual ao lado (…antes-da-restauracao-<data>.sqlite), para nada se perder.
 * Devolve o caminho dessa cópia de proteção (ou null se não havia banco).
 */
export async function restaurarCopia(copia: string, destino: string, carimbo = carimboAgora()): Promise<string | null> {
  verificarIntegridade(copia);
  mkdirSync(dirname(destino), { recursive: true });
  let protecao: string | null = null;
  if (existsSync(destino)) {
    protecao = destino.replace(/\.sqlite$/, '') + `.antes-da-restauracao-${carimbo}.sqlite`;
    await fazerCopia(destino, protecao);
  }
  for (const sufixo of ['-wal', '-shm']) if (existsSync(destino + sufixo)) rmSync(destino + sufixo);
  copyFileSync(copia, destino);
  verificarIntegridade(destino);
  return protecao;
}

export function compararImpressoes(a: ImpressaoTabela[], b: ImpressaoTabela[]): string[] {
  const diferencas: string[] = [];
  const mapaB = new Map(b.map((t) => [t.tabela, t]));
  for (const t of a) {
    const o = mapaB.get(t.tabela);
    if (!o) diferencas.push(`${t.tabela}: ausente na restauração`);
    else if (o.linhas !== t.linhas || o.hash !== t.hash) diferencas.push(`${t.tabela}: ${t.linhas} → ${o.linhas} linhas, conteúdo ${o.hash === t.hash ? 'igual' : 'diferente'}`);
  }
  for (const t of b) if (!a.some((x) => x.tabela === t.tabela)) diferencas.push(`${t.tabela}: tabela a mais na restauração`);
  return diferencas;
}

export function carimboAgora(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
