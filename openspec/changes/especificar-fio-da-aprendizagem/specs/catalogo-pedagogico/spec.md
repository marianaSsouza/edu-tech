# Spec Delta

## Purpose

Definir o conjunto de habilidades disponível por etapa escolar e preservar identidade, rubrica e versões dos catálogos usados nas avaliações.

## ADDED Requirements

### Requirement: Catálogo inicial por etapa
O sistema SHALL entregar CAT-v1 com os 40 IDs, descrições e exemplos da seção 4 de `docs/requisitos.md` v1.2: oito habilidades por etapa do 1º ao 5º ano, quatro de LP e quatro de MAT. Exemplos SHALL orientar observação, sem constituir prova obrigatória ou limiar automático. O recorte MUST NOT ser apresentado como currículo completo ou códigos oficiais BNCC. Rastreabilidade: RN10, RF-02, CA-02.1.

#### Scenario: Catálogo do segundo ano
- **WHEN** uma turma do 2º ano vinculada a CAT-v1 abre a avaliação
- **THEN** oferece H02-LP01 a H02-LP04 e H02-MAT01 a H02-MAT04, com as descrições da fonte documental.

### Requirement: Rubrica e ausência
O sistema SHALL oferecer Não consolidada, Em desenvolvimento e Consolidada. Sem avaliação SHALL representar ausência, sem constituir nível pedagógico ou valor zero. A rubrica SHALL distinguir habilidade não demonstrada mesmo com apoio, demonstração parcial/instável/com apoio e demonstração consistente/autônoma, respectivamente. Rastreabilidade: RN03, RN14, CA-02.3.

#### Scenario: Habilidade sem evidência registrada
- **WHEN** uma habilidade não tem resposta
- **THEN** aparece como Sem avaliação, distinta de Não consolidada.

#### Scenario: Regressão observada
- **WHEN** a professora avalia como Não consolidada uma habilidade consolidada em bimestre anterior
- **THEN** a nova marcação é aceita no novo período sem apagar a anterior, sem exigir evolução monotônica.

### Requirement: Versão fixada e identidade estável
O sistema SHALL fixar o catálogo no contexto letivo. Revisão editorial SHALL criar nova versão para novos contextos, conservando textos, respostas e denominadores antigos. Professores e coordenação MUST NOT editar catálogo ou matriz em uso. Equivalência entre versões SHALL exigir decisão explícita; nomes semelhantes não estabelecem equivalência. Rastreabilidade: RN10, CR-22.

#### Scenario: Publicação de CAT-v2
- **WHEN** uma versão posterior do produto acrescenta CAT-v2
- **THEN** os contextos CAT-v1 continuam com seus textos, respostas e denominadores originais.

#### Scenario: Habilidades semelhantes
- **WHEN** duas habilidades de etapas ou versões diferentes têm nomes parecidos
- **THEN** não são fundidas nem comparadas como equivalentes automaticamente.

### Requirement: Separação do catálogo demonstrativo
O sistema SHALL manter o catálogo de cinco habilidades dos casos de referência separado de CAT-v1, sem usar seus denominadores em turmas CAT-v1. Rastreabilidade: CR-24; requisitos seção 4.

#### Scenario: Reprodução da captura
- **WHEN** o caso sintético usa oito crianças e cinco habilidades
- **THEN** utiliza 40 pares previstos, enquanto uma turma CAT-v1 com oito crianças utiliza 64 pares.
