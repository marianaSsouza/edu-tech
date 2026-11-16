# Spec Delta

## Purpose

Apresentar acompanhamento de turma e escola com cálculos verificáveis, cobertura explícita e acesso autorizado à trajetória de cada aluno.

## ADDED Requirements

### Requirement: Navegação contextual e lista de alunos
O sistema SHALL apresentar lista alfabética sem ranking, com escrita, lacunas e atenção por aluno. A coordenação SHALL filtrar ano/bimestre, abrir turma e aluno e retornar preservando filtros. Professores SHALL acessar somente turmas vinculadas. Estados vazios SHALL ser explícitos. Rastreabilidade: RF-10/11, CA-10.1/10.5, CA-11.1–11.3, PRO-02/07.

#### Scenario: Consulta da coordenação
- **WHEN** a coordenação filtra ano/bimestre, abre uma turma, consulta aluno e retorna
- **THEN** a ficha é a do aluno selecionado e os filtros permanecem.

### Requirement: População e respostas do período
O painel SHALL fixar turma, ano, bimestre e catálogo. N SHALL contar alunos distintos pela matrícula na data de referência de `calendario-letivo`; transferidos SHALL integrar apenas a turma dessa referência. Respostas SHALL ser as do bimestre, sem preenchimento por anteriores; herança e resumo anual são consultas distintas. Rastreabilidade: RN12, CA-10.3; requisitos seção 7.

#### Scenario: Transferência no período
- **WHEN** um aluno muda de turma e integra a turma de destino na referência
- **THEN** conta uma vez na turma de destino, com seu registro bimestral preservado e histórico de origem consultável.

### Requirement: Consolidação e cobertura
O sistema SHALL usar T como pares aluno/habilidade previstos, C consolidados, D em desenvolvimento, NC não consolidados e U ausentes, com T=C+D+NC+U. Consolidação SHALL ser C/T, cobertura (T-U)/T e consolidação por habilidade alunos consolidados/N; percentuais multiplicam as frações por 100. Rastreabilidade: RN12/14, CA-10.4, CR-01–04/19/24.

#### Scenario: Ausência participa do denominador
- **WHEN** as respostas são Consolidada, Em desenvolvimento, ausente e Não consolidada
- **THEN** consolidação é 1/4 = 25,0%, cobertura é 3/4 = 75,0% e há uma ausência, sem convertê-la em NC.

#### Scenario: Catálogo uniforme
- **WHEN** há N alunos e H habilidades previstas para todos
- **THEN** T=N vezes H; em catálogos não uniformes, T é a soma dos pares efetivamente previstos.

### Requirement: Escrita e atenção nos indicadores
O sistema SHALL calcular escrita alfabética por alunos Alfabético/N e cobertura de escrita por alunos com escrita/N, explicitando ausências. SHALL contar alunos distintos com motivo conhecido de atenção; comparação incompleta SHALL contar separadamente quem está sem escrita e sem outro motivo conhecido. Rastreabilidade: RF-08/10, CR-16/17.

#### Scenario: Múltiplos motivos e incompletude
- **WHEN** um aluno tem três motivos e outro está sem escrita e sem motivo conhecido
- **THEN** o primeiro conta uma vez em atenção e o segundo uma vez em comparação incompleta.

### Requirement: Lacunas por habilidade
O sistema SHALL apresentar crianças distintas com a habilidade herdada pendente/N e identificar quantas pendências decorrem de ausência de avaliação. Rastreabilidade: RF-06/10, RN14.

#### Scenario: Pendências de naturezas diferentes
- **WHEN** duas crianças têm a mesma habilidade pendente, uma por ausência e outra por Em desenvolvimento
- **THEN** o indicador conta duas crianças e identifica uma pendência por ausência.

### Requirement: Evolução entre bimestres
O sistema SHALL comparar A e B do mesmo ano letivo usando os alunos da turma na referência B e seus registros A, mesmo em outra turma. E SHALL contar nível B maior que A e V escrita presente em ambos. SHALL mostrar E de V e N-V sem comparação. Padrão SHALL comparar primeiro com selecionado; no primeiro SHALL pedir dois períodos distintos. Rastreabilidade: CR-11/20.

#### Scenario: Uma ausência na comparação
- **WHEN** três alunos pertencem à turma B, dois têm escrita em A e B e um dos dois avança
- **THEN** aparece evolução 1 de 2 avaliáveis e 1 sem comparação, sem atribuir zero à ausência.

#### Scenario: Igualdade ou regressão
- **WHEN** o nível em B é igual ou inferior a A
- **THEN** o aluno integra V, mas não E.

### Requirement: Frações e arredondamento
O sistema SHALL mostrar frações exatas e percentuais com uma casa decimal, vírgula e arredondamento meio para cima, sem arredondamentos intermediários. Barras SHALL usar frações originais, sem ajustar parcelas para forçar 100,0%. Rastreabilidade: RN12, CR-02–04/12.

#### Scenario: Empate de arredondamento
- **WHEN** a fração é 1/16
- **THEN** a apresentação é 1/16 = 6,3%.

#### Scenario: Fração periódica
- **WHEN** a fração é 7/12
- **THEN** a apresentação é 7/12 = 58,3%.

### Requirement: Denominador zero e ausência total
Denominador zero SHALL mostrar Sem dados e 0/0, sem percentual. Com T positivo e todas as respostas ausentes, SHALL mostrar consolidação e cobertura 0,0% com aviso Sem avaliações registradas, sem rotular alunos como Não consolidada. Regras de ocultação de grupo pequeno SHALL prevalecer na apresentação agregada. Rastreabilidade: CR-13, RN14.

#### Scenario: Base vazia
- **WHEN** um cálculo tem denominador zero
- **THEN** o resultado é Sem dados, sem divisão por zero ou percentual de desempenho.

#### Scenario: Turma sem avaliações
- **WHEN** uma turma de cinco alunos tem todos os pares sem resposta
- **THEN** exibe consolidação 0,0%, cobertura 0,0% e o aviso de ausência de avaliações.

### Requirement: Ocultação de agregados pequenos nos dois perfis
Com N menor que 5, os painéis de professor e coordenação SHALL ocultar percentuais, barras, contagens pedagógicas e detalhamento por habilidade, mantendo identificação e tamanho do grupo. SHALL mostrar Agregado oculto: grupo menor que 5 e preservar lista e consulta individual autorizadas. Rastreabilidade: RN13, CA-11.3, CR-18; decisão de abrangência.

#### Scenario: Limite de apresentação
- **WHEN** uma turma tem quatro alunos
- **THEN** ambos os perfis autorizados veem identificação, quantidade e acesso individual, mas não agregados pedagógicos; com cinco, os agregados são exibidos.

### Requirement: Atualização e legibilidade
Painel e ficha SHALL recalcular no mesmo contexto após salvamento, correção, evento de lacuna, ação de atenção manual ou matrícula confirmados, sem reiniciar a aplicação. Barras SHALL distinguir NC cinza, D amarelo, C verde e U branco hachurado/contorno com rótulos e contagens acessíveis. Rastreabilidade: CA-08.6, RNF-04.

#### Scenario: Consolidação confirmada
- **WHEN** a professora consolida uma lacuna e recebe confirmação de persistência
- **THEN** ficha e painel refletem a nova contagem e os motivos de atenção sem nova sessão.

### Requirement: Desempenho verificável
No ambiente documentado de demonstração, 95% das consultas de painel/ficha e salvamentos SHALL terminar em até 2 segundos em amostra de 30 operações, com 500 alunos e cinco anos, excluindo inicialização e registrando condições. Rastreabilidade: RNF-06.

#### Scenario: Medição de referência
- **WHEN** as 30 operações são medidas após inicialização com a base de referência
- **THEN** pelo menos 29 terminam em até 2 segundos e o relatório registra tempos e ambiente.
