import { DataSource, EntityManager } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { nextSeq } from '../../common/sequence';
import { carregarCatalogo } from '../../modules/catalogo/carregar-catalogo';
import {
  Enrollment, EstadoPeriodo, ManualAttention, AttentionEvent, Observation, PedagogicalContext,
  PedagogicalEvent, Period, SchoolClass, SkillResponse, Student, TeacherLink, User, WritingResponse, YearClosure,
} from '../entities';
import { CATALOGO_VERSAO_ATUAL, idsDaEtapa } from './cat-v1';

export const SENHA_DEMO = 'demo1234';

/**
 * Perfis da base fictícia (escola fictícia, dados sintéticos — D11/Migration Plan).
 * h25 = 8 habilidades do 1º ano ao fim de 2025; h26 = 8 habilidades do 2º ano no 3º bimestre de 2026.
 * Dígito 0/1/2 = nível; 'x' = nunca avaliada (ausência, não zero). w25/w26 = escrita por bimestre.
 */
interface AlunoDemo {
  nome: string; turma26: '2º A' | '2º B';
  h25: string; w25: string; h26: string; w26: string; obs25?: string; obs26?: string;
}
const ALUNOS: AlunoDemo[] = [
  { nome: 'Ana Clara', turma26: '2º A', h25: '22222222', w25: '0123', h26: '21211221', w26: '333', obs25: 'Gosta de ler em voz alta para a turma.', obs26: 'Desafios extras de leitura.' },
  { nome: 'Bernardo', turma26: '2º A', h25: '211101xx', w25: '0011', h26: '10100010', w26: '122', obs25: 'Letras móveis e sentar perto da lousa.', obs26: 'Leitura individual 10 min por dia com a professora.' },
  { nome: 'Cecília', turma26: '2º A', h25: '22212222', w25: '0123', h26: '22221222', w26: '333', obs25: 'Trabalha melhor em dupla.' },
  { nome: 'Davi', turma26: '2º A', h25: '22122211', w25: '0122', h26: '21111111', w26: '223', obs25: 'Uma tarefa de cada vez; pausas curtas após o recreio.', obs26: 'Pausas de movimento entre atividades.' },
  { nome: 'Elisa', turma26: '2º A', h25: '22222222', w25: '1233', h26: '22222222', w26: '333', obs25: 'Autônoma; pode ser monitora.' },
  { nome: 'Felipe', turma26: '2º A', h25: '211221x1', w25: '0112', h26: '11110100', w26: '222', obs25: 'Material concreto e jogos de sílabas.' },
  { nome: 'Giovana', turma26: '2º A', h25: '222212x2', w25: '0123', h26: '21211222', w26: '233', obs25: 'Tímida em grupo; fala mais em dupla.' },
  { nome: 'Heitor', turma26: '2º A', h25: '22222222', w25: '0223', h26: '22121222', w26: '333', obs25: 'Aprende rápido com músicas.' },
  // 2º B: só 4 crianças, abaixo do grupo mínimo de 5 (D10)
  { nome: 'Isadora', turma26: '2º B', h25: '22222222', w25: '0123', h26: '22211222', w26: '333' },
  { nome: 'João', turma26: '2º B', h25: '22112111', w25: '0112', h26: '11110110', w26: '223' },
  { nome: 'Lara', turma26: '2º B', h25: '22222222', w25: '1233', h26: '22222222', w26: '333' },
  { nome: 'Mateus', turma26: '2º B', h25: '22212222', w25: '0123', h26: '21211122', w26: '233' },
];

const PERIODOS: Record<number, Array<[string, string]>> = {
  2025: [['2025-02-10', '2025-04-25'], ['2025-04-28', '2025-07-04'], ['2025-07-21', '2025-09-26'], ['2025-09-29', '2025-12-19']],
  2026: [['2026-02-09', '2026-04-24'], ['2026-04-27', '2026-07-03'], ['2026-07-20', '2026-09-25'], ['2026-09-28', '2026-12-18']],
};

/** Carrega CAT-v1 (sempre) e a base fictícia (só se o banco estiver vazio). Repetir não duplica identidades. */
export async function seedDatabase(ds: DataSource, opts: { reset?: boolean } = {}): Promise<{ criado: boolean }> {
  if (opts.reset) {
    await ds.dropDatabase();
    await ds.synchronize();
  }
  await carregarCatalogo(ds);
  if ((await ds.getRepository(User).count()) > 0) return { criado: false };
  await ds.transaction((m) => criarBaseFicticia(m));
  return { criado: true };
}

async function criarBaseFicticia(m: EntityManager): Promise<void> {
  ALUNOS.forEach((a) => {
    if (a.h25.length !== 8 || a.h26.length !== 8 || a.w25.length !== 4 || a.w26.length !== 3) {
      throw new Error(`Perfil inválido na base fictícia: ${a.nome}`);
    }
  });

  // ---- contas (senha única de demonstração) ----
  const senhaHash = bcrypt.hashSync(SENHA_DEMO, 10);
  const novoUsuario = (nome: string, email: string, papel: 'PROFESSOR' | 'COORDENACAO') =>
    m.save(m.create(User, { nome, email, senhaHash, papel }));
  const coord = await novoUsuario('Coordenação Pedagógica', 'coordenacao@escola.exemplo', 'COORDENACAO');
  const ana = await novoUsuario('Profª Ana Paula', 'ana.paula@escola.exemplo', 'PROFESSOR');
  const beatriz = await novoUsuario('Profª Beatriz', 'beatriz@escola.exemplo', 'PROFESSOR');
  const carlos = await novoUsuario('Prof. Carlos', 'carlos@escola.exemplo', 'PROFESSOR');
  const debora = await novoUsuario('Profª Débora', 'debora@escola.exemplo', 'PROFESSOR');
  void coord;

  // ---- turmas e vínculos (titular e substituta coexistem no 2º A) ----
  const t1A25 = await m.save(m.create(SchoolClass, { nome: '1º A', etapa: 1, anoLetivo: 2025 }));
  const t2A26 = await m.save(m.create(SchoolClass, { nome: '2º A', etapa: 2, anoLetivo: 2026 }));
  const t2B26 = await m.save(m.create(SchoolClass, { nome: '2º B', etapa: 2, anoLetivo: 2026 }));
  await m.insert(TeacherLink, [
    { userId: ana.id, classId: t1A25.id, tipo: 'TITULAR', de: '2025-02-03', ate: '2025-12-19' },
    { userId: beatriz.id, classId: t2A26.id, tipo: 'TITULAR', de: '2026-02-02', ate: null },
    { userId: debora.id, classId: t2A26.id, tipo: 'SUBSTITUTA', de: '2026-08-03', ate: null },
    { userId: carlos.id, classId: t2B26.id, tipo: 'TITULAR', de: '2026-02-02', ate: null },
  ]);

  // ---- calendário: 2025 encerrado; 2026 com 1º e 2º bimestres fechados ----
  for (const ano of [2025, 2026]) {
    for (let i = 0; i < 4; i++) {
      const estado: EstadoPeriodo = ano === 2025 || i < 2 ? 'FECHADO' : 'ABERTO';
      await m.insert(Period, { anoLetivo: ano, bimestre: i + 1, inicio: PERIODOS[ano][i][0], fim: PERIODOS[ano][i][1], estado });
    }
  }
  await m.insert(YearClosure, { anoLetivo: 2025 });

  // ---- alunos, contextos (2025/1º ano e 2026/2º ano) e matrículas ----
  const base = new Map<string, { a: AlunoDemo; studentId: number; c25: number; c26: number; prof26: User }>();
  for (const a of ALUNOS) {
    const s = await m.save(m.create(Student, { nome: a.nome }));
    const c25 = await m.save(m.create(PedagogicalContext, { studentId: s.id, anoLetivo: 2025, etapa: 1, catalogVersion: CATALOGO_VERSAO_ATUAL }));
    const c26 = await m.save(m.create(PedagogicalContext, { studentId: s.id, anoLetivo: 2026, etapa: 2, catalogVersion: CATALOGO_VERSAO_ATUAL }));
    const turma26 = a.turma26 === '2º A' ? t2A26 : t2B26;
    await m.insert(Enrollment, [
      { contextId: c25.id, classId: t1A25.id, de: '2025-02-03', ate: '2025-12-19' },
      { contextId: c26.id, classId: turma26.id, de: '2026-02-02', ate: null },
    ]);
    base.set(a.nome, { a, studentId: s.id, c25: c25.id, c26: c26.id, prof26: a.turma26 === '2º A' ? beatriz : carlos });
  }

  // ---- habilidades: ordem cronológica (o `seq` global reflete a ordem de registro, D05) ----
  const lanca = async (contextId: number, skillId: string, bimestre: number, nivel: number, autorId: number) => {
    await m.insert(SkillResponse, {
      contextId, skillId, catalogVersion: CATALOGO_VERSAO_ATUAL, bimestre, nivel, autorId, seq: await nextSeq(m),
    });
  };
  for (const bim of [2, 4]) {
    for (const { a, c25 } of base.values()) {
      for (const [i, skillId] of idsDaEtapa(1).entries()) {
        if (a.h25[i] === 'x') continue; // nunca avaliada: sem linha
        const v = Number(a.h25[i]);
        await lanca(c25, skillId, bim, bim === 2 ? Math.max(0, v - 1) : v, ana.id);
      }
    }
  }
  for (const bim of [1, 3]) {
    for (const { a, c26, prof26 } of base.values()) {
      for (const [i, skillId] of idsDaEtapa(2).entries()) {
        const v = Number(a.h26[i]);
        await lanca(c26, skillId, bim, bim === 1 ? Math.max(0, v - 1) : v, prof26.id);
      }
    }
  }

  // ---- escrita e observações ----
  for (const { a, c25, c26, prof26 } of base.values()) {
    for (const [i, ch] of [...a.w25].entries()) await m.insert(WritingResponse, { contextId: c25, bimestre: i + 1, nivel: Number(ch), autorId: ana.id });
    for (const [i, ch] of [...a.w26].entries()) await m.insert(WritingResponse, { contextId: c26, bimestre: i + 1, nivel: Number(ch), autorId: prof26.id });
    if (a.obs25) await m.insert(Observation, { contextId: c25, bimestre: 4, autorId: ana.id, texto: a.obs25 });
    if (a.obs26) await m.insert(Observation, { contextId: c26, bimestre: 3, autorId: prof26.id, texto: a.obs26 });
  }

  // ---- eventos de referência: consolidação posterior e atenção manual ----
  const bernardo = base.get('Bernardo')!;
  await m.insert(PedagogicalEvent, {
    seq: await nextSeq(m), tipo: 'CONSOLIDACAO', contextId: bernardo.c26, origemContextId: bernardo.c25,
    skillId: 'H01-LP02', bimestre: 3, nivel: 2, autorId: beatriz.id,
    justificativa: 'Passou a escrever palavras com letras móveis de forma autônoma.',
  });
  const davi = base.get('Davi')!;
  const atencao = await m.save(m.create(ManualAttention, {
    studentId: davi.studentId, autorId: beatriz.id, anoLetivo: 2026, bimestre: 3,
    justificativa: 'Acompanhar a concentração nas atividades de leitura; reavaliar no 4º bimestre.',
  }));
  await m.insert(AttentionEvent, { attentionId: atencao.id, tipo: 'COMENTARIO', texto: 'Funcionou combinar pausas curtas entre as atividades.', autorId: beatriz.id });
}
