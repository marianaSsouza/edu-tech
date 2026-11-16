# Spec Delta

## Purpose

Identificar pendências de habilidades dos anos cursados e acompanhar consolidações posteriores sem apagar avaliações ou duplicar habilidades repetidas.

## ADDED Requirements

### Requirement: Elegibilidade de contextos anteriores
O sistema SHALL considerar habilidades previstas em todos os anos anteriores cursados e encerrados ao menos uma vez, inclusive repetência e anos reabertos para correção. MUST NOT inferir habilidades de anos não cursados, histórico externo desconhecido ou bimestres futuros. Rastreabilidade: RN07, RF-06; decisão de reabertura.

#### Scenario: Primeiro ano sem histórico
- **WHEN** o aluno cursa o 1º ano e não possui contexto escolar anterior conhecido
- **THEN** não recebe lacunas herdadas fabricadas.

#### Scenario: Ano anterior reaberto
- **WHEN** o ano anterior é reaberto depois da passagem de ano
- **THEN** suas habilidades permanecem elegíveis para herança.

### Requirement: Última marcação e ausência herdada
Para cada habilidade elegível, o sistema SHALL usar a última marcação válida até a referência. Não consolidada ou Em desenvolvimento SHALL gerar pendência pedagógica; habilidade nunca marcada SHALL gerar pendência Sem avaliação registrada. Ambas SHALL contar em atenção, com decomposição visível. Ausência posterior MUST NOT apagar marcação anterior. Rastreabilidade: RN07/14, RF-06, CR-05/07.

#### Scenario: Regressão no último bimestre
- **WHEN** uma habilidade consolidada no segundo bimestre recebe Não consolidada no quarto
- **THEN** é herdada como pendência pedagógica no ano seguinte.

#### Scenario: Nunca avaliada
- **WHEN** uma habilidade prevista em contexto anterior elegível nunca teve marcação
- **THEN** entra na contagem como Sem avaliação registrada, sem receber nível pedagógico negativo.

#### Scenario: Ausência após marcação
- **WHEN** a habilidade tem Em desenvolvimento no segundo bimestre e ausência nos posteriores
- **THEN** a marcação continua determinando a pendência e as ausências são apresentadas separadamente.

### Requirement: Deduplicação por identidade
O sistema SHALL contar habilidades distintas por ID estável, não por número de eventos ou anos repetidos. Habilidades diferentes MUST NOT ser equivalentes por semelhança textual. Rastreabilidade: CA-06.3, RN10.

#### Scenario: Mesma habilidade em repetência
- **WHEN** o mesmo ID aparece em dois anos cursados por repetência
- **THEN** conta no máximo uma pendência, usando a marcação válida mais recente entre os contextos elegíveis e posteriores aplicáveis.

### Requirement: Consolidação e reavaliação com origem
A professora atual autorizada SHALL consolidar ou reavaliar habilidade herdada por evento próprio em período aberto, com evidência/justificativa, autora, data, contexto e origem. Consolidação SHALL retirar a pendência atual; reavaliação posterior não consolidada SHALL reabri-la. O original MUST NOT ser apagado. Rastreabilidade: RF-07, CA-07.1–07.4, CR-06.

#### Scenario: Consolidação reduz o total de dois para um
- **WHEN** a professora consolida uma de duas habilidades pendentes
- **THEN** a contagem atual passa a um, a avaliação anterior permanece e somente o motivo automático por quantidade é removido.

#### Scenario: Reabertura pedagógica
- **WHEN** uma habilidade herdada consolidada recebe evento posterior Em desenvolvimento
- **THEN** volta à contagem, mantendo ambos os eventos no histórico.

### Requirement: Ordem pedagógica e correções
O sistema SHALL ordenar marcações pelo período pedagógico; eventos distintos no mesmo período SHALL seguir a ordem de registro. Revisões SHALL substituir a versão vigente do mesmo registro sem mudar sua posição original. Editar avaliação antiga MUST NOT fazê-la superar evento pedagógico posterior. Rastreabilidade: RN02/07, CR-23; decisão de precedência.

#### Scenario: Eventos distintos no mesmo bimestre
- **WHEN** uma consolidação é seguida de reavaliação Não consolidada no mesmo bimestre
- **THEN** prevalece a reavaliação registrada depois.

#### Scenario: Correção de evento anterior
- **WHEN** um evento antigo é corrigido após uma consolidação pedagogicamente posterior
- **THEN** a consolidação posterior continua prevalecendo; a revisão antiga conserva sua posição.

### Requirement: Corte histórico e recomputação
O sistema SHALL calcular a herança na referência consultada e identificar avanços posteriores separadamente. Correções retroativas SHALL atualizar a situação corrigida dos períodos afetados sem aplicar eventos pedagógicos futuros ao passado. Rastreabilidade: RNF-01, CR-23.

#### Scenario: Histórico antes do avanço
- **WHEN** a consulta antecede o período da consolidação
- **THEN** a habilidade continua pendente naquele contexto, mesmo que já esteja consolidada atualmente.
