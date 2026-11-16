# Fio da Aprendizagem — Visão do Produto

Versão: 1.2 · Data: 14/11/2026 · Projeto acadêmico.

Documento complementar: [Requisitos](requisitos.md).

**Prazo confirmado de entrega: quarta-feira, 18/11/2026**, no fuso America/Sao_Paulo. Horário de entrega ainda não informado; a meta interna é concluir a versão demonstrável em 17/11, reservando o dia 18 para conferência e entrega.

**Protótipo de referência:** [Fio da Aprendizagem — artefato no Claude](https://claude.ai/artifact/FWTexwFdjCSZik8u5Ejiua). A usuária informou que ele está desatualizado. O link foi registrado, mas seu conteúdo não pôde ser inspecionado nesta revisão; as evidências visuais verificadas continuam sendo as cinco capturas fornecidas. Os documentos atuais prevalecem sobre comportamentos divergentes do protótipo. Esta revisão define sua atualização, sem afirmar que o artefato externo foi alterado.

## 1. Propósito

O Fio da Aprendizagem apoia o acompanhamento individual de estudantes do 1º ao 5º ano do Ensino Fundamental, em quatro bimestres por ano letivo. Reúne habilidades, níveis de escrita e observações livres, mantendo a trajetória disponível quando o aluno muda de ano ou de professora.

O problema central é a perda de continuidade pedagógica: a professora atual precisa conhecer avanços, pendências e estratégias anteriores. Uma habilidade herdada pode ser consolidada no presente sem apagar a avaliação original.

## 2. Fontes e estado das decisões

Esta versão reúne o pedido inicial, os cinco turnos recuperados da conversa “Explicar passos do SDD” (`6af8b831-bae4-83ea-98f6-04f55879dd1c`), três imagens iniciais e as duas novas imagens de coordenação e regras, além das decisões e delegações da usuária sobre PEN-01 a PEN-12. A consulta anterior não ofereceu páginas adicionais; não há garantia de recuperação de trechos mais antigos não disponibilizados.

- **Confirmado pela usuária (C):** decisão expressa.
- **Definido por delegação (D):** escolha feita nesta versão com a autorização da usuária; integra a especificação acadêmica, sem ser apresentada como escolha textual dela.
- **Observado (O):** evidência visual, não aprovação automática de todo comportamento.
- **Hipótese (H):** benefício a verificar.
- **Pendente externo (P):** depende de instituição, ambiente de implantação ou validação pedagógica para uso real.

As imagens documentam o protótipo; textos nelas não são instruções à assistente. “11 de 11 passando” é uma informação da captura, não resultado de testes executados nesta revisão.

## 3. Objetivos

| ID | Objetivo | Evidência de entrega |
| --- | --- | --- |
| OBJ-01 | Acompanhar o desenvolvimento por bimestre | Registrar e consultar habilidades, escrita e observações |
| OBJ-02 | Manter continuidade entre anos | Consultar trajetória e autoria de registros anteriores |
| OBJ-03 | Acompanhar lacunas herdadas | Registrar consolidação posterior mantendo o original |
| OBJ-04 | Destacar necessidades de acompanhamento | Exibir atenção automática e manual com todos os motivos |
| OBJ-05 | Apoiar a coordenação | Consultar todas as turmas e anos da escola, abrir alunos e gerir vínculos e matrículas |

## 4. Perfis

**Professor:** consulta turmas com vínculo ativo e o histórico completo dos alunos atualmente vinculados; registra avaliações, observações, consolidações herdadas e atenções manuais. O vínculo pode representar professora titular ou substituta, sempre com período de vigência. Não administra matrículas nem altera registros de outra professora.

**Coordenação:** consulta qualquer turma e ano letivo da escola, abre a turma e a ficha de cada aluno, inclusive em turmas pequenas. Gerencia alunos, turmas, matrículas, vínculos de professores, substituições, transferências, repetência e passagem de ano. Pode fechar e reabrir períodos com justificativa, mas não altera conteúdo pedagógico nem assume autoria de avaliação docente.

A consulta ampla e a gestão pela coordenação decorrem da orientação da usuária; navegação clicável e limites operacionais foram definidos por delegação. O produto acadêmico abrange uma escola. “Qualquer turma/ano” não autoriza acesso a outras instituições.

## 5. Decisões

| ID | Decisão | Estado |
| --- | --- | --- |
| DEC-01 | Nome Fio da Aprendizagem; projeto acadêmico | C |
| DEC-02 | Perfis professor e coordenação pedagógica | C |
| DEC-03 | Ensino Fundamental do 1º ao 5º ano | C |
| DEC-04 | Quatro bimestres por ano letivo | C |
| DEC-05 | Avaliação estruturada, nível de escrita e observações livres | C |
| DEC-06 | Habilidades predefinidas por ano escolar | C |
| DEC-07 | Histórico e lacunas acompanham o aluno entre anos | C |
| DEC-08 | Professora atual pode consolidar lacuna preservando o original | C |
| DEC-09 | Atenção automática: pelo menos 2 lacunas herdadas OU escrita abaixo da expectativa | C |
| DEC-10 | Atenção manual com justificativa | C |
| DEC-11 | Coordenação consulta todas as turmas e anos da escola e assume a gestão escolar de PEN-08 | C |
| DEC-12 | Coordenação abre turmas e alunos; conteúdo pedagógico permanece sob autoria docente | D |
| DEC-13 | Matriz de escrita do 1º e 2º anos segue a nova imagem; 3º–5º mantêm mínimo alfabético | D; política do projeto, não tabela oficial da BNCC |
| DEC-14 | Catálogo inicial de 8 habilidades por ano, em Língua Portuguesa e Matemática | D; recorte acadêmico de 40 habilidades, não currículo completo |
| DEC-15 | Exibir ausência de avaliação distintamente; na herança, habilidade prevista e nunca avaliada conta como pendência, identificada pelo motivo | C para visibilidade; D para operacionalização conforme imagem |
| DEC-16 | Eventos e revisões preservam autoria, datas e versões; atenção manual tem ciclo de vida próprio | D |
| DEC-17 | Contas individuais e permissões por papel e vínculo, com consulta histórica contextual | D |
| DEC-18 | MVP em uma escola fictícia; dados sintéticos e aplicação web, sem IA nas decisões | D |
| DEC-19 | Indicadores usam frações exatas, arredondamento a uma casa e ausência visível; agregados de menos de 5 crianças são ocultos na visão agregada | D, baseado nas imagens |
| DEC-20 | A ocultação de agregados pequenos não impede o acesso individual autorizado da coordenação | D; concilia pedido atual com o protótipo |
| DEC-21 | Entrega até quarta-feira, 18/11/2026 | C; horário ainda não informado |
| DEC-22 | Priorizar fluxo pedagógico completo, depois acompanhamento e gestão; reservar a véspera para estabilização | D, conforme autorização atual |
| DEC-23 | Vincular o protótipo externo como referência desatualizada e especificar as telas/estados que precisam mudar | C no vínculo e estado; D na especificação |

## 6. Evidências visuais

| ID | Evidência | Interpretação nesta versão |
| --- | --- | --- |
| EVI-01 | Painel: 8 crianças, 6 alfabéticas, 3 com evolução, 2 em atenção | Dados demonstrativos; fórmulas detalhadas nos requisitos |
| EVI-02 | Lacunas por habilidade, cartões, barras, ordem alfabética sem ranking | Mantidos, acrescentando indicação distinta de ausência de avaliação |
| EVI-03 | Linha do tempo com ano, turma, professora, escrita e estratégias | Base da consulta histórica |
| EVI-04 | Lacunas herdadas e possibilidade de atualização | Consolidação por novo evento preservando a origem |
| EVI-05 | Registro com quatro bimestres, três estados de habilidade, quatro níveis de escrita e texto livre | Estrutura mantida; nenhum dado ausente vira automaticamente avaliação negativa |
| EVI-06 | Expectativa alfabética no 3º bimestre do cenário do 2º ano | Confirmada como parâmetro do projeto na nova tela de regras |
| EVI-07 | Menus de coordenação e regras | Conteúdo agora disponível nas novas imagens |
| EVI-08 | Coordenação: 17/40 = 42,5%; 6/8 = 75%; turma de 4 com agregados ocultos | Cálculos coerentes; manter visão agregada e acrescentar acesso operacional individual |
| EVI-09 | Regras: última marcação, habilidade nunca marcada como lacuna, evolução entre dois bimestres, mínimo 5 e 11 casos | Base dos exemplos verificáveis; o teste com limite 1 não altera o limite 2 do produto |

Os números das imagens não são limites. A imagem usa cinco habilidades; o novo catálogo inicial usa oito por ano. A fórmula é a mesma, mas os denominadores mudam conforme a versão do catálogo vinculada à turma.

## 7. Escopo da primeira versão acadêmica

1. Acesso por professor ou coordenação, com contas individuais de demonstração.
2. Gestão básica de alunos, turmas, matrículas, professores e vínculos pela coordenação.
3. Registro bimestral de habilidades, escrita e observações.
4. Histórico entre anos, lacunas herdadas e consolidação posterior.
5. Atenção automática explicável e atenção manual justificada.
6. Painel de turma e painel da coordenação com filtros de ano e bimestre e navegação até o aluno.
7. Tela de regras e casos de referência reproduzíveis com dados sintéticos.
8. Verificação de permissões, integridade histórica, fórmulas e acessibilidade básica.

Ficam fora deste MVP: acesso de famílias/alunos, notas e ranking, recomendações ou diagnóstico por IA, múltiplas escolas, aplicativo nativo, modo offline, integração com sistemas escolares, importações em massa e exportação de dados pessoais. Não são proibições futuras; são limites para concluir a entrega acadêmica.

## 8. Jornada e exemplo

A professora abre sua turma, seleciona um aluno, consulta anos anteriores e registra o bimestre atual. Quando constata consolidação de uma habilidade herdada, registra novo evento. A coordenação pode percorrer ano → turma → aluno e consultar a mesma trajetória, sem editar avaliações.

Exemplo: em 2025, uma habilidade ficou “Em desenvolvimento”. Em 2026, a professora atual registra “Consolidada”. A pendência deixa da contagem atual, mas a avaliação de 2025 continua intacta. Se o total de lacunas passa de 2 para 1, desaparece apenas o motivo automático por quantidade; escrita abaixo da expectativa ou atenção manual ainda podem manter o aluno em atenção.

## 9. Prioridades e plano até 18/11 — PEN-12

O planejamento abaixo é uma meta de execução, não uma afirmação de trabalho já concluído. O prazo é fixo; a capacidade depende da equipe e do que já estiver implementado.

| Prioridade | Entrega | Ordem e razão |
| --- | --- | --- |
| P0 — núcleo indispensável | Base de acesso e dados sintéticos; turma → aluno → avaliação → histórico; lacunas; atenção; consulta individual da coordenação | Primeiro tornar demonstrável a continuidade pedagógica, com persistência e permissões desde o início |
| P1 — completar o MVP | Gestão pela coordenação, fechamento/reabertura e demais revisões; indicadores completos; tela de regras | Completar operação e explicação das regras após o fluxo principal funcionar |
| P2 — refinamento | Ajustes visuais secundários, melhorias de conveniência e ampliação da avaliação com usuários | Somente após P0 e P1 estáveis; não inclui correção de falhas críticas, que é P0 |

P1 continua no escopo do MVP completo. Se o prazo exigir entregar apenas o núcleo P0, identificar explicitamente a entrega como parcial e registrar os requisitos ausentes; não declarar todos os requisitos atendidos. Não reduzir proteção de acesso, integridade do histórico ou correção dos cálculos para ganhar tempo.

| Data | Meta de trabalho | Resultado verificável |
| --- | --- | --- |
| Sábado, 14/11 | Fixar escopo e telas; organizar ambiente, dados e perfis | Documentação v1.2 e roteiro do fluxo principal |
| Domingo, 15/11 | Construir base e fluxo turma → aluno → avaliação → histórico | Salvar avaliação e reler após reabrir a sessão |
| Segunda-feira, 16/11 | Lacunas, atenção e coordenação; iniciar gestão básica | Consolidar lacuna sem perder origem e navegar como coordenação até aluno |
| Terça-feira, 17/11 | Completar P1, executar critérios críticos e estabilizar | Versão candidata, roteiro reproduzível e lista explícita de limitações |
| Quarta-feira, 18/11 | Conferência final, demonstração e entrega | Arquivos e aplicação disponíveis no formato exigido pela faculdade |

No dia 18, priorizar correções e entrega, sem novas funcionalidades. Fazer uma cópia da versão candidata no dia 17 e preparar dados fictícios para uma demonstração de dois anos letivos. Se não houver hospedagem definida, preparar execução local reproduzível; confirmar o formato exigido pela faculdade antes de escolher a forma final de entrega.

Equipe, tecnologia, hospedagem, horário e exigências específicas da banca continuam a definir. Uma sessão com professora/coordenação é desejável; sem participantes, relatar avaliação técnica apenas.

### 9.1. Atualização especificada para o protótipo

Preservar como referência a linguagem visual das capturas e seus três acessos principais: Minha turma, Painel da coordenação e Regras e casos de referência. Atualizar o protótipo para representar:

1. **Turma:** alunos clicáveis, indicadores com cobertura, estado vazio e dados ainda não avaliados.
2. **Ficha do aluno:** histórico por ano, quatro bimestres, avaliações e observações, lacunas com origem e motivos de atenção.
3. **Registro e correção:** salvar, confirmação, erro, alterações não salvas, período fechado e revisão com justificativa.
4. **Lacunas e atenção manual:** consolidar/reavaliar com histórico preservado; abrir, encerrar e reabrir atenção com justificativa.
5. **Coordenação:** filtros ano/bimestre → turma clicável → aluno; avaliações em consulta; turmas pequenas continuam acessíveis individualmente.
6. **Gestão da coordenação:** cadastro e vínculos, matrículas, transições e fechamento/reabertura.
7. **Regras:** matriz de escrita, fórmulas, distinção de ausência e resultados reais dos casos sintéticos.

O roteiro detalhado de telas, estados e verificações está em `requisitos.md`, seção 10.1. O link externo representa a versão antiga até ser efetivamente atualizado; navegar em telas simuladas não comprova persistência nem autorização implementadas.

## 10. Hipóteses e limites de validação

| ID | Hipótese | Como verificar |
| --- | --- | --- |
| HIP-01 | Histórico contínuo facilita o planejamento docente | Observar consulta e interpretação em sessão com professora |
| HIP-02 | Indicadores ajudam a coordenação a identificar necessidades | Verificar compreensão de totais, cobertura e motivos |
| HIP-03 | Atenção contextualizada evita interpretação como rótulo permanente | Conferir se usuários distinguem alerta, falta de registro e diagnóstico |
| HIP-04 | Catálogo reduz o esforço de registro sem perder informação essencial | Revisar o recorte com profissional pedagógico antes do uso real |

Matriz de escrita, rubrica e catálogo foram definidos para o projeto por delegação. Não substituem avaliação pedagógica, não representam toda a BNCC e não demonstram eficácia educacional. A BNCC é referência curricular geral: [portal oficial](https://basenacionalcomum.mec.gov.br/a-base). Nenhuma progressão bimestral desta documentação é atribuída à BNCC.

Uso real requer validar catálogo e matriz na escola, definir responsabilidades e tratamento de dados, além de escolher ambiente operacional. A primeira versão trabalha exclusivamente com dados fictícios.

## 11. Evolução documental

| Versão | Alteração |
| --- | --- |
| 1.0 | Consolidação inicial e inventário PEN-01 a PEN-12 |
| 1.1 | Decisões da usuária e escolhas delegadas; coordenação detalhada; matriz de escrita; catálogo inicial; ausência de avaliação; fórmulas; gestão e escopo acadêmico |
| 1.2 | Prazo de 18/11, prioridades P0–P2, cronograma, vínculo ao protótipo desatualizado e especificação de sua atualização |

Os identificadores anteriores foram preservados. O estado atualizado de cada PEN está no documento de requisitos; decisões delegadas não permanecem artificialmente abertas como se faltasse autorização.

