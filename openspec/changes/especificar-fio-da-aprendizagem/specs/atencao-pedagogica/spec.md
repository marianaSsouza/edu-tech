# Spec Delta

## Purpose

Sinalizar necessidades de acompanhamento com motivos explicáveis, distinguindo critérios automáticos, ausência de informação e atenção manual docente.

## ADDED Requirements

### Requirement: Expectativa de escrita por etapa e bimestre
O sistema SHALL comparar escrita registrada à matriz abaixo, na ordem Pré-silábico < Silábico < Silábico-alfabético < Alfabético. A matriz SHALL ser política do projeto, sem atribuição normativa à BNCC; níveis não são notas e não representam todas as dimensões de alfabetização. Rastreabilidade: RN04, DEC-13.

#### Scenario: Matriz de mínimos
- **WHEN** o sistema determina o mínimo para a etapa e o bimestre selecionados
- **THEN** utiliza exatamente a seguinte matriz:

| Ano escolar | 1º bimestre | 2º bimestre | 3º bimestre | 4º bimestre |
| --- | --- | --- | --- | --- |
| 1º | Pré-silábico | Silábico | Silábico | Silábico-alfabético |
| 2º | Silábico-alfabético | Silábico-alfabético | Alfabético | Alfabético |
| 3º | Alfabético | Alfabético | Alfabético | Alfabético |
| 4º | Alfabético | Alfabético | Alfabético | Alfabético |
| 5º | Alfabético | Alfabético | Alfabético | Alfabético |

### Requirement: Atenção automática explicável
O sistema SHALL sinalizar motivo automático quando lacunas herdadas pendentes >= 2 OU escrita registrada abaixo do mínimo. SHALL exibir todos os motivos conhecidos e contar o aluno uma vez. O limite 2 SHALL ser fixo no produto; parâmetro 1 pertence somente a teste. Rastreabilidade: RN08, RF-08, CA-08.1–08.6, CR-08–10/14/15/17.

#### Scenario: Limite e igualdade
- **WHEN** o aluno tem uma lacuna, escrita igual ao mínimo e nenhuma atenção manual
- **THEN** aparece Sem sinal de atenção nos dados disponíveis.

#### Scenario: Duas lacunas com escrita adequada
- **WHEN** o aluno tem duas lacunas e escrita no mínimo esperado
- **THEN** aparece Em atenção por lacunas.

#### Scenario: Escrita abaixo do mínimo
- **WHEN** o aluno do 2º ano tem escrita Silábico-alfabético no terceiro bimestre e nenhuma lacuna
- **THEN** aparece Em atenção por escrita.

#### Scenario: Múltiplos motivos
- **WHEN** o aluno tem duas lacunas, escrita abaixo e uma atenção manual ativa
- **THEN** todos os três motivos aparecem e o indicador conta uma criança.

### Requirement: Ausência e informação incompleta
Escrita ausente SHALL manter comparação indeterminada, sem transportar escrita anterior. Sem outro motivo conhecido SHALL exibir Atenção automática não concluída: escrita sem avaliação; com outro motivo SHALL exibir Em atenção e a ausência adicional. Histórico externo indisponível SHALL ser limitação separada, sem novo estado de atenção. Rastreabilidade: CA-08.7, CR-16; decisão de histórico indisponível.

#### Scenario: Sem escrita e sem outro motivo
- **WHEN** o aluno não tem escrita registrada nem motivo conhecido de atenção
- **THEN** aparece comparação automática incompleta, sem afirmar escrita adequada.

#### Scenario: Lacunas com escrita ausente
- **WHEN** o aluno tem duas lacunas e escrita ausente
- **THEN** aparece Em atenção por lacunas e Sem avaliação de escrita.

#### Scenario: Histórico externo desconhecido
- **WHEN** a escrita está adequada, não há pendência conhecida nem atenção manual e o histórico externo está indisponível
- **THEN** aparece Sem sinal de atenção nos dados disponíveis e a limitação do histórico permanece visível separadamente.

### Requirement: Abertura e autoria de atenção manual
O sistema SHALL permitir à professora atual abrir atenções manuais distintas por aluno, com ID, justificativa de 1 a 2.000 caracteres não vazios, autora, data e situação. Somente a autora autorizada SHALL corrigir o texto original, preservando revisão. A coordenação SHALL apenas consultar. Rastreabilidade: RN09, RF-09, CA-09.1–09.4.

#### Scenario: Justificativa vazia
- **WHEN** a professora tenta abrir atenção com texto vazio ou somente espaços
- **THEN** a operação é rejeitada.

#### Scenario: Motivos coexistentes
- **WHEN** a professora abre uma atenção justificada para aluno já acompanhado por outro motivo manual
- **THEN** as duas atenções mantêm IDs, textos e autoras próprios.

### Requirement: Ciclo de vida manual independente
Professora com vínculo atual SHALL comentar, encerrar com justificativa ou reabrir atenção com motivo, registrando quem agiu e quando. Avanço automático, passagem de ano ou transferência MUST NOT encerrá-la automaticamente. Ações atuais SHALL respeitar o corte histórico mesmo com bimestre original fechado. Rastreabilidade: CA-09.5, CR-23; decisão de fechamento.

#### Scenario: Sucessora encerra atenção
- **WHEN** a professora sucessora encerra uma atenção manual com justificativa
- **THEN** a atenção fica encerrada atualmente, mantendo a autora original e o evento de encerramento pela sucessora.

#### Scenario: Melhora automática
- **WHEN** desaparecem todos os motivos automáticos de aluno com atenção manual ativa
- **THEN** o aluno continua Em atenção pelo motivo manual até encerramento explícito.

#### Scenario: Reabertura
- **WHEN** uma professora atual reabre uma atenção encerrada com motivo
- **THEN** um evento atual reativa a atenção e preserva abertura e encerramento anteriores.
