/**
 * Tarefa 8.3 / RF-14 — casos de referência CR-01 a CR-24 executados com as MESMAS funções de domain/
 * que alimentam ficha e painel (D01). Tudo em memória: nenhum dado pedagógico é lido ou gravado.
 * Fixtures: NC = 0, D = 1, C = 2, ausência = null (nunca 0).
 */
import { avaliarAtencao, LIMITE_LACUNAS } from '../../domain/atencao';
import { calcularLacunas, Marcacao, resumoAnual, SituacaoLacuna } from '../../domain/lacunas';
import { agregadosVisiveis, agregar, AlunoPainel, evolucaoEscrita, fracao } from '../../domain/painel';
import { CAT_DEMO_5 } from '../../database/seed/catalogo-demo.fixture';
import { idsDaEtapa } from '../../database/seed/cat-v1';

/** Agrupa os casos por assunto, para a tela (linguagem da escola, não do código). */
export type Tema = 'PERCENTUAL' | 'LACUNAS' | 'ATENCAO' | 'PAINEL' | 'ACESSO';

export type StatusCaso = 'APROVADO' | 'FALHOU' | 'FORA_DA_TELA';

export interface ResultadoCaso {
  id: string; tema: Tema; descricao: string; entrada: string; esperado: string; obtido: string; status: StatusCaso; evidencia?: string;
}

interface Caso {
  id: string; tema: Tema; descricao: string; entrada: string; esperado: string;
  /** Executa e devolve o texto obtido; o caso passa se for igual ao esperado. */
  executar?: () => string;
  /** Casos de autorização: provados por integração, nunca simulados na tela (spec, "Contratos dos casos"). */
  foraDaTela?: string;
  /** Onde mais o caso é verificado (ex.: integração). */
  evidencia?: string;
}

/** Fração em linguagem de escola: "2 de 4 = 50,0%". */
const fmt = (n: number, d: number) => {
  const f = fracao(n, d);
  return f.percentual === null ? 'Sem dados (0 de 0)' : `${n} de ${d} = ${f.percentual}`;
};

/** Monta alunos do painel a partir de listas de níveis (null = ausência). */
const alunoDe = (niveis: Array<number | null>, ids: string[]): AlunoPainel => ({
  skillIds: ids,
  respostas: Object.fromEntries(ids.flatMap((id, i) => (niveis[i] === null ? [] : [[id, niveis[i] as number]]))),
  escrita: 3, atencao: 'SEM_SINAL', lacunas: [],
});

let seq = 0;
const marca = (skillId: string, anoLetivo: number, bimestre: number, nivel: number, tipo: Marcacao['tipo'] = 'AVALIACAO'): Marcacao =>
  ({ skillId, contextId: anoLetivo === 2025 ? 1 : 2, anoLetivo, bimestre, nivel, tipo, autorId: 1, seq: ++seq });
const ctx2025 = (ids: string[]) => [{ contextId: 1, anoLetivo: 2025, etapa: 1, skillIds: ids }];
const REF = { anoLetivo: 2026, bimestre: 3 };
const MOTIVO: Record<string, string> = { LACUNAS: 'lacunas', ESCRITA: 'escrita', MANUAL: 'registro manual' };
const situacao = (r: ReturnType<typeof avaliarAtencao>) =>
  r.estado === 'EM_ATENCAO' ? `Em atenção (${r.motivos.map((m) => MOTIVO[m] ?? m.toLowerCase()).join(' e ')})`
    : r.estado === 'INCOMPLETA' ? 'Atenção não concluída (falta a escrita)' : 'Sem sinal de atenção';
const SITUACAO_LACUNA: Record<SituacaoLacuna, string> = {
  NAO_CONSOLIDADA: 'Não consolidada', EM_DESENVOLVIMENTO: 'Em desenvolvimento', SEM_AVALIACAO: 'Sem avaliação registrada', CONSOLIDADA: 'Consolidada',
};

const CASOS: Caso[] = [
  // ---- contas de porcentagem ----
  { id: 'CR-01', tema: 'PERCENTUAL', descricao: 'Porcentagem de habilidades consolidadas',
    entrada: 'Uma criança com 4 habilidades: Consolidada, Consolidada, Em desenvolvimento, Não consolidada.', esperado: '2 de 4 = 50,0%',
    executar: () => { const r = agregar([alunoDe([2, 2, 1, 0], ['A', 'B', 'C', 'D'])]); return fmt(r.pares.C, r.pares.T); } },
  { id: 'CR-02', tema: 'PERCENTUAL', descricao: 'Conta que não dá exata', entrada: '7 consolidadas de 12 (7 ÷ 12 = 58,333…).', esperado: '7 de 12 = 58,3%', executar: () => fmt(7, 12) },
  { id: 'CR-03', tema: 'PERCENTUAL', descricao: 'Conta sem erro de computador', entrada: '1 de 8 (o computador costuma errar na última casa).', esperado: '1 de 8 = 12,5%', executar: () => fmt(1, 8) },
  { id: 'CR-04', tema: 'PERCENTUAL', descricao: 'Arredondamento para cima', entrada: '2 de 3 (66,666…).', esperado: '2 de 3 = 66,7%', executar: () => fmt(2, 3) },
  { id: 'CR-12', tema: 'PERCENTUAL', descricao: 'Empate exato no arredondamento', entrada: '1 de 16 (6,25: exatamente no meio).', esperado: '1 de 16 = 6,3%', executar: () => fmt(1, 16) },
  { id: 'CR-13', tema: 'PERCENTUAL', descricao: 'Nada para contar', entrada: '0 de 0 (nenhuma resposta prevista).', esperado: 'Sem dados (0 de 0)', executar: () => fmt(0, 0) },

  // ---- lacunas herdadas ----
  { id: 'CR-05', tema: 'LACUNAS', descricao: 'Vale a última avaliação do ano anterior',
    entrada: 'Em 2025: Consolidada no 2º bimestre e Não consolidada no 4º.', esperado: 'Lacuna: Não consolidada',
    executar: () => {
      const r = calcularLacunas({ contextosElegiveis: ctx2025(['H01-LP01']), marcacoes: [marca('H01-LP01', 2025, 2, 2), marca('H01-LP01', 2025, 4, 0)], referencia: REF });
      return `Lacuna: ${SITUACAO_LACUNA[r.itens[0].situacao]}`;
    } },
  { id: 'CR-06', tema: 'LACUNAS', descricao: 'Consolidar agora não apaga o passado',
    entrada: 'Em desenvolvimento em 2025; consolidada em 2026.',
    esperado: 'Lacunas: 1 → 0; registro de 2025 continua Em desenvolvimento',
    executar: () => {
      const base = [marca('H01-LP01', 2025, 4, 1)];
      const antes = calcularLacunas({ contextosElegiveis: ctx2025(['H01-LP01']), marcacoes: base, referencia: REF }).decomposicao.total;
      const depois = [...base, marca('H01-LP01', 2026, 2, 2, 'CONSOLIDACAO')];
      const agora = calcularLacunas({ contextosElegiveis: ctx2025(['H01-LP01']), marcacoes: depois, referencia: REF }).decomposicao.total;
      const resumo = resumoAnual(['H01-LP01'], depois.filter((m) => m.anoLetivo === 2025)).get('H01-LP01')?.nivel;
      return `Lacunas: ${antes} → ${agora}; registro de 2025 continua ${resumo === 1 ? 'Em desenvolvimento' : String(resumo)}`;
    } },
  { id: 'CR-07', tema: 'LACUNAS', descricao: 'Habilidade nunca avaliada',
    entrada: 'Habilidade prevista em 2025, mas ninguém registrou nada.',
    esperado: 'Sem avaliação registrada; conta 1 lacuna; sem nível',
    executar: () => {
      const r = calcularLacunas({ contextosElegiveis: ctx2025(['H01-MAT04']), marcacoes: [], referencia: REF });
      return `${SITUACAO_LACUNA[r.itens[0].situacao]}; conta ${r.decomposicao.total} lacuna; ${r.itens[0].ultima === null ? 'sem nível' : 'com nível'}`;
    } },
  { id: 'CR-23', tema: 'LACUNAS', descricao: 'Consulta de antes da consolidação',
    entrada: 'Em desenvolvimento em 2025; consolidada no 3º bim. de 2026; consulta feita no 2º bim. de 2026.',
    esperado: 'No 2º bimestre a lacuna ainda aparece',
    executar: () => {
      const m = [marca('H01-LP01', 2025, 4, 1), marca('H01-LP01', 2026, 3, 2, 'CONSOLIDACAO')];
      const r = calcularLacunas({ contextosElegiveis: ctx2025(['H01-LP01']), marcacoes: m, referencia: { anoLetivo: 2026, bimestre: 2 } });
      return `No 2º bimestre a lacuna ${r.itens[0].pendente ? 'ainda aparece' : 'já sumiu'}`;
    } },

  // ---- atenção pedagógica ----
  { id: 'CR-08', tema: 'ATENCAO', descricao: 'Uma lacuna só não basta', entrada: '2º ano, 3º bimestre: 1 lacuna e escrita Alfabética.',
    esperado: 'Sem sinal de atenção', executar: () => situacao(avaliarAtencao({ lacunasPendentes: 1, escrita: 3, etapa: 2, bimestre: 3, manuaisAtivas: 0 })) },
  { id: 'CR-09', tema: 'ATENCAO', descricao: 'Limite 1 existe só no teste', entrada: 'O mesmo caso anterior, mas com o limite trocado para 1 (só no teste).',
    esperado: `Em atenção (lacunas); o sistema continua com limite ${LIMITE_LACUNAS}`,
    executar: () => `${situacao(avaliarAtencao({ lacunasPendentes: 1, escrita: 3, etapa: 2, bimestre: 3, manuaisAtivas: 0, limite: 1 }))}; o sistema continua com limite ${LIMITE_LACUNAS}` },
  { id: 'CR-14', tema: 'ATENCAO', descricao: 'Duas lacunas já dão atenção', entrada: '2º ano, 3º bimestre: 2 lacunas e escrita Alfabética.', esperado: 'Em atenção (lacunas)',
    executar: () => situacao(avaliarAtencao({ lacunasPendentes: 2, escrita: 3, etapa: 2, bimestre: 3, manuaisAtivas: 0 })) },
  { id: 'CR-10', tema: 'ATENCAO', descricao: 'Escrita um pouco abaixo do esperado', entrada: '2º ano, 3º bimestre: escrita Silábico-alfabética (esperado: Alfabética).', esperado: 'Em atenção (escrita)',
    executar: () => situacao(avaliarAtencao({ lacunasPendentes: 0, escrita: 2, etapa: 2, bimestre: 3, manuaisAtivas: 0 })) },
  { id: 'CR-15', tema: 'ATENCAO', descricao: 'Escrita bem abaixo, sem lacunas', entrada: '2º ano, 3º bimestre: nenhuma lacuna e escrita Silábica.', esperado: 'Em atenção (escrita)',
    executar: () => situacao(avaliarAtencao({ lacunasPendentes: 0, escrita: 1, etapa: 2, bimestre: 3, manuaisAtivas: 0 })) },
  { id: 'CR-16', tema: 'ATENCAO', descricao: 'Escrita não registrada', entrada: 'Nenhuma lacuna e a escrita do bimestre ainda não foi registrada.', esperado: 'Atenção não concluída (falta a escrita)',
    executar: () => situacao(avaliarAtencao({ lacunasPendentes: 0, escrita: null, etapa: 2, bimestre: 3, manuaisAtivas: 0 })) },
  { id: 'CR-17', tema: 'ATENCAO', descricao: 'Vários motivos, uma criança só', entrada: '3 lacunas, escrita Silábica e uma atenção registrada pela professora.',
    esperado: '3 motivos aparecem; a criança conta 1 vez',
    executar: () => {
      const r = avaliarAtencao({ lacunasPendentes: 3, escrita: 1, etapa: 2, bimestre: 3, manuaisAtivas: 1 });
      const ag = agregar([{ ...alunoDe([], []), atencao: r.estado }]);
      return `${r.motivos.length} motivos aparecem; a criança conta ${ag.emAtencao.n} vez`;
    } },

  // ---- painel e evolução da escrita ----
  { id: 'CR-19', tema: 'PAINEL', descricao: 'Falta de registro não vira nota baixa', entrada: 'Respostas: Consolidada, Em desenvolvimento, (sem registro), Não consolidada.',
    esperado: 'Consolidação 1 de 4 = 25,0%; avaliadas 3 de 4 = 75,0%; 1 sem registro',
    executar: () => {
      const r = agregar([alunoDe([2, 1, null, 0], ['A', 'B', 'C', 'D'])]);
      return `Consolidação ${fmt(r.pares.C, r.pares.T)}; avaliadas ${fmt(r.pares.T - r.pares.U, r.pares.T)}; ${r.pares.U} sem registro`;
    } },
  { id: 'CR-18', tema: 'PAINEL', descricao: 'Grupo pequeno fica oculto', entrada: 'Uma turma de 4 crianças e outra de 5.', esperado: '4 crianças: oculto; 5 crianças: exibido',
    evidencia: 'Também testado para professora e coordenação em painel.spec.ts.',
    executar: () => `4 crianças: ${agregadosVisiveis(4) ? 'exibido' : 'oculto'}; 5 crianças: ${agregadosVisiveis(5) ? 'exibido' : 'oculto'}` },
  { id: 'CR-11', tema: 'PAINEL', descricao: 'Quantas crianças avançaram na escrita', entrada: 'Duas crianças com escrita nos dois bimestres; uma avançou, a outra ficou igual.', esperado: '1 de 2 crianças avançaram',
    executar: () => { const e = evolucaoEscrita([{ a: 1, b: 2 }, { a: 2, b: 2 }]); return `${e.E} de ${e.V} crianças avançaram`; } },
  { id: 'CR-20', tema: 'PAINEL', descricao: 'Evolução quando falta uma escrita', entrada: 'Três crianças; uma não tem escrita no 1º bimestre comparado; das outras duas, uma avançou.',
    esperado: '1 de 2 crianças avançaram; 1 sem comparação',
    executar: () => { const e = evolucaoEscrita([{ a: null, b: 3 }, { a: 1, b: 3 }, { a: 2, b: 1 }]); return `${e.E} de ${e.V} crianças avançaram; ${e.semComparacao} sem comparação`; } },
  { id: 'CR-22', tema: 'PAINEL', descricao: 'Catálogo novo não muda turma antiga', entrada: 'Turma de 8 crianças no catálogo atual (8 habilidades); sai uma versão nova com 9.',
    esperado: 'A turma continua com 8 × 8 = 64 respostas previstas',
    executar: () => {
      const v1 = idsDaEtapa(2);
      const v2 = [...v1, 'H02-NOVA'];
      void v2; // a versão nova existe, mas cada contexto usa o catálogo fixado nele
      const r = agregar(Array.from({ length: 8 }, () => alunoDe([], v1)));
      return `A turma continua com 8 × ${v1.length} = ${r.pares.T} respostas previstas`;
    } },
  { id: 'CR-24', tema: 'PAINEL', descricao: 'Turma completa de exemplo', entrada: '8 crianças × 5 habilidades; consolidadas por habilidade: 6, 3, 4, 3 e 1.',
    esperado: 'Turma: 17 de 40 = 42,5%; por habilidade: 75,0%, 37,5%, 50,0%, 37,5%, 12,5%',
    executar: () => {
      const ids = CAT_DEMO_5.map((h) => h.id);
      const consolidados = [6, 3, 4, 3, 1];
      const alunos = Array.from({ length: 8 }, (_, k) => alunoDe(ids.map((_, s) => (k < consolidados[s] ? 2 : 1)), ids));
      const r = agregar(alunos);
      return `Turma: ${fmt(r.pares.C, r.pares.T)}; por habilidade: ${r.porHabilidade.map((h) => h.consolidacao.percentual).join(', ')}`;
    } },

  // ---- acesso ----
  { id: 'CR-21', tema: 'ACESSO', descricao: 'Quem pode ver e editar', entrada: 'Uma professora tenta abrir aluno de outra turma; a coordenação tenta editar uma avaliação.',
    esperado: 'As duas tentativas são bloqueadas',
    foraDaTela: 'Testado direto no servidor (acesso.spec.ts, avaliacao.spec.ts, ficha.spec.ts, painel.spec.ts). Esta tela não simula permissões.' },
];

/**
 * Executa todos os casos. `falhaControlada` (só demonstração, tarefa 8.3) troca o esperado de um caso
 * por um valor errado, para provar que a tela mostra a falha de verdade em vez de um sucesso fixo.
 */
export function executarCasos(falhaControlada?: string): { total: number; aprovados: number; falhas: number; foraDaTela: number; casos: ResultadoCaso[] } {
  const casos: ResultadoCaso[] = CASOS.map((c) => {
    const esperado = c.id === falhaControlada ? `${c.esperado} (trocada de propósito para a demonstração)` : c.esperado;
    if (c.foraDaTela) return { id: c.id, tema: c.tema, descricao: c.descricao, entrada: c.entrada, esperado, obtido: '—', status: 'FORA_DA_TELA', evidencia: c.foraDaTela };
    let obtido: string;
    try {
      obtido = c.executar!();
    } catch (e) {
      obtido = `Erro: ${(e as Error).message}`;
    }
    return { id: c.id, tema: c.tema, descricao: c.descricao, entrada: c.entrada, esperado, obtido, status: obtido === esperado ? 'APROVADO' : 'FALHOU', evidencia: c.evidencia };
  });
  const executados = casos.filter((c) => c.status !== 'FORA_DA_TELA');
  return {
    total: executados.length,
    aprovados: executados.filter((c) => c.status === 'APROVADO').length,
    falhas: executados.filter((c) => c.status === 'FALHOU').length,
    foraDaTela: casos.length - executados.length,
    casos,
  };
}
