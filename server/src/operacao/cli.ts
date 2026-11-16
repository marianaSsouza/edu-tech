/**
 * Tarefa 9.1 / RNF-05 — comandos de operação (rodar na pasta do projeto):
 *
 *   npm run backup                                   gera data/backups/fio-<data-hora>.sqlite
 *   npm run restaurar -- data/backups/<arquivo>      volta o banco para essa cópia (servidor DESLIGADO)
 *   npm run verificar-restauracao                    ensaio completo em ambiente separado + evidência
 *
 * O procedimento completo está em docs/guia-operacional.md.
 */
import { existsSync, readdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { dbPath } from '../database/data-source';
import {
  carimboAgora, compararImpressoes, fazerCopia, impressaoDigital, ImpressaoTabela, restaurarCopia, TABELAS_CHAVE,
} from './copia-seguranca';

const RAIZ = join(__dirname, '..', '..', '..');
const BANCO = dbPath();
const PASTA_BACKUPS = join(dirname(BANCO), 'backups');
const PASTA_VERIFICACAO = join(dirname(BANCO), 'verificacao');
const EVIDENCIA = join(RAIZ, 'docs', 'evidencias', 'restauracao-rnf05.md');
const rel = (p: string) => p.replace(RAIZ, '').replace(/^[\\/]/, '').replace(/\\/g, '/');

async function servidorLigado(): Promise<boolean> {
  const porta = Number(process.env.PORT ?? 3000);
  try {
    await fetch(`http://localhost:${porta}/api/health`, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

async function backup() {
  const destino = join(PASTA_BACKUPS, `fio-${carimboAgora()}.sqlite`);
  await fazerCopia(BANCO, destino);
  const linhas = impressaoDigital(destino);
  console.log(`Cópia de segurança criada e conferida: ${rel(destino)}`);
  console.log(`(${linhas.reduce((s, t) => s + t.linhas, 0)} registros em ${linhas.length} tabelas)`);
}

async function restaurar(arquivo?: string) {
  if (!arquivo) {
    const disponiveis = existsSync(PASTA_BACKUPS) ? readdirSync(PASTA_BACKUPS).filter((f) => f.endsWith('.sqlite')).sort() : [];
    console.error('Diga qual cópia restaurar. Exemplo:\n  npm run restaurar -- data/backups/' + (disponiveis.at(-1) ?? 'fio-AAAA-MM-DD-HHMMSS.sqlite'));
    if (disponiveis.length) console.error('\nCópias disponíveis:\n' + disponiveis.map((f) => '  data/backups/' + f).join('\n'));
    process.exit(1);
  }
  const copia = resolve(RAIZ, arquivo);
  if (!existsSync(copia)) throw new Error(`Cópia não encontrada: ${arquivo}`);
  if (await servidorLigado()) {
    console.error('O servidor está ligado. Pare o "npm run dev" (Ctrl+C) e rode o comando de novo.');
    process.exit(1);
  }
  const protecao = await restaurarCopia(copia, BANCO);
  const iguais = compararImpressoes(impressaoDigital(copia), impressaoDigital(BANCO)).length === 0;
  console.log(`Banco restaurado a partir de ${rel(copia)}.`);
  if (protecao) console.log(`O banco anterior foi guardado em ${rel(protecao)}.`);
  console.log(iguais ? 'Conferência: conteúdo idêntico ao da cópia.' : 'ATENÇÃO: o conteúdo restaurado difere da cópia.');
  if (!iguais) process.exit(1);
}

/** Ensaio completo, sem tocar no banco de demonstração: cópia → restauração em pasta separada → comparação. */
async function verificar() {
  const carimbo = carimboAgora();
  const original = impressaoDigital(BANCO);
  const copia = join(PASTA_BACKUPS, `fio-${carimbo}.sqlite`);
  await fazerCopia(BANCO, copia);

  rmSync(PASTA_VERIFICACAO, { recursive: true, force: true });
  const restaurado = join(PASTA_VERIFICACAO, 'fio-restaurado.sqlite');
  await restaurarCopia(copia, restaurado, carimbo);
  const depois = impressaoDigital(restaurado);
  const diferencas = compararImpressoes(original, depois);

  const mapa = (l: ImpressaoTabela[]) => new Map(l.map((t) => [t.tabela, t]));
  const [o, d] = [mapa(original), mapa(depois)];
  const linhaTabela = (tabela: string, rotulo: string) => {
    const a = o.get(tabela); const b = d.get(tabela);
    const ok = a && b && a.linhas === b.linhas && a.hash === b.hash;
    return `| ${rotulo} | \`${tabela}\` | ${a?.linhas ?? '—'} | ${b?.linhas ?? '—'} | ${ok ? '✅ idêntico' : '❌ diferente'} |`;
  };
  const chave = new Set(TABELAS_CHAVE.map((t) => t.tabela));
  const outras = original.filter((t) => !chave.has(t.tabela));

  const md = `# Restauração da cópia de segurança (RNF-05, tarefa 9.1)

Gerado automaticamente por \`npm run verificar-restauracao\` em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.

## Resultado

**${diferencas.length === 0 ? '✅ Restauração conferida: o banco restaurado é idêntico ao original' : '❌ A restauração NÃO ficou idêntica'}** (${original.length} tabelas, ${original.reduce((s, t) => s + t.linhas, 0)} registros).
${diferencas.length ? '\nDiferenças:\n' + diferencas.map((x) => `- ${x}`).join('\n') + '\n' : ''}
## O que foi feito

1. Banco de origem: \`${rel(BANCO)}\` (base de demonstração em uso; dados fictícios).
2. Cópia de segurança gerada com a API de backup do SQLite: \`${rel(copia)}\` (integridade conferida com \`PRAGMA integrity_check\`).
3. A cópia foi restaurada em um **ambiente de verificação separado**: \`${rel(restaurado)}\`. O banco de demonstração não foi alterado.
4. Para cada tabela, comparamos o número de linhas e um hash SHA-256 de **todas as colunas de todas as linhas** (ids, níveis, versões, autoras, datas, justificativas). Hash igual = conteúdo igual.

## Vínculos, histórico, versões e autoria

| O quê | Tabela | Linhas no original | Linhas no restaurado | Conteúdo |
|---|---|---|---|---|
${TABELAS_CHAVE.map((t) => linhaTabela(t.tabela, t.rotulo)).join('\n')}

Demais tabelas: ${outras.map((t) => `\`${t.tabela}\` (${t.linhas}) ${d.get(t.tabela)?.hash === t.hash ? '✅' : '❌'}`).join(', ')}.

O teste automático \`server/src/operacao/copia-seguranca.spec.ts\` repete o ciclo com uma correção registrada (versão 2 + revisão com justificativa e autora), estraga os dados depois da cópia e confirma que a restauração devolve exatamente o conteúdo da cópia.
`;
  writeFileSync(EVIDENCIA, md);
  console.log(`Cópia: ${rel(copia)}`);
  console.log(`Restaurada em: ${rel(restaurado)}`);
  console.log(diferencas.length === 0 ? `RESTAURAÇÃO IDÊNTICA (${original.length} tabelas).` : `DIFERENÇAS:\n${diferencas.join('\n')}`);
  console.log(`Evidência: ${rel(EVIDENCIA)}`);
  if (diferencas.length) process.exit(1);
}

const [comando, arg] = process.argv.slice(2);
const acoes: Record<string, () => Promise<void>> = { backup, restaurar: () => restaurar(arg), verificar };
(acoes[comando] ?? (async () => { console.error('Uso: backup | restaurar <arquivo> | verificar'); process.exit(1); }))()
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(2); });
