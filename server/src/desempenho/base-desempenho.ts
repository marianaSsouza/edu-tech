import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { carregarCatalogo } from '../modules/catalogo/carregar-catalogo';
import {
  Enrollment, Observation, Period, SchoolClass, SkillResponse, Student, TeacherLink, User, WritingResponse, YearClosure,
} from '../database/entities';
import { CATALOGO_VERSAO_ATUAL, idsDaEtapa } from '../database/seed/cat-v1';
import { SENHA_DEMO } from '../database/seed/seed';

/**
 * Tarefa 9.3 / RNF-06 — base de referência para medir desempenho: 500 alunos e cinco anos letivos (2022–2026).
 * Tudo sintético e gerado por fórmula (nomes "Aluno 0001"…), sem nenhum dado pedagógico real.
 * Vai para um arquivo separado (data/desempenho.sqlite, fora do git), nunca para a base de demonstração.
 *
 * Estrutura: em 2026 há 100 alunos em cada ano (1º ao 5º), em 4 turmas de 25 (A–D).
 * Cada aluno tem um contexto por ano cursado desde que entrou no 1º ano: quem está no 5º ano tem 5 anos de histórico.
 * 2022–2025 estão encerrados; em 2026 os bimestres 1–3 estão fechados e o 4º está aberto (para os salvamentos).
 */
export const ANOS = [2022, 2023, 2024, 2025, 2026];
const ANO_ATUAL = 2026;
const LETRAS = ['A', 'B', 'C', 'D'];
const POR_TURMA = 25;

const datasPeriodos = (ano: number): Array<[string, string]> => [
  [`${ano}-02-09`, `${ano}-04-24`], [`${ano}-04-27`, `${ano}-07-03`], [`${ano}-07-20`, `${ano}-09-25`], [`${ano}-09-28`, `${ano}-12-18`],
];

/** Gerador pseudoaleatório fixo: a base sai sempre igual, a medição é reproduzível. */
function gerador(semente: number) {
  let s = semente >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 2 ** 32; };
}

export interface ResumoBase {
  alunos: number; anos: number; turmas: number; contextos: number; respostasHabilidade: number; respostasEscrita: number; observacoes: number;
}

async function inserirEmLotes<T>(m: EntityManager, entidade: new () => T, linhas: Array<Partial<T>>, lote = 300) {
  for (let i = 0; i < linhas.length; i += lote) await m.insert(entidade, linhas.slice(i, i + lote) as never);
}

export async function criarBaseDesempenho(ds: DataSource): Promise<ResumoBase> {
  await carregarCatalogo(ds);
  const rnd = gerador(20261116);
  const senhaHash = bcrypt.hashSync(SENHA_DEMO, 10);

  return ds.transaction(async (m) => {
    await m.save(m.create(User, { nome: 'Coordenação (desempenho)', email: 'coordenacao@escola.exemplo', senhaHash, papel: 'COORDENACAO' }));

    // professoras: uma por (ano escolar, letra); dá aula na mesma "posição" todos os anos
    const prof = new Map<string, number>();
    for (let e = 1; e <= 5; e++) {
      for (const L of LETRAS) {
        const u = await m.save(m.create(User, { nome: `Profª ${e}º ${L}`, email: `prof${e}${L.toLowerCase()}@escola.exemplo`, senhaHash, papel: 'PROFESSOR' }));
        prof.set(`${e}${L}`, u.id);
      }
    }

    // calendário
    for (const ano of ANOS) {
      const datas = datasPeriodos(ano);
      for (let b = 1; b <= 4; b++) {
        await m.insert(Period, { anoLetivo: ano, bimestre: b, inicio: datas[b - 1][0], fim: datas[b - 1][1], estado: ano < ANO_ATUAL || b < 4 ? 'FECHADO' : 'ABERTO' });
      }
      if (ano < ANO_ATUAL) await m.insert(YearClosure, { anoLetivo: ano });
    }

    // turmas e vínculos: só existem as combinações (ano, etapa) com alunos
    const turma = new Map<string, number>();
    const vinculos: Array<Partial<TeacherLink>> = [];
    for (const ano of ANOS) {
      for (let e = 1; e <= 5; e++) {
        const etapaEm2026 = e + (ANO_ATUAL - ano);
        if (etapaEm2026 > 5) continue;
        for (const L of LETRAS) {
          const t = await m.save(m.create(SchoolClass, { nome: `${e}º ${L}`, etapa: e, anoLetivo: ano }));
          turma.set(`${ano}-${e}${L}`, t.id);
          vinculos.push({ userId: prof.get(`${e}${L}`)!, classId: t.id, tipo: 'TITULAR', de: `${ano}-02-02`, ate: ano < ANO_ATUAL ? `${ano}-12-18` : null });
        }
      }
    }
    await inserirEmLotes(m, TeacherLink, vinculos);

    // alunos, contextos e matrículas
    const habilidades: Array<Partial<SkillResponse>> = [];
    const escritas: Array<Partial<WritingResponse>> = [];
    const observacoes: Array<Partial<Observation>> = [];
    let seq = 0;
    let contextos = 0;
    let numero = 0;
    for (let g = 1; g <= 5; g++) {
      for (const L of LETRAS) {
        for (let k = 0; k < POR_TURMA; k++) {
          numero++;
          const aluno = await m.save(m.create(Student, { nome: `Aluno ${String(numero).padStart(4, '0')}` }));
          const habilidadeBase = rnd(); // alunos com mais e menos facilidade
          for (let ano = ANO_ATUAL - (g - 1); ano <= ANO_ATUAL; ano++) {
            const e = g - (ANO_ATUAL - ano);
            const ctx = await m.query(
              `INSERT INTO contextos_pedagogicos (studentId, anoLetivo, etapa, catalogVersion) VALUES (?, ?, ?, ?) RETURNING id`,
              [aluno.id, ano, e, CATALOGO_VERSAO_ATUAL],
            );
            const contextId = ctx[0].id as number;
            contextos++;
            await m.insert(Enrollment, { contextId, classId: turma.get(`${ano}-${e}${L}`)!, de: `${ano}-02-02`, ate: ano < ANO_ATUAL ? `${ano}-12-18` : null });
            const autorId = prof.get(`${e}${L}`)!;
            const bims = ano < ANO_ATUAL ? 4 : 3; // 4º bimestre de 2026 fica para os salvamentos medidos
            for (let b = 1; b <= bims; b++) {
              for (const skillId of idsDaEtapa(e)) {
                const r = rnd();
                if (r < 0.05) continue; // ~5% sem avaliação (ausência = sem linha)
                const p = Math.min(0.95, habilidadeBase * 0.6 + b * 0.1);
                const nivel = r < p ? 2 : r < p + 0.25 ? 1 : 0;
                habilidades.push({ contextId, skillId, catalogVersion: CATALOGO_VERSAO_ATUAL, bimestre: b, nivel, autorId, seq: ++seq });
              }
              if (rnd() > 0.04) {
                escritas.push({ contextId, bimestre: b, nivel: Math.min(3, Math.floor(habilidadeBase * 2 + (e - 1) + b * 0.5)), autorId });
              }
              if (rnd() < 0.15) observacoes.push({ contextId, bimestre: b, autorId, texto: 'Observação sintética para a medição de desempenho.' });
            }
          }
        }
      }
    }
    await inserirEmLotes(m, SkillResponse, habilidades);
    await inserirEmLotes(m, WritingResponse, escritas);
    await inserirEmLotes(m, Observation, observacoes);
    await m.query(`INSERT INTO sequencias (nome, valor) VALUES ('registro', ?) ON CONFLICT(nome) DO UPDATE SET valor = excluded.valor`, [seq]);

    return {
      alunos: numero, anos: ANOS.length, turmas: turma.size, contextos,
      respostasHabilidade: habilidades.length, respostasEscrita: escritas.length, observacoes: observacoes.length,
    };
  });
}
