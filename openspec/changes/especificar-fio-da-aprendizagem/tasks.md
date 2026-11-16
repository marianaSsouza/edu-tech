# Tasks

Checklist de implementação. Situação em 16/11/2026 conferida em `docs/relatorio-de-verificacao.md`; [x] = concluída com evidência, nota "Parcial" = iniciada sem cumprir toda a verificação. Seguir `design.md` e as dez specs. Grupos 1–6 estabelecem P0; grupos 7–10 completam P1. A base de fechamento e vigência deve existir desde P0, mesmo antes dos formulários administrativos de P1.

## 1. Base da aplicação e dados sintéticos — P0

- [x] 1.1 Preparar aplicação web única, persistência transacional e comandos locais reproduzíveis, registrando ferramentas e versões no guia de execução; verificar inicialização limpa e leitura após reinício.
- [x] 1.2 Implementar estruturas de contexto pedagógico, matrícula, vínculo, período, resposta, revisão e eventos conforme D02–D06; verificar unicidade de resposta, referência de origem e gravação atômica com testes de persistência.
- [x] 1.3 Carregar CAT-v1 exatamente da seção 4 dos Requisitos v1.2 e fixar versão por contexto; verificar 40 IDs, oito itens por etapa, CA-02.1 e CR-22, mantendo fixture de cinco itens separada.
- [x] 1.4 Criar base fictícia reinicializável com dois anos, turmas de pelo menos cinco e quatro alunos, titular/substituta e eventos de referência; verificar execução repetida sem duplicar identidades e documentar reinicialização e contas de demonstração.

## 2. Autenticação e autorização — P0

- [ ] 2.1 Implementar contas individuais, entrada, saída, coordenação inicial e bloqueio de conta desativada; verificar ausência de cadastro público, elevação de perfil negada e autoria preservada após desativação. _(Parcial: falta teste dedicado de elevação de perfil e desativação de conta pela tela (grupo 7).)_
- [x] 2.2 Aplicar autorização em leituras e alterações por papel, vínculo atual, autoria e período; verificar CR-21, CA-11.4 e CA-12.4 por acesso direto, além da consulta histórica permitida de aluno atual.
- [x] 2.3 Implementar proteção de respostas entre titular/substituta e correção antiga pela autora atualmente vinculada; verificar cenários de autoria e atualizar o guia de permissões com exemplos de transferência.

## 3. Avaliação e revisões — P0

- [x] 3.1 Implementar seleção de aluno/etapa/ano/bimestre, catálogo, três níveis de habilidade e quatro níveis de escrita; verificar CA-01.1–01.3, CA-02.2/02.3 e CA-03.1–03.3 sem transporte automático de respostas.
- [x] 3.2 Implementar observações por autora e limite compartilhado de 4.000 caracteres vigentes; verificar CA-04.1–04.3, vazio permitido, correção própria e rejeição do excesso com duas autoras.
- [x] 3.3 Implementar salvamento parcial, confirmação após persistência, aviso de saída e erro recuperável; verificar CA-13.1, RNF-07 e releitura depois de reabrir a sessão.
- [x] 3.4 Implementar revisão justificada e limpeza de resposta, preservando versões; verificar CA-13.4, RNF-01/03 e retificação pela sucessora sem alterar o indicador antigo.
- [x] 3.5 Implementar conflito por versão desatualizada e unicidade sob gravação simultânea; verificar CA-13.5, disputa de duas autoras pelo campo ausente e limite de observações sob concorrência.
- [ ] 3.6 Verificar fluxo de registro por teclado em desktop e 360 px, foco, rótulos e estados de PRO-04; registrar evidências de RNF-04 e documentar salvamento, correção e conflito. _(Parcial: teclado, foco e 360 px conferidos manualmente; falta o registro formal em dois navegadores.)_

## 4. Histórico e lacunas — P0

- [x] 4.1 Implementar linha do tempo e consulta de versões, com resumo anual e última observação não vazia; verificar CA-05.1–05.3, quarta avaliação ausente sem apagar marcação anterior e acesso a todas as observações.
- [x] 4.2 Implementar elegibilidade de anos encerrados ao menos uma vez, deduplicação por ID e última marcação; verificar CA-06.1–06.3, CR-05/07, repetência e histórico externo indisponível sem lacunas fabricadas.
- [x] 4.3 Implementar consolidação e reavaliação herdada com origem e justificativa; verificar CA-07.1–07.4, CR-06 e reabertura da pendência após regressão.
- [x] 4.4 Implementar precedência por período/ordem de registro e revisão na posição original; verificar eventos distintos no mesmo bimestre, correção retroativa e CR-23, documentando a diferença entre correção e avanço posterior.

## 5. Atenção pedagógica — P0

- [x] 5.1 Implementar matriz de escrita e motivos automáticos com limite fixo 2; verificar CA-08.1–08.7 e CR-08–10/14–17, incluindo igualdade ao mínimo, ausência e múltiplos motivos.
- [ ] 5.2 Implementar abertura, comentários, correção própria, encerramento e reabertura manual; verificar CA-09.1–09.5, texto de 1–2.000 caracteres, sucessora autorizada e negação à coordenação. _(Parcial: abrir, comentar, encerrar e reabrir feitos; falta a autora corrigir o texto original.)_
- [ ] 5.3 Implementar preservação manual entre anos e ações atuais após fechamento; verificar corte histórico de CR-23, melhora automática sem encerramento manual e aviso separado de histórico indisponível; documentar esses estados. _(Parcial: preservação e ações após fechamento feitas; falta manter a atenção ativa nas consultas anteriores ao encerramento.)_

## 6. Consulta operacional e indicadores essenciais — P0

- [x] 6.1 Implementar lista alfabética, turma → aluno e filtros da coordenação com retorno preservado; verificar CA-10.1/10.5 e CA-11.1/11.2, turma vazia e consultas autorizadas.
- [x] 6.2 Implementar população por matrícula/data de referência, escrita, pendências, atenção e coberturas essenciais; verificar CA-10.2–10.4, transferência sem dupla contagem e ausência sem resultado negativo.
- [x] 6.3 Ocultar agregados de grupos menores que cinco nos dois perfis e preservar consulta individual; verificar CA-11.3 e CR-18 nos limites quatro/cinco e documentar o alcance da ocultação.
- [x] 6.4 Atualizar painel e ficha após cada mutação confirmada; verificar CA-08.6 sem reiniciar sessão e registrar o fluxo P0 integrado com persistência, autoria e autorização.

## 7. Gestão e calendário completos — P1

- [ ] 7.1 Implementar formulários de alunos, turmas, professores, contas e vínculos com vigência; verificar CA-12.1/12.4, sinalização de duplicidade, arquivamento e coexistência explícita de titular/substituta.
- [ ] 7.2 Implementar transferências internas/externas, passagem de ano, repetência e mudança excepcional de etapa; verificar CA-12.2/12.3, matrícula única e registro preservado sem cópia de avaliações.
- [x] 7.3 Implementar calendário escolar único, fechamento/reabertura com justificativa e lista de ausências; verificar CA-13.2/13.3, ano com quatro períodos encerrados e bloqueio de registro/indicadores futuros.
- [ ] 7.4 Verificar reabertura após passagem de ano preservando matrícula, herança e eventos posteriores, além de datas de referência passadas; atualizar documentação operacional e conciliar essas decisões e as de autoria/observações nos dois documentos-base, preservando IDs.

## 8. Indicadores completos e referência — P1

- [ ] 8.1 Implementar consolidação total/por habilidade, lacunas por habilidade, frações e arredondamento; verificar CR-01–04/12/13/19/24, cobertura, denominador zero, ausência total e barras acessíveis sem ajuste artificial da soma.
- [x] 8.2 Implementar evolução da escrita usando população B e registros A inclusive após transferência; verificar CR-11/20, nível igual/menor, ausência e mensagem no primeiro bimestre; documentar denominadores.
- [x] 8.3 Implementar tela de regras com execução sintética isolada, estado Executando e detalhes de falha; verificar CA-14.1–14.4 e injetar falha controlada para comprovar ausência de sucesso fictício e de gravação pedagógica.
- [x] 8.4 Consolidar execução de CR-01–CR-24 nas camadas adequadas, distinguindo testes de integração dos casos da tela; verificar cada resultado contra a tabela da spec e registrar evidências por ID.

## 9. Operação e verificações não funcionais — P1

- [x] 9.1 Preparar cópia de segurança e procedimento de restauração da demonstração; executar restauração preservando vínculos, versões e autoria e registrar evidência de RNF-05 no guia operacional.
- [ ] 9.2 Se houver hospedagem, verificar conexão protegida, recuperação confiável de acesso, ausência de senhas em texto simples e backup diário com retenção de 30 dias/acesso restrito; se a entrega for local, registrar explicitamente a não aplicabilidade das condições de hospedagem.
- [x] 9.3 Medir RNF-06 com 500 alunos, cinco anos e 30 operações após inicialização; verificar pelo menos 29 em até 2 segundos e registrar ambiente, dados e tempos, corrigindo consultas que não cumprirem a meta.
- [ ] 9.4 Verificar fluxos administrativos e de consulta por teclado, em desktop e 360 px, em dois navegadores disponíveis; registrar versões, foco, rótulos, estados e limitações conforme RNF-04.

## 10. Integração e entrega

- [ ] 10.1 Executar o roteiro PRO-01–PRO-09 e a demonstração de dois anos, incluindo ausência herdada, consolidação, atenção manual e grupo pequeno; registrar resultados integrados sem confundir simulação com persistência.
- [ ] 10.2 Conferir rastreabilidade de RF-01–RF-14, todos os CA críticos de D12, CR-01–CR-24 e RNF-01–RNF-07; produzir relatório com resultado por ID e nenhuma declaração de aprovação sem evidência.
- [ ] 10.3 Preparar candidata, cópia compatível de dados, guia de execução e lista de limitações; verificar execução pelo guia e classificar como parcial se P1 ou critérios obrigatórios estiverem ausentes.

## Workflow follow-up

- Após implementação, verificação e revisão, usar o fluxo de archive para consolidar as specs principais e arquivar esta change. Não arquivar apenas porque o planejamento está pronto.
