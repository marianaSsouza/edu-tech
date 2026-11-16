# Proposal

## Why

O Fio da Aprendizagem precisa preservar a continuidade pedagógica de alunos do 1º ao 5º ano, evitando perda de avaliações e estratégias nas mudanças de turma, ano ou professora. Esta mudança transforma a Visão do Produto e os Requisitos v1.2 em contratos verificáveis para o MVP acadêmico de uma escola fictícia.

## What Changes

- Especificar acesso individual, gestão escolar e calendário de quatro bimestres.
- Especificar avaliações parciais, autoria, revisões e trajetória entre anos.
- Definir herança de habilidades, consolidação posterior e atenção automática/manual explicável.
- Especificar indicadores, cobertura, consulta da coordenação e ocultação de agregados pequenos nos dois perfis.
- Incorporar decisões sobre transferência, atuação simultânea de docentes, datas de referência e reabertura sem perder histórico.
- Preparar casos sintéticos e verificações rastreáveis aos IDs RN, RF, CA, CR e RNF existentes.
- Manter P0 e P1 como escopo do MVP completo. A execução desta proposta é exclusivamente planejamento; implementar requer iniciar apply posteriormente.

## Capabilities

### New Capabilities

- `acesso-e-permissoes`: contas individuais, papéis, vigência e proteção de autoria.
- `gestao-escolar`: cadastros, matrículas, vínculos e transições escolares.
- `catalogo-pedagogico`: CAT-v1, rubrica, identidade e versões das habilidades.
- `calendario-letivo`: datas, fechamento e reabertura de bimestres e anos.
- `avaliacao-bimestral`: habilidades, escrita, observações, persistência e revisões.
- `historico-pedagogico`: trajetória, versões corrigidas, originais e resumo anual.
- `lacunas-herdadas`: pendências, deduplicação, consolidação e reavaliação.
- `atencao-pedagogica`: matriz de escrita, motivos automáticos e atenção manual.
- `paineis-e-indicadores`: fórmulas, filtros, navegação e apresentação dos agregados.
- `regras-e-casos-de-referencia`: explicação das regras e execução dos casos sintéticos.

### Modified Capabilities

Nenhuma; não existem specs principais no projeto.

## Impact

O repositório contém documentação e configuração OpenSpec, sem implementação ou testes de aplicação identificados. Os artefatos ficam nesta change; não modificam código, os documentos-base nem as specs principais nesta etapa. Fontes: `docs/visao-do-produto.md` e `docs/requisitos.md` v1.2, complementadas pelas decisões registradas no design e nos cenários desta change.

A implementação futura abrangerá aplicação web, persistência, autenticação e testes com dados exclusivamente sintéticos. Ficam fora: múltiplas escolas, famílias/alunos como usuários, notas/ranking, IA, aplicativo nativo, offline, integrações, importações em massa, fusão automática e exportação de dados pessoais. O protótipo externo é referência desatualizada, não prova de comportamento implementado. Entrega prevista nos documentos: 18/11/2026, com candidata em 17/11; P0 isolado deve ser declarado parcial.
