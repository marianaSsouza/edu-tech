# Spec Delta

## Purpose

Organizar os quatro bimestres da escola e controlar períodos de registro, fechamento e reabertura sem desfazer a trajetória escolar.

## ADDED Requirements

### Requirement: Calendário único e referência temporal
O sistema SHALL manter um calendário por ano letivo para toda a escola, com quatro bimestres e datas definidas pela coordenação no fuso America/Sao_Paulo. Período passado SHALL usar seu último dia como referência, mesmo reaberto; período em andamento SHALL usar a data de consulta. Bimestres futuros MUST NOT permitir registros ou indicadores. Rastreabilidade: RN01, RF-01; decisão de calendário.

#### Scenario: Período passado reaberto
- **WHEN** um bimestre passado é consultado após reabertura
- **THEN** a população de referência continua sendo a do último dia daquele bimestre.

#### Scenario: Período futuro
- **WHEN** o usuário seleciona bimestre cuja data inicial ainda não chegou
- **THEN** o sistema informa que o período ainda não está disponível para registro ou indicadores.

### Requirement: Fechamento com ausências explícitas
A coordenação SHALL fechar e reabrir bimestres com justificativa e trilha de autoria/data. Fechamento SHALL apresentar ausências e aceitar registros incompletos, sem fabricar avaliações. Ano letivo SHALL fechar somente após os quatro bimestres encerrados. Rastreabilidade: RF-13, CA-13.2/13.3, RNF-03.

#### Scenario: Fechar bimestre incompleto
- **WHEN** a coordenação confirma o fechamento após consultar a lista de ausências
- **THEN** o bimestre é fechado e as ausências permanecem como Sem avaliação.

#### Scenario: Ano com período aberto
- **WHEN** a coordenação tenta fechar um ano com um dos quatro bimestres aberto
- **THEN** o fechamento do ano é impedido até o encerramento de todos eles.

### Requirement: Bloqueios por período
O sistema SHALL bloquear avaliações, observações e eventos de lacunas em período fechado. Ações atuais sobre atenção manual SHALL continuar disponíveis a docentes autorizados, com data atual e sem modificar a situação histórica anterior. Rastreabilidade: RF-13; decisão sobre limite do fechamento.

#### Scenario: Tentativa de editar avaliação fechada
- **WHEN** a autora vinculada tenta salvar uma avaliação de bimestre fechado
- **THEN** o sistema nega a alteração e apresenta o estado Período fechado.

#### Scenario: Encerramento atual de atenção manual
- **WHEN** uma professora atual encerra justificadamente uma atenção manual após o fechamento do bimestre de abertura
- **THEN** um evento atual encerra a atenção, mantendo-a ativa nas consultas anteriores ao encerramento.

### Requirement: Reabertura preserva encerramento anterior
Reabrir bimestre de ano fechado SHALL exigir reabertura do ano com justificativa. Reabrir SHALL permitir correções autorizadas sem desfazer passagem de ano, matrículas posteriores ou elegibilidade das habilidades para herança. Correções SHALL recalcular pendências respeitando eventos posteriores. Rastreabilidade: RF-13, RN07; decisão de reabertura.

#### Scenario: Reabertura após passagem de ano
- **WHEN** a coordenação reabre um ano anteriormente encerrado
- **THEN** a matrícula do ano seguinte permanece e as habilidades do ano reaberto continuam elegíveis para herança.
- **AND** uma correção antiga não supera consolidação pedagógica de período posterior.
