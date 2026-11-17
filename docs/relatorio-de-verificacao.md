# Relatório de verificação — Fio da Aprendizagem

Tarefas 10.2 e 10.3 do `tasks.md`. Mostra, para cada spec de `openspec/changes/especificar-fio-da-aprendizagem/specs/`, se cada cenário foi implementado e qual é a evidência. Nada é declarado "feito" sem evidência.

- **Data:** 17/11/2026 · **Código verificado:** branch `main` (ver `git log`; o último commit é a versão candidata).
- **Execução pelo guia (10.3):** em 17/11, um clone novo do GitHub (commit `680307e`) seguiu só o README: `npm install`, `npm run seed`, `npm test` (168 de 168), `npm run build` e `npm start` (API e telas respondendo e login funcionando), sem nenhum ajuste manual.
- **Testes automáticos:** 168 de 168 passando (`npm test`). Saída completa em [`docs/evidencias/saida-npm-test.txt`](evidencias/saida-npm-test.txt).
- **Resultado:** 88 dos 93 cenários das specs com evidência (✅), 4 parciais (⚠️), nenhum não feito e 1 que não se aplica à entrega local. Rastreabilidade por RF, RNF e CR na seção "Rastreabilidade por ID".
- **Classificação da entrega:** **parcial**, conforme a regra da tarefa 10.3 (P1 incompleto = parcial). P0 e quase todo o P1 estão implementados e verificados (gestão, calendário, indicadores, regras, cópia de segurança, desempenho). Ficam parciais: a verificação manual de acessibilidade em dois navegadores (9.4/3.6, em andamento pelo grupo), o teste automático de interface da falha de gravação (RF-13/RNF-07), a publicação de um CAT-v2 real e a execução integrada do roteiro completo (10.1). Ver "Tarefas" e "Limitações" no fim.

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
| acesso-e-permissoes | 9 | 8 | 0 | 0 | 1 |
| avaliacao-bimestral | 12 | 10 | 2 | 0 | 0 |
| historico-pedagogico | 6 | 6 | 0 | 0 | 0 |
| lacunas-herdadas | 11 | 11 | 0 | 0 | 0 |
| atencao-pedagogica | 13 | 13 | 0 | 0 | 0 |
| paineis-e-indicadores | 15 | 15 | 0 | 0 | 0 |
| catalogo-pedagogico | 6 | 5 | 1 | 0 | 0 |
| calendario-letivo | 7 | 7 | 0 | 0 | 0 |
| gestao-escolar | 8 | 8 | 0 | 0 | 0 |
| regras-e-casos-de-referencia | 6 | 5 | 1 | 0 | 0 |
| **Total** | **93** | **88** | **4** | **0** | **1** |

---

## acesso-e-permissoes

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Contas individuais e papéis | Desativação de professora | ✅ | `acesso.spec.ts`: "conta desativada dá 401 e a sessão aberta antes deixa de valer". A autoria fica preservada porque a conta não é apagada. A coordenação desativa e reativa pela tela **Gestão → Contas** (`gestao.spec.ts`: "desativar corta o acesso sem apagar a conta"). |
| | Elevação indevida | ✅ | `gestao.spec.ts`: "professora não cria conta de coordenação nem muda o próprio papel" (403, papel continua PROFESSOR e não existe operação que altere papel). O guard recarrega o papel do banco a cada requisição (`common/auth.ts`). |
| Consulta contextual autorizada | Histórico de aluno atual | ✅ | `avaliacao.spec.ts`: "histórico de 2025 fica disponível à professora atual, com autoria preservada"; `ficha.spec.ts`: "CA-05.1…" |
| | Ex-aluno sem vínculo | ✅ | `acesso.spec.ts`: "Ana Paula não lê ex-aluna, mesmo sendo autora dos registros de 2025: 403"; também na ficha, na avaliação e no painel |
| Edição pedagógica por autoria | Titular e substituta simultâneas | ✅ | `avaliacao.spec.ts`: "Beatriz salva; Débora sem versão recebe 409; com versão recebe 403 AUTORIA; mas salva uma habilidade ausente" |
| | Correção antiga pela autora | ✅ | `calendario.spec.ts`: "correção antiga pela autora em bimestre reaberto…": a autora corrige o 1º bimestre reaberto, com revisão; outra professora recebe AUTORIA. A regra não exige a turma original (`policy.service.ts`), mas não há teste com turma de origem diferente. |
| | Coordenação tenta editar | ✅ | `avaliacao.spec.ts`: "coordenação lê tudo, mas … salvar dá 403"; a tela fica em modo consulta, sem botão Salvar (verificado manualmente) |
| Gestão restrita e sessão identificada | Professor tenta administrar matrícula | ✅ | `gestao.spec.ts`: "CA-12.4: professora não acessa nenhuma operação administrativa (403)" e `movimentacoes.spec.ts` (403 em todas as movimentações); o menu "Gestão" só aparece para a coordenação. O menu lateral identifica pessoa e perfil; sessão encerrada leva ao login. |
| Proteção de credenciais (hospedada) | Acesso hospedado | N/A | A entrega é local; a não aplicabilidade está registrada em [`docs/guia-operacional.md`](guia-operacional.md), seção 6 (tarefa 9.2). Mesmo assim, foi conferido em `data/fio.sqlite` que as 5 senhas estão com hash bcrypt e que a senha de demonstração não aparece no arquivo. O cookie é `httpOnly`. |

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
| | Saída com alterações | ✅ | `beforeunload` e confirmação ao trocar de tela (`Avaliacao.tsx`). Verificado no navegador em 17/11: com um nível marcado e não salvo, "Voltar" mostra "Há alterações não salvas nesta avaliação. Sair mesmo assim e perder as alterações?" e, ao cancelar, a tela continua na avaliação. |
| Revisões e limpeza justificada | Limpeza de resposta | ✅ | `limpar.spec.ts`: "a autora limpa com justificativa: vigente fica Sem avaliação e a versão anterior continua consultável"; regras (justificativa, autoria, versão, coordenação, período fechado) testadas. Na ficha, a célula mostra "— ✎" e a versão anterior aparece em "Correções neste ano". |
| | Retificação pela sucessora | ✅ | A sucessora registra observação própria sem alterar o registro alheio: `avaliacao.spec.ts` (AUTORIA 403 e observações de duas autoras) |
| Concorrência sem perda silenciosa | Duas professoras na mesma resposta ausente | ✅ | `avaliacao.spec.ts`: "duas criações simultâneas da mesma habilidade: um sucesso e um 409 (CA-13.5)" |
| Interface acessível e estados claros | Registro por teclado em 360 px | ⚠️ | Rádios nativos dentro de `fieldset`/`legend`, foco visível, estados em texto e símbolo; pré-checagem registrada em [`docs/evidencias/acessibilidade-rnf04.md`](evidencias/acessibilidade-rnf04.md) (17/11): ordem do Tab, foco visível, nomes acessíveis em 8 telas e 10 telas sem rolagem lateral em 360 px; três problemas encontrados e corrigidos (Ficha e Calendário passavam de 360 px, foco no menu lateral, atalho "Pular para o conteúdo"). Falta a verificação manual em dois navegadores (parte 2 do mesmo arquivo, tarefa 9.4). |

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
| | Histórico externo desconhecido | ✅ | `ficha.spec.ts`: ingressante sem prontuário fica "Atenção não concluída" sem escrita e, com escrita adequada, "Sem sinal de atenção", com "Histórico anterior indisponível" visível à parte. |
| Abertura e autoria de atenção manual | Justificativa vazia | ✅ | `atencao.spec.ts` (integração): "CA-09.1–09.3 … texto vazio é rejeitado" |
| | Motivos coexistentes | ✅ | Mesmo teste: duas atenções com IDs e autoras próprios. Correção do texto original só pela autora, com a versão anterior preservada: `atencao.spec.ts`, "tarefa 5.2: só a autora corrige o texto original" (substituta e coordenação recebem 403); botão **Corrigir texto** na ficha (verificado no navegador). |
| Ciclo de vida independente | Sucessora encerra atenção | ✅ | `atencao.spec.ts` (integração): "CA-09.5: substituta encerra com justificativa (autora original preservada)…"; verificado também no navegador |
| | Melhora automática | ✅ | `atencao.spec.ts` (domain): "CA-09.1 / CA-09.5: manual ativa sinaliza sem critério automático" |
| | Reabertura | ✅ | `atencao.spec.ts` (integração): reabre e preserva os eventos COMENTARIO → ENCERRAMENTO → REABERTURA. Corte histórico (CR-23, tarefa 5.3): "encerrada no 4º bimestre, a atenção manual continua valendo na consulta do 3º"; regra pura `manualAtivaEm` em `domain/atencao.spec.ts`. |

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
| Desempenho verificável | Medição de referência | ✅ | `npm run desempenho`: base sintética de 500 alunos e 5 anos (2022–2026), aplicação real via HTTP, inicialização fora da medição. **30 de 30** operações (10 painéis, 10 fichas, 10 salvamentos) em até 2 s; a mais lenta foi o painel da escola inteira (≈ 1 s). Ambiente, dados e os 30 tempos em [`docs/evidencias/desempenho-rnf06.md`](evidencias/desempenho-rnf06.md). |

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
| | Encerramento atual de atenção manual | ✅ | As ações de atenção não dependem do período (`atencao.service.ts`). `atencao.spec.ts`: "encerrada no 4º bimestre, a atenção manual continua valendo na consulta do 3º" (tarefa 5.3). |
| Reabertura preserva encerramento | Reabertura após passagem de ano | ✅ | `reabertura.spec.ts` (tarefa 7.4), com passagem real para 2027: "a matrícula de 2027 permanece e 2026 continua elegível para herança", "uma correção antiga, feita depois da reabertura, não supera a consolidação de 2027" e "datas de referência passadas não mudam". Também `calendario.spec.ts` (reabrir bimestre de ano fechado exige reabrir o ano). Procedimento: `docs/guia-operacional.md`, seção 7. |

## gestao-escolar

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Cadastros escolares mínimos | Possível duplicidade | ✅ | `gestao.spec.ts`: "sinaliza sem mesclar: só cadastra com confirmação, e o novo aluno nasce sem o histórico do outro" e "nome igual, com erro de digitação ou mesmo primeiro nome na turma é sinalizado; sem CPF". Tela **Gestão → Alunos** mostra os parecidos e pede confirmação (verificado no navegador). |
| Matrícula única e transferência | Transferência durante o bimestre | ✅ | `movimentacoes.spec.ts`: "mesmo registro bimestral, origem visível, uma contagem e autoria respeitada" (nova matrícula no mesmo contexto, sem sobreposição; 2º A com 7 e 2º B com 5; a professora de destino preenche o que falta e recebe 403 ao tentar substituir resposta de outra autora). Tela **Gestão → Alunos → Movimentar** (verificado no navegador). |
| Vigência dos vínculos | Substituição autorizada | ✅ | `gestao.spec.ts`: "segunda titular é recusada; substituta explícita coexiste e as duas acessam". Tela **Gestão → Turmas e vínculos**. |
| | Vínculo encerrado | ✅ | `gestao.spec.ts`: "a professora deixa de registrar; a autoria passada continua" (vínculo encerrado pela coordenação, não apagado). Também `acesso.spec.ts` (Ana Paula). |
| Passagem de ano e repetência | Repetência | ✅ | `movimentacoes.spec.ts`: "mesma etapa, nova matrícula, mesmos IDs de habilidade" e "passagem: nova matrícula e contexto novo, sem copiar avaliações"; só depois do fechamento do ano ("só depois do fechamento do ano de origem"). Herança com repetência: `lacunas.spec.ts`. |
| | Mudança excepcional de etapa | ✅ | `movimentacoes.spec.ts`: "contexto novo sem avaliação; o anterior é conservado sem conversão" (justificativa obrigatória; no painel da nova turma, 0 de 8 habilidades avaliadas). |
| Transferência externa e arquivamento | Saída da escola | ✅ | `movimentacoes.spec.ts`: "encerra a matrícula no último dia informado, com motivo; histórico fica consultável pela coordenação". Arquivamento: `gestao.spec.ts`. Toda movimentação fica na trilha (tabela `movimentacoes`, com data, autora e motivo). |
| Dados sintéticos e recuperação | Restauração antes da entrega | ✅ | Procedimento em [`docs/guia-operacional.md`](guia-operacional.md) (`npm run backup`, `npm run restaurar`). `npm run verificar-restauracao` restaurou a base de demonstração em ambiente separado: 18 tabelas idênticas (linhas e hash de todo o conteúdo), evidência em [`docs/evidencias/restauracao-rnf05.md`](evidencias/restauracao-rnf05.md). `copia-seguranca.spec.ts`: "restaura vínculos, matrículas, avaliações com versão, revisões e autoria exatamente como estavam". Reinício: `npm run seed:reset` (`seed.spec.ts`). |

## regras-e-casos-de-referencia

| Requisito | Cenário | Situação | Evidência / o que falta |
| --- | --- | --- | --- |
| Regras visíveis e coerentes | Consulta das regras | ✅ | Tela "Regras" (menu da coordenação; a professora recebe 403, `casos-referencia.spec.ts`), aba "Como o sistema decide": matriz de escrita (política do projeto, não BNCC), fórmulas de atenção e indicadores, limite 2, última marcação, herança, ausência, N < 5 e catálogos CAT-v1 e demonstrativo. Os valores vêm das constantes que o sistema usa (`GET /api/regras`). |
| Execução isolada | Execução com falha | ✅ | `casos-referencia.spec.ts`: "falha controlada aparece como falha, com esperado e obtido, e ajusta o total"; na tela, "Simular um erro" mostra o CR-01 como "Diferente", com resposta certa e valor calculado lado a lado (verificado no navegador). A execução não acessa o banco. |
| | Antes da conclusão | ✅ | Enquanto executa, a tela mostra só "⏳ Conferindo os exemplos…"; o resumo e os exemplos só aparecem com o resultado real (`Regras.tsx`; verificado no navegador). |
| Contratos dos casos de referência | Casos reproduzíveis | ✅ | Os 24 CR estão em `modules/regras/casos-referencia.ts`, com as funções reais: 23 executados na tela (`casos-referencia.spec.ts`: "23 casos … aprovados") e o CR-21 marcado "fora da tela", com evidência de integração. |
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
| CR-22 | ✅ | Tela de regras / `casos-referencia.ts`: com um CAT-v2 hipotético, a turma CAT-v1 continua com T = 64 (não existe CAT-v2 real no banco) |
| CR-23 | ✅ | `lacunas.spec.ts`; atenção manual com corte histórico na abertura e no encerramento (`manualAtivaEm`, `atencao.spec.ts`); `reabertura.spec.ts` |
| CR-24 | ✅ | `cat-v1.spec.ts` (fixture separada) e `percentual.spec.ts` (17/40 = 42,5%) |

### Rastreabilidade por ID (tarefa 10.2)

Resultado por identificador dos documentos-base. A coluna "Evidência" aponta para as seções acima (por spec) e para os testes; nada é marcado ✅ sem teste ou verificação registrada.

**Requisitos funcionais**

| ID | Situação | Evidência principal |
| --- | --- | --- |
| RF-01 Identificar aluno, turma, ano e bimestre | ✅ | avaliacao-bimestral e calendario-letivo; `avaliacao.spec.ts`, `calendario.spec.ts` |
| RF-02 Avaliar habilidades do catálogo | ✅ | avaliacao-bimestral e catalogo-pedagogico; `cat-v1.spec.ts`, `avaliacao.spec.ts` (a publicação de um CAT-v2 real não existe; ver ⚠️ em catalogo-pedagogico) |
| RF-03 Registrar escrita por bimestre | ✅ | avaliacao-bimestral; `avaliacao.spec.ts` |
| RF-04 Observações livres | ✅ | avaliacao-bimestral; limite compartilhado de 4.000 em `avaliacao.spec.ts` e `regras.spec.ts` |
| RF-05 Trajetória individual | ✅ | historico-pedagogico; `ficha.spec.ts` |
| RF-06 Lacunas herdadas | ✅ | lacunas-herdadas; `lacunas.spec.ts`, `ficha.spec.ts` |
| RF-07 Consolidação/reavaliação herdada | ✅ | lacunas-herdadas; `lacunas.spec.ts` (historico) |
| RF-08 Atenção e motivos | ✅ | atencao-pedagogica; `atencao.spec.ts` (domain e integração) |
| RF-09 Atenção manual | ✅ | atencao-pedagogica; `atencao.spec.ts` (inclui correção pela autora e corte histórico) |
| RF-10 Painel da turma | ✅ | paineis-e-indicadores; `painel.spec.ts`, `evolucao.spec.ts` |
| RF-11 Consulta ampla da coordenação | ✅ | paineis-e-indicadores e acesso-e-permissoes; `painel.spec.ts`, `acesso.spec.ts` |
| RF-12 Gestão de alunos, turmas, matrículas e docentes | ✅ | gestao-escolar (8 de 8); `gestao.spec.ts`, `movimentacoes.spec.ts`, `reabertura.spec.ts` |
| RF-13 Salvamento, revisões e fechamento | ⚠️ | avaliacao-bimestral e calendario-letivo; `limpar.spec.ts`, `calendario.spec.ts`. Parcial: falta teste automático de interface para "falha de gravação" (o comportamento está implementado em `Avaliacao.tsx`) |
| RF-14 Regras e casos de referência | ✅ | regras-e-casos-de-referencia; `casos-referencia.spec.ts` e tela Regras |

**Requisitos não funcionais**

| ID | Situação | Evidência |
| --- | --- | --- |
| RNF-01 Integridade histórica | ✅ | Revisões e eventos preservam o original: `avaliacao.spec.ts`, `limpar.spec.ts`, `lacunas.spec.ts`, `movimentacoes.spec.ts` (nada copiado) |
| RNF-02 Autenticação e autorização | ✅ | `acesso.spec.ts` (leitura e escrita negadas por acesso direto), CR-21, `gestao.spec.ts` (CA-12.4, elevação de perfil) |
| RNF-03 Rastreabilidade | ✅ | Autora, instante e contexto em respostas, revisões, eventos, vínculos, calendário e movimentações (`calendario.spec.ts`, `movimentacoes.spec.ts`); textos pedagógicos fora dos logs |
| RNF-04 Acessibilidade e clareza | ⚠️ | Pré-checagem e correções em [`docs/evidencias/acessibilidade-rnf04.md`](evidencias/acessibilidade-rnf04.md); falta a verificação manual em dois navegadores (tarefa 9.4, parte 2 do arquivo) |
| RNF-05 Dados e recuperação | ✅ | Base só sintética; [`docs/evidencias/restauracao-rnf05.md`](evidencias/restauracao-rnf05.md), `copia-seguranca.spec.ts` |
| RNF-06 Desempenho de referência | ✅ | [`docs/evidencias/desempenho-rnf06.md`](evidencias/desempenho-rnf06.md): 30 de 30 em até 2 s |
| RNF-07 Persistência e falhas | ⚠️ | Dados persistem entre sessões (`seed.spec.ts`, `copia-seguranca.spec.ts`); conflito pede atualização (`avaliacao.spec.ts`, 409). Mesma pendência de RF-13 quanto ao teste de interface da falha de gravação |

**Casos de referência:** CR-01 a CR-24 conforme a tabela "Casos de referência (CR)" acima; além disso, 23 deles rodam ao vivo na tela **Regras** (23 de 23 aprovados) e o CR-21 é provado por integração.

**Critérios CA críticos (D12):** CA-01 a CA-14 estão cobertos pelos cenários das specs listados nas seções acima, conforme a tabela de rastreabilidade de `design.md` (D12). Os únicos critérios ainda parciais são os de RF-13/RNF-07 e RNF-04 citados nesta seção.

---

## Tarefas do `tasks.md`

As tarefas concluídas estão marcadas `[x]` no próprio `tasks.md`; as parciais trazem uma nota. Resumo:

- **Concluídas:** 10.2 e 10.3, 1.1 a 1.4, 2.1 a 2.3, 3.1 a 3.5, 4.1 a 4.4, 5.1 a 5.3, 6.1 a 6.4, 7.1 a 7.4, 8.1 a 8.4, 9.1 a 9.3.
- **Parciais:** 3.6 (pré-checagem automática registrada; falta a verificação manual em dois navegadores).
- **Não feitas:** 9.4 (roteiro pronto para preencher em `docs/evidencias/acessibilidade-rnf04.md`, em andamento pelo grupo) e 10.1 (execução integrada do roteiro de demonstração, a fazer no ensaio da apresentação).

## Limitações conhecidas

- As sessões ficam em memória: reiniciar o servidor desloga todos (decisão do MVP).
- A data de "hoje" vem do relógio do computador (fuso America/Sao_Paulo). A base fictícia foi pensada para novembro de 2026: 3º e 4º bimestres abertos, e o 4º sem registros.
- Nenhum dado real: escola, alunos e textos são fictícios.
- Entrega local, sem hospedagem: HTTPS, recuperação de senha por e-mail e backup diário não se aplicam (guia operacional, seção 6). A "nova senha" é gerada pela coordenação.
- Não existe catálogo CAT-v2 publicado; a regra de versão fixada por contexto está implementada e testada só com o CAT-v1 e o catálogo demonstrativo (CR-22, CR-24).
- Passagem de ano exige que o ano esteja fechado no Calendário; na base de demonstração (novembro de 2026) ela é recusada de propósito.
- Acessibilidade: não houve teste com leitor de tela; a verificação manual em dois navegadores está em andamento.
- Falha de gravação: o comportamento (não mostrar "Tudo salvo" e manter as alterações) está implementado, mas sem teste automático de interface.
