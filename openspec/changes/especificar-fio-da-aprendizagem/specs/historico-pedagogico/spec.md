# Spec Delta

## Purpose

Disponibilizar a trajetória individual entre anos e professoras, preservando versões e distinguindo o contexto original dos avanços posteriores.

## ADDED Requirements

### Requirement: Trajetória individual contextualizada
O sistema SHALL apresentar linha do tempo por ano letivo, etapa, turma, professora e bimestre, incluindo habilidades, escrita e observações com autoria. Períodos sem resposta SHALL aparecer explicitamente. O acesso SHALL seguir `acesso-e-permissoes`. Rastreabilidade: RF-05, CA-04.2, CA-05.1–05.3, PRO-03.

#### Scenario: Trajetória de dois anos
- **WHEN** uma professora atual abre aluno com registros de dois anos letivos
- **THEN** consulta os dois contextos e suas autoras, incluindo bimestres sem avaliação.

### Requirement: Histórico corrigido com versões anteriores
A consulta histórica SHALL mostrar a versão corrigida do período com revisão identificada e acesso ao original. O sistema MUST NOT oferecer um segundo modo de painel que reconstrua o conhecimento disponível em uma data antiga. Eventos pedagógicos posteriores SHALL aparecer separadamente, sem alterar indicadores de períodos anteriores. Rastreabilidade: RN06, RNF-01, CR-23; decisão de consulta histórica.

#### Scenario: Correção retroativa autorizada
- **WHEN** uma avaliação antiga recebe correção autorizada
- **THEN** o painel daquele período reflete a resposta corrigida, identifica a revisão e permite consultar a versão anterior.

#### Scenario: Consolidação posterior
- **WHEN** a consulta de 2025 é aberta após consolidação de uma lacuna em 2026
- **THEN** a avaliação de 2025 permanece no contexto de 2025 e o avanço de 2026 é identificado separadamente, sem integrar o indicador de 2025.

### Requirement: Resumo anual distinto do quarto bimestre
O resumo anual SHALL usar a última marcação válida de cada habilidade até o fechamento, sem substituir avaliações bimestrais. SHALL apresentar a última observação não vazia e acesso a todas as observações. Ausência no bimestre final MUST NOT apagar marcação anterior. Rastreabilidade: RF-05; requisitos seção 6.

#### Scenario: Quarto bimestre sem resposta
- **WHEN** a habilidade foi consolidada no segundo bimestre e não foi avaliada novamente
- **THEN** o resumo anual considera a consolidação e o quarto bimestre continua exibindo Sem avaliação.

### Requirement: Auditoria preservada
Avaliações, revisões, vínculos, eventos e encerramentos SHALL conservar autor, instante e contexto, incluindo referências de origem quando aplicáveis. Textos pedagógicos MUST NOT integrar logs técnicos comuns. Rastreabilidade: RNF-01/03.

#### Scenario: Consulta de revisão
- **WHEN** o usuário autorizado abre uma revisão de avaliação
- **THEN** identifica valor original, versão vigente, autora, momento e contexto da alteração sem depender de logs técnicos.

### Requirement: Histórico externo indisponível
O sistema SHALL identificar histórico externo não fornecido como Histórico anterior indisponível, sem inventar avaliações ou afirmar inexistência de lacunas. Essa limitação SHALL permanecer separada do estado de atenção. Rastreabilidade: RN14; decisão de informação incompleta.

#### Scenario: Aluno ingressante sem prontuário
- **WHEN** um ingressante não possui histórico anterior conhecido
- **THEN** a ficha exibe a limitação, sem criar lacunas para etapas desconhecidas.
