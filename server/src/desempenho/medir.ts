/**
 * Tarefa 9.3 / RNF-06 — medição de desempenho de referência.
 *
 *   npm run desempenho        (na pasta do projeto)
 *
 * 1. Recria data/desempenho.sqlite com a base de 500 alunos e 5 anos (base-desempenho.ts). Fora do git.
 * 2. Sobe a aplicação de verdade (NestJS + SQLite) numa porta livre. A inicialização NÃO entra na medição.
 * 3. Executa 30 operações pela API HTTP, uma de cada vez: 10 consultas de painel, 10 de ficha e 10 salvamentos.
 * 4. Meta: pelo menos 29 de 30 em até 2 s. Grava o relatório em docs/evidencias/desempenho-rnf06.md.
 */
import 'reflect-metadata';
import { existsSync, rmSync, writeFileSync } from 'fs';
import { cpus, totalmem, release, type } from 'os';
import { join } from 'path';
import { performance } from 'perf_hooks';
import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { buildDataSourceOptions } from '../database/data-source';
import { criarBaseDesempenho, ResumoBase } from './base-desempenho';

const RAIZ = join(__dirname, '..', '..', '..');
const ARQUIVO = join(RAIZ, 'data', 'desempenho.sqlite');
const RELATORIO = join(RAIZ, 'docs', 'evidencias', 'desempenho-rnf06.md');
const LIMITE_MS = 2000;

interface Operacao { n: number; tipo: 'Painel' | 'Ficha' | 'Salvamento'; descricao: string; ms: number; status: number; bytes: number }

async function main() {
  // ---- 1. base de referência ----
  for (const sufixo of ['', '-wal', '-shm']) if (existsSync(ARQUIVO + sufixo)) rmSync(ARQUIVO + sufixo);
  const t0 = performance.now();
  const ds = new DataSource(buildDataSourceOptions(ARQUIVO));
  await ds.initialize();
  const resumo = await criarBaseDesempenho(ds);
  const turmas2026: Array<{ id: number; nome: string; etapa: number }> = await ds.query(`SELECT id, nome, etapa FROM turmas WHERE anoLetivo = 2026 ORDER BY etapa, nome`);
  // fichas: alunos do 5º ano (cinco anos de histórico, o caso mais pesado) e de outros anos
  const fichas: Array<{ id: number; nome: string; etapa: number }> = await ds.query(
    `SELECT a.id, a.nome, c.etapa FROM alunos a JOIN contextos_pedagogicos c ON c.studentId = a.id AND c.anoLetivo = 2026
     WHERE a.id IN (5, 140, 260, 380, 401, 420, 440, 460, 480, 500) ORDER BY a.id`,
  );
  // salvamentos: alunos do 2º A, no 4º bimestre de 2026 (aberto), pela professora titular
  const ctx2A: Array<{ contextId: number }> = await ds.query(
    `SELECT c.id AS contextId FROM contextos_pedagogicos c JOIN matriculas m ON m.contextId = c.id JOIN turmas t ON t.id = m.classId
     WHERE t.anoLetivo = 2026 AND t.nome = '2º A' ORDER BY c.id LIMIT 10`,
  );
  const habilidade2: string = (await ds.query(`SELECT id FROM habilidades_catalogo WHERE etapa = 2 ORDER BY ordem LIMIT 1`))[0].id;
  await ds.destroy();
  const segBase = (performance.now() - t0) / 1000;

  // ---- 2. aplicação real (inicialização fora da medição) ----
  process.env.DB_PATH = ARQUIVO;
  const { AppModule } = await import('../app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  await app.listen(0);
  const url = (await app.getUrl()).replace('[::1]', 'localhost');

  const entrar = async (email: string) => {
    const r = await fetch(`${url}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, senha: 'demo1234' }) });
    if (!r.ok) throw new Error(`Login falhou para ${email}: ${r.status}`);
    return (r.headers.get('set-cookie') ?? '').split(';')[0];
  };
  const coord = await entrar('coordenacao@escola.exemplo');
  const prof2A = await entrar('prof2a@escola.exemplo');

  // ---- 3. 30 operações, intercaladas ----
  const plano: Array<Omit<Operacao, 'n' | 'ms' | 'status' | 'bytes'> & { metodo: string; caminho: string; cookie: string; corpo?: unknown }> = [];
  for (let i = 0; i < 10; i++) {
    plano.push(i < 2
      ? { tipo: 'Painel', descricao: `Painel da escola (20 turmas de 2026)${i === 1 ? ', 2º bimestre' : ''}`, metodo: 'GET', caminho: `/api/painel${i === 1 ? '?bimestre=2' : ''}`, cookie: coord }
      : { tipo: 'Painel', descricao: `Painel da turma ${turmas2026[(i * 3) % 20].nome} (com evolução da escrita)`, metodo: 'GET', caminho: `/api/painel/turmas/${turmas2026[(i * 3) % 20].id}?bimestre=3`, cookie: coord });
    const f = fichas[i];
    plano.push({ tipo: 'Ficha', descricao: `Ficha de ${f.nome} (${f.etapa}º ano, ${f.etapa} ${f.etapa === 1 ? 'ano' : 'anos'} de histórico)`, metodo: 'GET', caminho: `/api/alunos/${f.id}/ficha`, cookie: coord });
    const c = ctx2A[i].contextId;
    plano.push(i % 2 === 0
      ? { tipo: 'Salvamento', descricao: `Habilidade ${habilidade2}, 4º bim., contexto ${c}`, metodo: 'PUT', caminho: `/api/contextos/${c}/habilidades/${habilidade2}`, cookie: prof2A, corpo: { bimestre: 4, nivel: 2 } }
      : { tipo: 'Salvamento', descricao: `Escrita, 4º bim., contexto ${c}`, metodo: 'PUT', caminho: `/api/contextos/${c}/escrita`, cookie: prof2A, corpo: { bimestre: 4, nivel: 3 } });
  }

  const ops: Operacao[] = [];
  for (const [i, p] of plano.entries()) {
    const ini = performance.now();
    const r = await fetch(url + p.caminho, {
      method: p.metodo,
      headers: { cookie: p.cookie, ...(p.corpo ? { 'content-type': 'application/json' } : {}) },
      body: p.corpo ? JSON.stringify(p.corpo) : undefined,
    });
    const corpo = await r.text(); // conta até a resposta inteira chegar
    ops.push({ n: i + 1, tipo: p.tipo, descricao: p.descricao, ms: performance.now() - ini, status: r.status, bytes: Buffer.byteLength(corpo) });
  }
  await app.close();

  // ---- 4. relatório ----
  const ok = ops.filter((o) => o.status >= 200 && o.status < 300 && o.ms <= LIMITE_MS).length;
  const erros = ops.filter((o) => o.status < 200 || o.status >= 300);
  const ordenados = ops.map((o) => o.ms).sort((a, b) => a - b);
  const pct = (p: number) => ordenados[Math.min(ordenados.length - 1, Math.ceil((p / 100) * ordenados.length) - 1)];
  const porTipo = (t: Operacao['tipo']) => { const x = ops.filter((o) => o.tipo === t).map((o) => o.ms); return { media: x.reduce((a, b) => a + b, 0) / x.length, max: Math.max(...x) }; };
  const ms = (v: number) => `${v.toFixed(0)} ms`;
  const aprovado = ok >= 29;

  const md = `# Medição de desempenho (RNF-06, tarefa 9.3)

Gerado automaticamente por \`npm run desempenho\` em ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.

## Resultado

**${aprovado ? '✅ Meta cumprida' : '❌ Meta NÃO cumprida'}: ${ok} de 30 operações terminaram em até 2 segundos** (meta: pelo menos 29).

| | Tempo |
|---|---|
| Mediana | ${ms(pct(50))} |
| 95% das operações até | ${ms(pct(95))} |
| Mais lenta | ${ms(ordenados[ordenados.length - 1])} |
| Painel (média / máximo) | ${ms(porTipo('Painel').media)} / ${ms(porTipo('Painel').max)} |
| Ficha (média / máximo) | ${ms(porTipo('Ficha').media)} / ${ms(porTipo('Ficha').max)} |
| Salvamento (média / máximo) | ${ms(porTipo('Salvamento').media)} / ${ms(porTipo('Salvamento').max)} |
${erros.length ? `\n⚠ Operações com erro HTTP: ${erros.map((o) => `#${o.n} (${o.status})`).join(', ')}.\n` : ''}
## Ambiente

| Item | Valor |
|---|---|
| Sistema | ${type()} ${release()} |
| Processador | ${cpus()[0]?.model.trim()} (${cpus().length} núcleos lógicos) |
| Memória | ${(totalmem() / 1024 ** 3).toFixed(1)} GB |
| Node.js | ${process.version} |
| Banco | SQLite (better-sqlite3), arquivo local, modo WAL |
| Execução | Servidor e cliente de medição na mesma máquina, via HTTP (localhost), sem cache; uma operação por vez |

## Base de referência (sintética)

| Item | Quantidade |
|---|---|
| Alunos | ${resumo.alunos} |
| Anos letivos | ${resumo.anos} (2022 a 2026; 2022–2025 encerrados) |
| Turmas | ${resumo.turmas} |
| Contextos pedagógicos (aluno × ano) | ${resumo.contextos} |
| Respostas de habilidade | ${resumo.respostasHabilidade.toLocaleString('pt-BR')} |
| Respostas de escrita | ${resumo.respostasEscrita.toLocaleString('pt-BR')} |
| Observações | ${resumo.observacoes} |

Criação da base: ${segBase.toFixed(1)} s (fora da medição). Nomes gerados ("Aluno 0001"…), níveis por fórmula com semente fixa: a base sai igual a cada execução.

## Condições

- A inicialização (criação da base, subida do NestJS e login) **não** entra na medição, conforme RNF-06.
- O tempo vai do envio da requisição até a resposta completa chegar.
- Painel e ficha consultados pela coordenação (vê toda a escola: é o caso mais pesado). Salvamentos feitos pela professora titular do 2º A no 4º bimestre de 2026, que está aberto.
- As fichas incluem alunos do 5º ano, com cinco anos de histórico e lacunas herdadas de quatro anos encerrados.

## As 30 operações

| # | Tipo | Operação | HTTP | Resposta | Tempo | Até 2 s? |
|---|---|---|---|---|---|---|
${ops.map((o) => `| ${o.n} | ${o.tipo} | ${o.descricao} | ${o.status} | ${(o.bytes / 1024).toFixed(1)} KB | ${ms(o.ms)} | ${o.status < 300 && o.ms <= LIMITE_MS ? 'sim' : '**não**'} |`).join('\n')}
`;
  writeFileSync(RELATORIO, md);

  console.log(`Base: ${JSON.stringify(resumo)} (${segBase.toFixed(1)} s)`);
  for (const o of ops) console.log(`${String(o.n).padStart(2)}  ${o.tipo.padEnd(10)} ${String(o.status)}  ${ms(o.ms).padStart(8)}  ${(o.bytes / 1024).toFixed(1).padStart(6)} KB  ${o.descricao}`);
  console.log(`\n${aprovado ? 'META CUMPRIDA' : 'META NÃO CUMPRIDA'}: ${ok}/30 em até 2 s. Mediana ${ms(pct(50))}, p95 ${ms(pct(95))}, máx ${ms(ordenados[ordenados.length - 1])}.`);
  console.log(`Relatório: ${RELATORIO}`);
  process.exit(aprovado ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(2); });
