# Spec Delta

## Purpose

Manter cadastros e vínculos temporais da escola fictícia, permitindo movimentações dos alunos sem perder sua trajetória ou duplicar avaliações.

## ADDED Requirements

### Requirement: Cadastros escolares mínimos
O sistema SHALL permitir à coordenação cadastrar alunos, turmas e professores. Alunos SHALL ter identificador interno, nome de exibição e dados escolares necessários; CPF, endereço, foto, saúde e laudos ficam fora do cadastro. Duplicidades SHALL ser sinalizadas por nome e contexto, sem fusão automática. Rastreabilidade: RF-12, CA-12.1, RNF-05.

#### Scenario: Possível duplicidade
- **WHEN** a coordenação cadastra aluno com nome e contexto semelhantes a um existente
- **THEN** o sistema sinaliza possível duplicidade sem mesclar históricos ou exigir CPF.

### Requirement: Matrícula única e transferência interna
O sistema SHALL manter uma matrícula regular ativa por aluno em cada instante. Transferência SHALL encerrar a matrícula anterior e abrir a nova. No mesmo ano escolar e letivo, o registro bimestral SHALL acompanhar o aluno, preservando origem e autoria, sem duplicar avaliações ou contagens. Rastreabilidade: RF-12, CA-12.2; decisão de transferência.

#### Scenario: Transferência durante o bimestre
- **WHEN** um aluno muda de turma no mesmo ano escolar e letivo
- **THEN** sua nova matrícula referencia o registro bimestral existente, com turma de origem visível e uma única contagem na turma de referência.
- **AND** a professora de destino preenche respostas ausentes ou adiciona observações próprias, sem substituir habilidade ou escrita de outra autora.

### Requirement: Vigência dos vínculos docentes
O sistema SHALL registrar início e fim dos vínculos docentes. Titular e substituta SHALL coexistir somente quando indicadas explicitamente pela coordenação. Encerrar o vínculo SHALL revogar escrita futura por ele, preservando a autoria passada. Rastreabilidade: RN11, RF-12, RNF-03.

#### Scenario: Substituição autorizada
- **WHEN** a coordenação cria uma substituição coexistente com a titular
- **THEN** ambas têm acesso durante as respectivas vigências, respeitando as regras de autoria.

#### Scenario: Vínculo encerrado
- **WHEN** termina o vínculo de uma professora sem outro vínculo atual com o aluno
- **THEN** ela não pode continuar registrando ou corrigindo conteúdo desse aluno.

### Requirement: Passagem de ano e repetência
O sistema SHALL criar nova matrícula após fechamento do ano anterior, sem copiar avaliações como novas. Repetência SHALL manter a etapa escolar e os IDs das habilidades. Mudança excepcional de etapa no meio do período SHALL criar contexto novo, explicitar ausências e não converter catálogos automaticamente. Rastreabilidade: RF-12, CA-12.3, RN10.

#### Scenario: Repetência
- **WHEN** o aluno inicia novo ano letivo na mesma etapa escolar
- **THEN** recebe nova matrícula e mantém o histórico; habilidades repetidas conservam seus IDs para deduplicação da herança.

#### Scenario: Mudança excepcional de etapa
- **WHEN** a coordenação muda o ano escolar do aluno durante o período
- **THEN** um contexto novo apresenta suas habilidades sem avaliação e conserva as avaliações do contexto anterior sem conversão automática.

### Requirement: Transferência externa e arquivamento
O sistema SHALL encerrar a matrícula na transferência externa e conservar os registros para consulta da coordenação. Ingressantes sem histórico SHALL apresentar a indisponibilidade; importação de prontuário não integra o MVP. Cadastros com histórico SHALL ser arquivados, não apagados pela interface comum. Rastreabilidade: RN06, RF-12; requisitos seção 5.

#### Scenario: Saída da escola
- **WHEN** a coordenação registra transferência externa
- **THEN** a matrícula é encerrada e o histórico permanece consultável pela coordenação.

### Requirement: Dados sintéticos e recuperação
A entrega SHALL usar somente dados fictícios, permitir reinicialização identificada da demonstração e demonstrar restauração preservando vínculos e histórico. A demonstração hospedada SHALL ter backup diário, retenção técnica de 30 dias e acesso restrito. Rastreabilidade: RNF-05; requisitos seção 9.

#### Scenario: Restauração antes da entrega
- **WHEN** uma cópia de segurança é restaurada em ambiente de verificação
- **THEN** matrículas, vínculos, avaliações, revisões e autoria são recuperados e a evidência da restauração é registrada.
