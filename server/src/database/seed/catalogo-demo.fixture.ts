/**
 * Fixture SEPARADA de CAT-v1 (requisitos, seção 4 / CR-24): as cinco habilidades da captura do 2º ano,
 * usadas só pelos casos de referência para reproduzir 17/40 (8 crianças × 5 habilidades).
 * NÃO é carregada no banco e NUNCA compartilha denominador com turmas CAT-v1 (8 crianças × 8 = 64).
 */
export const CAT_DEMO_5 = [
  { id: 'DEMO-LP01', texto: 'Lê frases e pequenos textos com compreensão' },
  { id: 'DEMO-LP02', texto: 'Escreve frases com segmentação correta' },
  { id: 'DEMO-LP03', texto: 'Localiza informações explícitas em textos' },
  { id: 'DEMO-MAT01', texto: 'Resolve problemas de adição e subtração' },
  { id: 'DEMO-MAT02', texto: 'Compara e ordena números até 1000' },
] as const;
