# Spec Delta

## Purpose

Registrar evidências pedagógicas por bimestre com contexto inequívoco, autoria preservada, salvamento confiável e tratamento explícito das ausências.

## ADDED Requirements

### Requirement: Contexto e respostas únicas
O sistema SHALL identificar aluno, ano escolar, ano letivo e bimestre, mantendo uma resposta vigente por habilidade/contexto/bimestre e uma de escrita. Transferências no mesmo ano escolar e letivo SHALL preservar o registro; novas etapas SHALL ter contexto próprio. Trocar abas MUST NOT deslocar respostas entre períodos. Rastreabilidade: RN02, RF-01, CA-01.1–01.3.

#### Scenario: Troca de bimestre
- **WHEN** a professora muda do primeiro para o segundo bimestre de 2026 no 2º ano
- **THEN** cada resposta continua ligada ao período original e a interface distingue etapa escolar de ano letivo.

### Requirement: Avaliação parcial de habilidades e escrita
O sistema SHALL permitir salvar parcialmente habilidades do catálogo e escrita, sem respostas negativas padrão. Escrita SHALL oferecer Pré-silábico, Silábico, Silábico-alfabético e Alfabético, além de ausência. Cada resposta válida salva SHALL tornar-se vigente mesmo com conjunto incompleto. Rastreabilidade: RN03/04/14, RF-02/03, CA-13.1, CR-19.

#### Scenario: Salvar somente uma habilidade
- **WHEN** a professora salva uma habilidade e deixa as demais e a escrita sem resposta
- **THEN** a habilidade é preservada, as demais ficam Sem avaliação e a completude é exibida.

#### Scenario: Escrita em outro bimestre
- **WHEN** a professora registra escrita no segundo bimestre
- **THEN** a escrita do primeiro permanece e nenhum período ausente é preenchido automaticamente.

### Requirement: Observações independentes por autora
O sistema SHALL permitir observações opcionais vinculadas ao aluno/bimestre, cada uma com autora própria. O conjunto dos textos vigentes SHALL respeitar 4.000 caracteres por aluno/bimestre. Cada autora SHALL corrigir somente seu texto; outra professora SHALL acrescentar observação própria. Rastreabilidade: RN05, RF-04, CA-04.1–04.3; decisão de observações.

#### Scenario: Observações de duas professoras
- **WHEN** a sucessora acrescenta uma observação ao bimestre com texto da antecessora
- **THEN** ambos os textos mantêm autoria e o limite é verificado sobre o conjunto vigente.

#### Scenario: Limite e vazio
- **WHEN** o conjunto de observações ultrapassa 4.000 caracteres
- **THEN** o salvamento é rejeitado com explicação do limite; deixar observação vazia continua permitido.

### Requirement: Salvamento explícito e persistente
O sistema SHALL oferecer Salvar, confirmar sucesso somente após persistência e manter dados ao reabrir sessão. Falha SHALL apresentar erro recuperável sem sucesso falso. Sair com alterações não salvas SHALL emitir aviso. Rastreabilidade: RF-02/03/04/13, RNF-07, PRO-04.

#### Scenario: Reabrir sessão
- **WHEN** uma avaliação salva é consultada após encerrar e reabrir a sessão
- **THEN** os valores confirmados anteriormente permanecem disponíveis.

#### Scenario: Falha de gravação
- **WHEN** a persistência de uma avaliação falha
- **THEN** a interface informa falha e não apresenta confirmação de salvamento.

#### Scenario: Saída com alterações
- **WHEN** a professora tenta sair de uma ficha com alterações não salvas
- **THEN** recebe aviso antes de abandonar o formulário.

### Requirement: Revisões e limpeza justificada
Alterações de respostas existentes SHALL preservar versões, autora, data e contexto. Correção justificada SHALL permitir à autora autorizada limpar resposta equivocada, sem transformar ausência em regressão. Sem autora disponível, a professora atual SHALL acrescentar retificação em observação do período atual, sem substituir respostas ou indicadores antigos. Rastreabilidade: RF-13, RNF-01/03.

#### Scenario: Limpeza de resposta
- **WHEN** a autora atualmente vinculada limpa justificadamente sua resposta em período aberto
- **THEN** a versão vigente fica Sem avaliação e a versão anterior permanece consultável.

#### Scenario: Retificação pela sucessora
- **WHEN** a professora atual identifica erro em registro de outra autora indisponível
- **THEN** pode documentar a retificação em observação própria no período atual aberto, sem alterar o registro nem o indicador antigo.

### Requirement: Concorrência sem perda silenciosa
O sistema SHALL rejeitar salvamento sobre versão desatualizada e solicitar atualização e conciliação. A unicidade da resposta e o limite compartilhado de observações SHALL ser preservados mesmo em operações simultâneas. Rastreabilidade: CA-13.5, RNF-07.

#### Scenario: Duas professoras preenchem a mesma resposta ausente
- **WHEN** duas professoras salvam a mesma habilidade a partir de uma tela em que estava ausente
- **THEN** somente o primeiro salvamento válido cria a resposta; o outro recebe conflito, atualiza a tela e não substitui a autora vencedora.

### Requirement: Interface acessível e estados claros
Os fluxos essenciais SHALL funcionar por teclado, com foco visível, rótulos e estados independentes de cor, em desktop e largura de 360 px. SHALL distinguir carregamento, vazio, sem avaliação, erro, salvo, acesso negado e período fechado. Rastreabilidade: RNF-04, PRO-01–PRO-09.

#### Scenario: Registro por teclado em tela pequena
- **WHEN** o fluxo turma, aluno, avaliação e salvamento é executado por teclado em largura de 360 px
- **THEN** os controles permanecem operáveis e identificados, com foco e mensagens de estado perceptíveis sem depender de cor.
