# Spec Delta

## Purpose

Explicar as políticas acadêmicas e permitir conferir cálculos com casos sintéticos reproduzíveis, distinguindo execução real de exemplos ilustrativos.

## ADDED Requirements

### Requirement: Regras visíveis e coerentes
A tela SHALL apresentar matriz de escrita, fórmulas, limite fixo 2, última marcação, herança, ausência e ocultação de grupos menores que cinco. SHALL distinguir política acadêmica de norma curricular e os catálogos CAT-v1 e demonstrativo. Rastreabilidade: RF-14, CA-14.1, PRO-09.

#### Scenario: Consulta das regras
- **WHEN** um usuário autenticado abre Regras e casos de referência
- **THEN** encontra as regras correspondentes às demais specs e a distinção entre ausência e resultado negativo.

### Requirement: Execução isolada e resultados verdadeiros
A tela SHALL executar os casos sintéticos ao abrir, sem escrever dados pedagógicos, apresentando Executando, resultado total e detalhes das falhas. MUST NOT exibir sucesso antes da execução nem substituir resultados por números fixos do protótipo. Rastreabilidade: CA-14.2–14.4.

#### Scenario: Execução com falha
- **WHEN** um caso produz resultado diferente do esperado
- **THEN** a tela apresenta falha, entrada, esperado e obtido, ajustando o total sem alterar registros escolares.

#### Scenario: Antes da conclusão
- **WHEN** os casos ainda estão executando
- **THEN** a tela informa Executando e não anuncia todos aprovados.

### Requirement: Contratos dos casos de referência
A verificação SHALL preservar CR-01 a CR-24 com as entradas e resultados abaixo. Fixtures SHALL codificar NC=0, D=1, C=2 e ausência nula. Casos de autorização e interface SHALL ter evidência na suíte apropriada; a tela MUST NOT apresentar um teste simulado como prova de integração. Rastreabilidade: RF-14; requisitos seções 8 e 10.

#### Scenario: Casos reproduzíveis
- **WHEN** os casos abaixo são executados na camada apropriada
- **THEN** seus resultados correspondem aos contratos, e qualquer verificação externa à tela é identificada e registrada no relatório.

| ID | Entrada | Esperado |
| --- | --- | --- |
| CR-01 | [2,2,1,0] | 2/4 = 50,0% |
| CR-02 | 7 de 12 | 58,3% |
| CR-03 | 1 de 8 | 12,5% |
| CR-04 | 2 de 3 | 66,7% |
| CR-05 | C no segundo e NC no quarto bimestre | Lacuna no ano seguinte |
| CR-06 | Consolidação atual de lacuna | Sai da contagem atual, original preservado |
| CR-07 | Habilidade prevista em ano encerrado nunca avaliada | Pendência herdada Sem avaliação, conta sem nível negativo |
| CR-08 | Uma lacuna e escrita alfabética no terceiro bimestre do 2º ano, sem manual | Sem sinal de atenção nos dados disponíveis |
| CR-09 | CR-08 com parâmetro de teste 1 | Atenção no teste; produto mantém limite 2 |
| CR-10 | Silábico-alfabético no terceiro bimestre do 2º ano | Atenção por escrita |
| CR-11 | Duas crianças comparáveis, uma avança | 1 de 2 avaliáveis |
| CR-12 | 1 de 16 | 6,3% |
| CR-13 | Denominador zero | Sem dados, 0/0, sem percentual |
| CR-14 | Duas lacunas e escrita adequada | Atenção por lacunas |
| CR-15 | Zero lacunas e escrita abaixo | Atenção por escrita |
| CR-16 | Zero lacunas, escrita ausente, sem manual | Comparação incompleta |
| CR-17 | Dois motivos automáticos e um manual | Uma criança em atenção e três motivos visíveis |
| CR-18 | Grupo de quatro e depois cinco crianças | Ocultar com quatro, exibir com cinco nos dois perfis |
| CR-19 | [2,1,nulo,0] | Consolidação 25,0%; cobertura 75,0%; uma ausência |
| CR-20 | Três crianças, duas comparáveis, uma avança | 1 de 2, uma sem comparação |
| CR-21 | Professora lê aluno sem vínculo; coordenação edita avaliação | Ambas operações negadas |
| CR-22 | CAT-v2 após ano CAT-v1 | Preservar textos, respostas e denominador antigo |
| CR-23 | Consulta anterior a consolidação ou abertura manual atual | Não aplicar evento futuro ao passado |
| CR-24 | Oito crianças, cinco habilidades, C=6,3,4,3,1 | 17/40=42,5%; por habilidade 75,0%,37,5%,50,0%,37,5%,12,5% |

### Requirement: Demonstração e evidências de aceitação
A entrega SHALL demonstrar trajetória de dois anos, ausência, consolidação herdada, atenção manual e coordenação até aluno, com turmas de pelo menos cinco e de quatro crianças. SHALL registrar resultados de CA/CR e RNF, incluindo permissões fora da tela. P0 isolado SHALL ser declarado parcial; MVP completo SHALL incluir P1. Rastreabilidade: requisitos seção 10.

#### Scenario: Declaração de conclusão
- **WHEN** a entrega é apresentada como MVP completo
- **THEN** RF-01 a RF-14 estão implementados, CR-01 a CR-24 aprovados e os CA críticos identificados no design foram verificados, sem falha conhecida de acesso indevido, perda de registro ou cálculo de atenção.

#### Scenario: Entrega parcial
- **WHEN** apenas P0 foi concluído
- **THEN** a entrega é identificada como parcial e lista RF/CA não atendidos.
