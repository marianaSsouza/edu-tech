// GERADO a partir da seção 4 de docs/requisitos.md (v1.2). Não editar à mão: CAT-v1 é imutável (D08).
export interface HabilidadeCatalogo { id: string; etapa: number; area: 'LP' | 'MAT'; texto: string; exemplo: string }

export const CAT_V1: HabilidadeCatalogo[] = [
  { id: "H01-LP01", etapa: 1, area: "LP", texto: "Lê palavras simples", exemplo: "Ler palavras familiares em lista e contexto" },
  { id: "H01-LP02", etapa: 1, area: "LP", texto: "Escreve palavras estabelecendo relações entre letras e sons", exemplo: "Produzir lista de objetos com escrita própria" },
  { id: "H01-LP03", etapa: 1, area: "LP", texto: "Identifica informação explícita em texto curto lido com apoio", exemplo: "Responder quem participa de uma história" },
  { id: "H01-LP04", etapa: 1, area: "LP", texto: "Relata acontecimentos em sequência compreensível", exemplo: "Recontar uma experiência com início e continuidade" },
  { id: "H01-MAT01", etapa: 1, area: "MAT", texto: "Conta, compara e registra quantidades até 100", exemplo: "Contar coleção e comparar dois conjuntos" },
  { id: "H01-MAT02", etapa: 1, area: "MAT", texto: "Resolve situações simples de adição e subtração com apoio de estratégias próprias", exemplo: "Representar juntar ou retirar objetos" },
  { id: "H01-MAT03", etapa: 1, area: "MAT", texto: "Reconhece e continua padrões simples", exemplo: "Completar sequência de cores, formas ou números" },
  { id: "H01-MAT04", etapa: 1, area: "MAT", texto: "Reconhece formas e descreve posições no espaço", exemplo: "Identificar formas em objetos e indicar trajetos" },
  { id: "H02-LP01", etapa: 2, area: "LP", texto: "Lê frases e pequenos textos com compreensão", exemplo: "Explicar o assunto de um pequeno texto" },
  { id: "H02-LP02", etapa: 2, area: "LP", texto: "Escreve frases com segmentação entre palavras", exemplo: "Produzir frases compreensíveis com separação de palavras" },
  { id: "H02-LP03", etapa: 2, area: "LP", texto: "Localiza informações explícitas em textos", exemplo: "Encontrar data ou personagem em texto curto" },
  { id: "H02-LP04", etapa: 2, area: "LP", texto: "Produz e revisa pequeno texto com apoio", exemplo: "Escrever bilhete e revisar clareza com a professora" },
  { id: "H02-MAT01", etapa: 2, area: "MAT", texto: "Resolve problemas de adição e subtração", exemplo: "Escolher e explicar estratégia em situação cotidiana" },
  { id: "H02-MAT02", etapa: 2, area: "MAT", texto: "Compara e ordena números até 1.000", exemplo: "Ordenar cartões e justificar maior e menor" },
  { id: "H02-MAT03", etapa: 2, area: "MAT", texto: "Compara medidas em situações cotidianas", exemplo: "Comparar comprimentos e durações com unidades adequadas" },
  { id: "H02-MAT04", etapa: 2, area: "MAT", texto: "Interpreta informações de tabela ou gráfico simples", exemplo: "Identificar categoria com maior quantidade" },
  { id: "H03-LP01", etapa: 3, area: "LP", texto: "Lê textos curtos com autonomia e identifica seu assunto", exemplo: "Apresentar o tema após leitura individual" },
  { id: "H03-LP02", etapa: 3, area: "LP", texto: "Localiza informações e faz inferências simples apoiadas no texto", exemplo: "Explicar sentimento de personagem com pistas" },
  { id: "H03-LP03", etapa: 3, area: "LP", texto: "Produz texto curto com sequência e pontuação básica", exemplo: "Elaborar relato compreensível com começo, meio e fim" },
  { id: "H03-LP04", etapa: 3, area: "LP", texto: "Revisa segmentação e regularidades ortográficas trabalhadas", exemplo: "Corrigir texto próprio com orientação" },
  { id: "H03-MAT01", etapa: 3, area: "MAT", texto: "Lê, compara e compõe números até a ordem de unidade de milhar", exemplo: "Decompor números e explicar valor posicional" },
  { id: "H03-MAT02", etapa: 3, area: "MAT", texto: "Resolve problemas de adição, subtração e agrupamentos multiplicativos", exemplo: "Comparar estratégias para grupos iguais" },
  { id: "H03-MAT03", etapa: 3, area: "MAT", texto: "Resolve situações de medida e uso de dinheiro", exemplo: "Calcular valores e comparar comprimentos ou durações" },
  { id: "H03-MAT04", etapa: 3, area: "MAT", texto: "Organiza dados e interpreta tabelas e gráficos", exemplo: "Construir tabela de pesquisa da turma e tirar conclusões" },
  { id: "H04-LP01", etapa: 4, area: "LP", texto: "Identifica tema e informações centrais de textos", exemplo: "Resumir assunto e selecionar informações relevantes" },
  { id: "H04-LP02", etapa: 4, area: "LP", texto: "Infere informações e justifica com pistas do texto", exemplo: "Explicar relação entre acontecimentos" },
  { id: "H04-LP03", etapa: 4, area: "LP", texto: "Produz texto organizado em parágrafos e adequado à finalidade", exemplo: "Escrever relato ou explicação para leitor definido" },
  { id: "H04-LP04", etapa: 4, area: "LP", texto: "Revisa coesão, pontuação e ortografia trabalhadas", exemplo: "Melhorar repetições e clareza em texto próprio" },
  { id: "H04-MAT01", etapa: 4, area: "MAT", texto: "Compara e decompõe números até a ordem de dezena de milhar", exemplo: "Explicar valor de algarismos em diferentes posições" },
  { id: "H04-MAT02", etapa: 4, area: "MAT", texto: "Resolve problemas envolvendo as quatro operações com números naturais", exemplo: "Selecionar operação e verificar plausibilidade" },
  { id: "H04-MAT03", etapa: 4, area: "MAT", texto: "Reconhece frações usuais e representações decimais em contextos familiares", exemplo: "Representar metade e quartos e interpretar preços" },
  { id: "H04-MAT04", etapa: 4, area: "MAT", texto: "Resolve situações de medidas e interpreta dados apresentados em tabelas e gráficos", exemplo: "Explicar cálculo de perímetro e comparar dados de uma pesquisa" },
  { id: "H05-LP01", etapa: 5, area: "LP", texto: "Compreende textos e distingue informação explícita de inferência", exemplo: "Indicar o que o texto diz e o que se conclui com pistas" },
  { id: "H05-LP02", etapa: 5, area: "LP", texto: "Compara informações de textos sobre um mesmo tema", exemplo: "Identificar concordâncias e diferenças entre fontes fornecidas" },
  { id: "H05-LP03", etapa: 5, area: "LP", texto: "Produz texto com finalidade, organização e articulação de ideias", exemplo: "Escrever texto informativo para público definido" },
  { id: "H05-LP04", etapa: 5, area: "LP", texto: "Revisa texto com crescente autonomia", exemplo: "Melhorar coesão, pontuação e ortografia em revisão própria" },
  { id: "H05-MAT01", etapa: 5, area: "MAT", texto: "Compara e representa números naturais, frações e decimais em situações adequadas", exemplo: "Relacionar representações usuais em uma reta numérica" },
  { id: "H05-MAT02", etapa: 5, area: "MAT", texto: "Resolve problemas com operações e verifica resultados por estimativa", exemplo: "Explicar estratégia e avaliar se o resultado faz sentido" },
  { id: "H05-MAT03", etapa: 5, area: "MAT", texto: "Resolve situações de medidas, perímetro e área com representações", exemplo: "Comparar contorno e superfície em malha quadriculada" },
  { id: "H05-MAT04", etapa: 5, area: "MAT", texto: "Interpreta tabelas, gráficos e situações simples de chance", exemplo: "Justificar conclusões e comparar possibilidades de eventos" },
];

export const CATALOGO_VERSAO_ATUAL = 'CAT-v1';

/** IDs de uma etapa, na ordem do catálogo (LP01..LP04, MAT01..MAT04). */
export function idsDaEtapa(etapa: number): string[] {
  return CAT_V1.filter((h) => h.etapa === etapa).map((h) => h.id);
}
