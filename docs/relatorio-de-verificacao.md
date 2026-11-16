# Relatório de verificação — Fio da Aprendizagem

Tarefa 10.2 do `tasks.md`. Mostra, para cada spec de `openspec/changes/especificar-fio-da-aprendizagem/specs/`, se cada cenário foi implementado e qual é a evidência. Nada é declarado "feito" sem evidência.

- **Data:** 16/11/2026 · **Código verificado:** branch `main`, a partir do a partir do commit da tarefa 4.3/7.3/8.2 (ver `git log`)
- **Testes automáticos:** 132 de 132 passando (`npm test`). Saída completa em [`docs/evidencias/saida-npm-test.txt`](evidencias/saida-npm-test.txt).
- **Classificação da entrega:** **parcial**. O P0 (grupos 1 a 6) está demonstrável. Do P1 foram feitas as tarefas 7.3 (calendário) e 8.2 (evolução da escrita); os demais itens dos grupos 7 a 10 não foram concluídos. Ver o fim do documento.

## Como conferir

```bash
npm install
npm run seed:reset
npm test
npm run dev
```

Os testes de integração usam banco SQLite em memória, a base fictícia completa e a data fixa de 16/11/2026, sem servidor web. Cada teste cita no nome o requisito que verifica (RN, RF, CA ou CR).

**Legenda**

| Símbolo | Significado |
| --- | --- |
| ✅ | Feito, com teste automático (arquivo indicado) ou, quando dito, verificado manualmente na tela |
| ⚠️ | Parcial: a regra existe, mas falta tela, teste ou parte do cenário (o que falta está escrito) |
| ❌ | Não feito |
| N/A | Não se aplica à entrega local |

Arquivos de teste citados (todos em `server/src/`): `domain/regras.spec.ts`, `domain/lacunas.spec.ts`, `domain/atencao.spec.ts`, `domain/painel.spec.ts`, `domain/percentual.spec.ts`, `database/seed/cat-v1.spec.ts`, `database/seed/seed.spec.ts`, `modules/acesso/acesso.spec.ts`, `modules/avaliacao/avaliacao.spec.ts`, `modules/historico/ficha.spec.ts`, `modules/atencao/atencao.spec.ts`, `modules/paineis/painel.spec.ts`.

## Resumo por spec

| Spec | Cenários | ✅ | ⚠️ | ❌ | N/A |
| --- | --- | --- | --- | --- | --- |
| acesso-e-permissoes | 9 | 6 | 1 | 1 | 1 |
| avaliacao-bimestral | 12 | 9 | 3 | 0 | 0 |
| historico-pedagogico | 6 | 6 | 0 | 0 | 0 |
| lacunas-herdadas | 11 | 11 | 0 | 0 | 0 |
| atencao-pedagogica | 13 | 12 | 1 | 0 | 0 |
| paineis-e-indicadores | 15 | 14 | 0 | 1 | 0 |
| catalogo-pedagogico | 6 | 5 | 1 | 0 | 0 |
| calendario-letivo | 7 | 6 | 1 | 0 | 0 |
| gestao-escolar | 8 | 0 | 4 | 4 | 0 |
| regras-e-casos-de-referencia | 6 | 1 | 2 | 3 | 0 |
| **Total** | **93** | **70** | **13** | **9** | **1** |

---

## acesso-e-permissoes

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Contas individuais e papéis | Desativação de professora | ✅ | `acesso.spec.ts`: "conta desativada dá 401 e a sessão aberta antes deixa de valer". A autoria fica preservada porque a conta não é apagada. Falta a tela da coordenação para desativar (grupo 7); no teste, a desativação é feita direto no banco. |
| | Elevação indevida | ⚠️ | Não existe nenhuma rota que altere o papel; o guard recarrega o papel do banco a cada requisição (`common/auth.ts`). Falta um teste dedicado. |
| Consulta contextual autorizada | Histórico de aluno atual | ✅ | `avaliacao.spec.ts`: "histórico de 2025 fica disponível à professora atual, com autoria preservada"; `ficha.spec.ts`: "CA-05.1…" |
| | Ex-aluno sem vínculo | ✅ | `acesso.spec.ts`: "Ana Paula não lê ex-aluna, mesmo sendo autora dos registros de 2025: 403"; também na ficha, na avaliação e no painel |
| Edição pedagógica por autoria | Titular e substituta simultâneas | ✅ | `avaliacao.spec.ts`: "Beatriz salva; Débora sem versão recebe 409; com versão recebe 403 AUTORIA; mas salva uma habilidade ausente" |
| | Correção antiga pela autora | ✅ | `calendario.spec.ts`: "correção antiga pela autora em bimestre reaberto…": a autora corrige o 1º bimestre reaberto, com revisão; outra professora recebe AUTORIA. A regra não exige a turma original (`policy.service.ts`), mas não há teste com turma de origem diferente. |
| | Coordenação tenta editar | ✅ | `avaliacao.spec.ts`: "coordenação lê tudo, mas … salvar dá 403"; a tela fica em modo consulta, sem botão Salvar (verificado manualmente) |
| Gestão restrita e sessão identificada | Professor tenta administrar matrícula | ❌ | Não há rotas de matrícula nem de cadastro (grupo 7). O cabeçalho já identifica pessoa e perfil, e a sessão encerrada leva ao login. |
| Proteção de credenciais (hospedada) | Acesso hospedado | N/A | A entrega é local (tarefa 9.2). As senhas são guardadas com hash bcrypt (`seed.ts`) e o cookie é `httpOnly`. |

## avaliacao-bimestral

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Contexto e respostas únicas | Troca de bimestre | ✅ | Unicidade por contexto/habilidade/bimestre: `seed.spec.ts` ("rejeita uma segunda resposta vigente…"). A tela mostra "2º ano (etapa escolar) · ano letivo 2026" e troca de bimestre pela URL. |
| Avaliação parcial | Salvar somente uma habilidade | ✅ | `avaliacao.spec.ts` (salva uma habilidade e as outras continuam `null`); a tela mostra a completude "n de 8" (verificado manualmente) |
| | Escrita em outro bimestre | ✅ | `painel.spec.ts`: "4º bimestre sem registros … cobertura de escrita 0/8": a escrita do 3º bimestre não é copiada para o 4º |
| Observações por autora | Observações de duas professoras | ✅ | `avaliacao.spec.ts`: "3.000 + 1.001 caracteres é rejeitado; 3.000 + 1.000 é aceito" (duas autoras, com a autoria de cada uma conferida) |
| | Limite e vazio | ✅ | Mesmo teste, mais "texto vazio é rejeitado" (a observação é opcional; não se cria observação vazia) e `regras.spec.ts` |
| Salvamento explícito e persistente | Reabrir sessão | ✅ | Verificado manualmente: salvar, sair, entrar de novo e ver os valores. A persistência é em SQLite, com transação (`seed.spec.ts`: "grava de forma atômica"). |
| | Falha de gravação | ⚠️ | A tela só mostra "Tudo salvo" se todas as chamadas derem certo; em erro, lista as falhas e mantém as alterações (`Avaliacao.tsx`). Falta teste automático de interface. |
| | Saída com alterações | ⚠️ | Implementado (`beforeunload` e confirmação ao trocar de tela, em `Avaliacao.tsx`). Não verificado no navegador. |
| Revisões e limpeza justificada | Limpeza de resposta | ✅ | `limpar.spec.ts`: "a autora limpa com justificativa: vigente fica Sem avaliação e a versão anterior continua consultável"; regras (justificativa, autoria, versão, coordenação, período fechado) testadas. Na ficha, a célula mostra "— ✎" e a versão anterior aparece em "Correções neste ano". |
| | Retificação pela sucessora | ✅ | A sucessora registra observação própria sem alterar o registro alheio: `avaliacao.spec.ts` (AUTORIA 403 e observações de duas autoras) |
| Concorrência sem perda silenciosa | Duas professoras na mesma resposta ausente | ✅ | `avaliacao.spec.ts`: "duas criações simultâneas da mesma habilidade: um sucesso e um 409 (CA-13.5)" |
| Interface acessível e estados claros | Registro por teclado em 360 px | ⚠️ | Rádios nativos dentro de `fieldset`/`legend`, foco visível, estados em texto e símbolo; em 360 px não há rolagem lateral (verificado manualmente). Falta o registro formal da tarefa 3.6 (teclado completo, dois navegadores). |

## historico-pedagogico

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Trajetória individual | Trajetória de dois anos | ✅ | `ficha.spec.ts`: "CA-05.1 … CA-05.3: bimestre sem resposta aparece como ausente" |
| Histórico corrigido | Correção retroativa autorizada | ✅ | `calendario.spec.ts`: correção no 1º bimestre reaberto; o painel passa a usar a versão corrigida e a ficha identifica a revisão com o valor original (`ficha.spec.ts`: "correção identificada"). A marca de revisão aparece na ficha, não no painel. |
| | Consolidação posterior | ✅ | `ficha.spec.ts` (Bernardo): o resumo anual de 2025 continua "Em desenvolvimento" e o evento de 2026 aparece separado |
| Resumo anual | Quarto bimestre sem resposta | ✅ | `lacunas.spec.ts`: "4º bimestre sem resposta não apaga a consolidação do 2º" |
| Auditoria preservada | Consulta de revisão | ✅ | `ficha.spec.ts`: a revisão mostra nível anterior, novo, autora, data e justificativa; `avaliacao.spec.ts` confere a linha em `revisoes_resposta` |
| Histórico externo indisponível | Aluno ingressante sem prontuário | ✅ | `ficha.spec.ts`: "ingressante sem prontuário: 'Histórico anterior indisponível' e nenhuma lacuna fabricada" |

## lacunas-herdadas

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Elegibilidade | Primeiro ano sem histórico | ✅ | `lacunas.spec.ts`: "1º ano sem contexto anterior: nenhuma lacuna fabricada" |
| | Ano anterior reaberto | ✅ | `ficha.spec.ts`: "ano anterior reaberto continua elegível para herança" (usa a tabela `anos_encerrados`, D06) |
| Última marcação e ausência | Regressão no último bimestre | ✅ | `lacunas.spec.ts`: "CR-05" |
| | Nunca avaliada | ✅ | `lacunas.spec.ts`: "CR-07" |
| | Ausência após marcação | ✅ | `lacunas.spec.ts`: "ausência depois de uma marcação não apaga a marcação" |
| Deduplicação | Mesma habilidade em repetência | ✅ | `lacunas.spec.ts`: "CA-06.3: mesma habilidade em repetência conta uma vez" |
| Consolidação e reavaliação | Consolidação reduz de dois para um | ✅ | `historico/lacunas.spec.ts`: "CA-07.4: com duas pendências, consolidar uma remove só o motivo por quantidade" e "CR-06 / CA-07.1–07.3"; botão "Consolidar" na ficha (verificado no navegador: 6 → 5 pendências) |
| | Reabertura pedagógica | ✅ | `historico/lacunas.spec.ts`: "reabertura pedagógica: reavaliar uma herdada consolidada… volta à contagem, com os dois eventos"; botão "Reavaliar" na ficha |
| Ordem pedagógica | Eventos distintos no mesmo bimestre | ✅ | `lacunas.spec.ts` (mesmo teste: vale a registrada depois, pelo `seq`) |
| | Correção de evento anterior | ✅ | `lacunas.spec.ts`: "correção de avaliação antiga (seq original) não supera consolidação posterior (D05)" |
| Corte histórico | Histórico antes do avanço | ✅ | `lacunas.spec.ts`: "CR-23: consulta com referência anterior à consolidação mantém a pendência"; o painel usa a mesma função com o bimestre escolhido |

## atencao-pedagogica

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Expectativa de escrita | Matriz de mínimos | ✅ | `atencao.spec.ts` (domain): "usa exatamente a matriz da spec" |
| Atenção automática | Limite e igualdade | ✅ | `atencao.spec.ts` (domain): "CR-08 / CA-08.4" e "CA-08.5" |
| | Duas lacunas com escrita adequada | ✅ | `atencao.spec.ts` (domain): "CR-14 / CA-08.1" |
| | Escrita abaixo do mínimo | ✅ | `atencao.spec.ts` (domain): "CR-10 / CR-15"; `painel.spec.ts` (Bernardo: lacunas e escrita) |
| | Múltiplos motivos | ✅ | `atencao.spec.ts` (domain): "CR-17"; `painel.spec.ts`: o aluno conta uma vez em "Em atenção" |
| Ausência e informação incompleta | Sem escrita e sem outro motivo | ✅ | `atencao.spec.ts` (domain): "CR-16 / CA-08.7"; integração: "sem escrita fica incompleta" |
| | Lacunas com escrita ausente | ✅ | `atencao.spec.ts` (domain e integração, Davi) |
| | Histórico externo desconhecido | ⚠️ | A limitação aparece separada e não cria estado de atenção (`ficha.spec.ts`, ingressante). Falta o teste com escrita adequada. |
| Abertura e autoria de atenção manual | Justificativa vazia | ✅ | `atencao.spec.ts` (integração): "CA-09.1–09.3 … texto vazio é rejeitado" |
| | Motivos coexistentes | ✅ | Mesmo teste: duas atenções com IDs e autoras próprios. Falta a autora poder corrigir o texto original, que é parte do requisito. |
| Ciclo de vida independente | Sucessora encerra atenção | ✅ | `atencao.spec.ts` (integração): "CA-09.5: substituta encerra com justificativa (autora original preservada)…"; verificado também no navegador |
| | Melhora automática | ✅ | `atencao.spec.ts` (domain): "CA-09.1 / CA-09.5: manual ativa sinaliza sem critério automático" |
| | Reabertura | ✅ | `atencao.spec.ts` (integração): reabre e preserva os eventos COMENTARIO → ENCERRAMENTO → REABERTURA |

## paineis-e-indicadores

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Navegação contextual | Consulta da coordenação | ✅ | Verificado manualmente: filtrar o 3º bimestre, abrir o 2º A, abrir o Bernardo e voltar mantendo `?ano=2026&bimestre=3`. Lista alfabética: `painel.spec.ts`. |
| População do período | Transferência no período | ✅ | `painel.spec.ts`: "CA-10.3: transferido conta uma vez, na turma da data de referência" |
| Consolidação e cobertura | Ausência participa do denominador | ✅ | `painel.spec.ts` (domain): "ausência entra no denominador … (CA-10.4)" = CR-19 |
| | Catálogo uniforme | ✅ | `painel.spec.ts` (integração): T = 64 no 2º A; (domain) "catálogo não uniforme" |
| Escrita e atenção | Múltiplos motivos e incompletude | ✅ | `painel.spec.ts` (domain): "aluno com vários motivos conta uma vez; incompleta conta à parte" |
| Lacunas por habilidade | Pendências de naturezas diferentes | ✅ | `painel.spec.ts` (domain): "lacunas por habilidade: duas crianças, uma por ausência" |
| Evolução entre bimestres | Uma ausência na comparação | ✅ | `painel.spec.ts` (domain): "CR-20"; `evolucao.spec.ts`: 2º A do 1º para o 3º bimestre = 3 de 8; no 4º, 0 de 0 com 8 sem comparação |
| | Igualdade ou regressão | ✅ | `painel.spec.ts` (domain): "igualdade ou regressão entram em V, mas não em E" e "CR-11"; no 1º bimestre aparece "Selecione dois bimestres distintos" |
| Frações e arredondamento | Empate de arredondamento | ✅ | `painel.spec.ts` (domain): "CR-02 / CR-12"; `percentual.spec.ts` |
| | Fração periódica | ✅ | Mesmo teste (7/12 = 58,3%) |
| Denominador zero e ausência total | Base vazia | ✅ | `painel.spec.ts` (domain): "CR-13: denominador zero é 'Sem dados' (0/0)" |
| | Turma sem avaliações | ✅ | `painel.spec.ts` (domain e integração: 4º bimestre do 2º A, com 0,0% e aviso) |
| Ocultação de agregados pequenos | Limite de apresentação | ✅ | `painel.spec.ts`: "CR-18", "ocultação vale para os dois perfis" e "com 5 crianças os agregados aparecem"; a ocultação acontece no servidor |
| Atualização e legibilidade | Consolidação confirmada | ✅ | Depois de consolidar, a ficha e o painel são reconsultados (verificado no navegador; contagem e motivos testados em `historico/lacunas.spec.ts`). Barras: cinza NC, amarelo D, verde C, branco hachurado U, com legenda e contagens. |
| Desempenho verificável | Medição de referência | ❌ | Tarefa 9.3 (P1) não feita |

## catalogo-pedagogico

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Catálogo inicial por etapa | Catálogo do segundo ano | ✅ | `cat-v1.spec.ts`: "o 2º ano oferece H02-LP01..LP04 e H02-MAT01..MAT04, com as descrições da fonte" |
| Rubrica e ausência | Habilidade sem evidência registrada | ✅ | `seed.spec.ts`: "habilidade nunca avaliada não vira linha"; a tela mostra "— Sem avaliação", separado de "○ Não consolidada" |
| | Regressão observada | ✅ | Não se exige evolução: `lacunas.spec.ts` "CR-05" (Consolidada no 2º e Não consolidada no 4º) |
| Versão fixada | Publicação de CAT-v2 | ⚠️ | Cada contexto guarda `catalogVersion` e o servidor só aceita habilidade do catálogo do contexto (`avaliacao.spec.ts`: "habilidade de outra etapa é rejeitada"). Não há CAT-v2 para testar (CR-22). |
| | Habilidades semelhantes | ✅ | A identidade é só o ID estável; não existe equivalência por nome (`lacunas.spec.ts`, deduplicação por ID) |
| Fixture demonstrativa separada | Reprodução da captura | ✅ | `cat-v1.spec.ts`: "a fixture de cinco itens é separada … (CR-24)"; `painel.spec.ts`: turma CAT-v1 com 8 crianças = 64 pares |

## calendario-letivo

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Calendário único e referência temporal | Período passado reaberto | ✅ | `calendario.spec.ts`: depois de reabrir o 4º bimestre de 2025, a referência continua 19/12/2025 |
| | Período futuro | ✅ | `acesso.spec.ts`: "bimestre que ainda não começou: 422 PERIODO_FUTURO"; o painel mostra "ainda não começou" |
| Fechamento com ausências | Fechar bimestre incompleto | ✅ | `calendario.spec.ts`: "CA-13.2…": lista as ausências por turma, fecha com justificativa e trilha, bloqueia a escrita e não cria avaliações; tela "Calendário" da coordenação |
| | Ano com período aberto | ✅ | `calendario.spec.ts`: "CA-13.3…": 422 BIMESTRE_ABERTO; com os quatro fechados, o ano fecha |
| Bloqueios por período | Tentativa de editar avaliação fechada | ✅ | `acesso.spec.ts` e `avaliacao.spec.ts`: "bimestre 2 de 2026 dá 422 PERIODO_FECHADO"; a tela mostra "🔒 Este bimestre está fechado" |
| | Encerramento atual de atenção manual | ⚠️ | As ações de atenção não dependem do período (`atencao.service.ts`). Falta manter a atenção ativa nas consultas anteriores ao encerramento: hoje o painel usa a situação atual. |
| Reabertura preserva encerramento | Reabertura após passagem de ano | ✅ | `calendario.spec.ts`: reabrir bimestre de ano fechado exige reabrir o ano; depois disso, a herança (6 pendências do Bernardo) e o contexto de 2026 continuam |

## gestao-escolar

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Cadastros escolares mínimos | Possível duplicidade | ❌ | Tarefa 7.1 (P1) |
| Matrícula única e transferência | Transferência durante o bimestre | ⚠️ | O cálculo trata a transferência sem copiar avaliação (`painel.spec.ts`, CA-10.3). Falta a tela para transferir (7.2). |
| Vigência dos vínculos | Substituição autorizada | ❌ | Tarefa 7.1 (P1); titular e substituta já coexistem na base fictícia |
| | Vínculo encerrado | ⚠️ | Vínculo vencido não dá leitura nem escrita (Ana Paula, `acesso.spec.ts`). Falta a tela para encerrar vínculo. |
| Passagem de ano e repetência | Repetência | ⚠️ | A regra de herança com repetência está testada (`lacunas.spec.ts`). Falta a operação de matrícula (7.2). |
| | Mudança excepcional de etapa | ❌ | Tarefa 7.2 (P1) |
| Transferência externa e arquivamento | Saída da escola | ❌ | Tarefa 7.2 (P1) |
| Dados sintéticos e recuperação | Restauração antes da entrega | ⚠️ | `npm run seed:reset` recria a base do zero (`seed.spec.ts`: "reinicialização devolve exatamente a mesma base"). Falta o procedimento de cópia e restauração do arquivo (9.1). |

## regras-e-casos-de-referencia

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Regras visíveis e coerentes | Consulta das regras | ❌ | Tela de regras (tarefa 8.3) não feita |
| Execução isolada | Execução com falha | ❌ | Tarefa 8.3 |
| | Antes da conclusão | ❌ | Tarefa 8.3 |
| Contratos dos casos de referência | Casos reproduzíveis | ⚠️ | 23 dos 24 CR verificados na suíte automática (tabela abaixo); CR-22 é parcial. Falta a tela de regras (8.3). |
| Demonstração e evidências | Declaração de conclusão | ⚠️ | Este relatório e o roteiro de demonstração (`docs/roteiro-demonstracao.md`). O roteiro PRO-01 a PRO-09 completo (10.1) depende do P1. |
| | Entrega parcial | ✅ | Este relatório declara a entrega como parcial e lista o que falta |

### Casos de referência (CR)

| CR | Situação | Onde |
| --- | --- | --- |
| CR-01 a CR-04 | ✅ | `percentual.spec.ts`; `painel.spec.ts` (domain) |
| CR-05, CR-06, CR-07 | ✅ | `lacunas.spec.ts` |
| CR-08, CR-09, CR-10 | ✅ | `atencao.spec.ts` (domain) |
| CR-11 | ✅ | `painel.spec.ts` (domain) |
| CR-12, CR-13 | ✅ | `painel.spec.ts` (domain) |
| CR-14 a CR-17 | ✅ | `atencao.spec.ts` (domain e integração) |
| CR-18 | ✅ | `painel.spec.ts` (domain e integração) |
| CR-19 | ✅ | `painel.spec.ts` (domain): "ausência entra no denominador" |
| CR-20 | ✅ | `painel.spec.ts` (domain); `evolucao.spec.ts` |
| CR-21 | ✅ | `acesso.spec.ts`, `avaliacao.spec.ts`, `ficha.spec.ts`, `painel.spec.ts` |
| CR-22 | ⚠️ | O catálogo é fixado por contexto, mas não existe CAT-v2 para comparar |
| CR-23 | ✅ | `lacunas.spec.ts`; o painel considera a atenção manual aberta até a referência |
| CR-24 | ✅ | `cat-v1.spec.ts` (fixture separada) e `percentual.spec.ts` (17/40 = 42,5%) |

---

## Tarefas do `tasks.md`

As tarefas concluídas estão marcadas `[x]` no próprio `tasks.md`; as parciais trazem uma nota. Resumo:

- **Concluídas:** 1.1 a 1.4, 2.2, 2.3, 3.1 a 3.5, 4.1 a 4.4, 5.1, 6.1 a 6.4, 7.3, 8.2.
- **Parciais:** 2.1 (falta o teste de elevação de perfil e a desativação pela tela), 3.6 (acessibilidade sem registro formal), 5.2 (falta a correção do texto original), 5.3 (falta o corte histórico da atenção manual encerrada).
- **Não feitas:** 7.1, 7.2, 7.4, 8.1 (parte já coberta pelo painel), 8.3, 8.4, grupo 9 e grupo 10, exceto o que este relatório adianta da 10.2.

## Limitações conhecidas

- As sessões ficam em memória: reiniciar o servidor desloga todos (decisão do MVP).
- A data de "hoje" vem do relógio do computador (fuso America/Sao_Paulo). A base fictícia foi pensada para novembro de 2026: 3º e 4º bimestres abertos, e o 4º sem registros.
- Nenhum dado real: escola, alunos e textos são fictícios.
