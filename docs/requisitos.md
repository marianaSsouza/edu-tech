# Fio da Aprendizagem — Requisitos

Versão: 1.3 · Data: 16/11/2026 · [Visão do Produto](visao-do-produto.md).

**Entrega: quarta-feira, 18/11/2026**, fuso America/Sao_Paulo; horário ainda não informado. Meta interna: versão candidata em 17/11.

**Referência visual:** [Protótipo Fio da Aprendizagem no Claude](https://claude.ai/artifact/FWTexwFdjCSZik8u5Ejiua), informado pela usuária como **desatualizado**. Seu conteúdo não pôde ser inspecionado por acesso ao link nesta revisão. Usar as cinco capturas já fornecidas como evidência visual e este documento como especificação vigente. A seção 10.1 define a atualização a realizar; o artefato externo não foi modificado nesta entrega documental.

## 1. Convenções e fontes

Esta versão substitui as indefinições da versão 1.0 pelas decisões atuais da usuária e pelos detalhes cuja definição foi delegada. Fontes: conversa recuperada, pedido inicial, três imagens iniciais e duas imagens novas (painel da coordenação e regras/casos). DEC e EVI remetem à Visão do Produto.

**C:** confirmado expressamente; **D:** definido nesta versão por delegação, válido para o MVP acadêmico; **O:** observado no protótipo; **P:** depende de contexto externo. Critérios de aceitação descrevem verificações futuras, não testes executados nesta revisão. A captura “11 de 11 passando” não comprova a implementação futura.

## 2. Glossário e contextos

- **Ano escolar:** etapa do 1º ao 5º ano. **Ano letivo:** calendário, como 2026.
- **Registro bimestral:** aluno + matrícula/contexto escolar + ano letivo + bimestre. Habilidades pertencem à versão de catálogo vinculada à turma.
- **Sem avaliação:** ausência de evidência registrada; não é um quarto nível pedagógico nem sinônimo de “Não consolidada”.
- **Lacuna herdada:** habilidade prevista em ano anterior cursado e sem consolidação vigente. Distinguir “avaliada e ainda não consolidada” de “sem avaliação registrada”. Ambas entram na contagem operacional do protótipo, mas não têm a mesma interpretação pedagógica.
- **Evento:** registro com autor, momento de registro, contexto pedagógico e referência de origem, preservado após revisões.
- **Data de referência:** determina quais matrículas e eventos compõem uma consulta histórica.

## 3. Regras de negócio

| ID | Regra | Estado |
| --- | --- | --- |
| RN01 | Quatro bimestres por ano letivo | C |
| RN02 | Uma versão vigente de cada resposta por aluno, contexto, bimestre e habilidade; revisões não apagam versões anteriores | C no vínculo bimestral; D na revisão |
| RN03 | Habilidades: Não consolidada, Em desenvolvimento, Consolidada; ausência exibida como Sem avaliação | C/O nos três níveis; D na rubrica e ausência |
| RN04 | Escrita por bimestre: Pré-silábico, Silábico, Silábico-alfabético, Alfabético | C/O; matriz e comparação D |
| RN05 | Observações livres complementam a avaliação, vinculadas ao bimestre | C; vínculo e limites D |
| RN06 | Histórico acessível conforme perfil e vínculo, sem sobrescrita do original | C; permissões D |
| RN07 | Professora atual registra consolidação posterior de lacuna; origem permanece preservada e deixa de contar como pendente atual | C; trilha e revisões D |
| RN08 | Atenção automática: lacunas herdadas pendentes >= 2 OU escrita abaixo da expectativa | C |
| RN09 | Atenção manual exige justificativa e independe dos critérios automáticos | C; ciclo de vida D |
| RN10 | Catálogo predefinido por ano, versionado e fixado no contexto letivo | C no catálogo; D na seleção/versionamento |
| RN11 | Coordenação consulta todos os anos/turmas da escola e administra vínculos e matrículas; não edita conteúdo pedagógico | C na abrangência/gestão; D no limite de edição |
| RN12 | Fórmulas determinísticas, fração exata e uma casa decimal, arredondamento meio para cima | D conforme EVI-09 |
| RN13 | Visão agregada oculta resultados pedagógicos de grupos com menos de 5 crianças; acesso individual autorizado continua disponível | D conforme EVI-08 e pedido de consulta ampla |
| RN14 | Ausência de dados nunca é exibida como avaliação feita; pode gerar pendência documental identificada | C na exibição; D nos efeitos |

### 3.1. Rubrica de habilidades — RN03

Rubrica operacional D, a validar pedagogicamente antes do uso real:

| Nível | Orientação de registro |
| --- | --- |
| Não consolidada | Houve oportunidade de observação, mas a habilidade ainda não foi demonstrada, mesmo com apoio |
| Em desenvolvimento | Há demonstração parcial, instável ou dependente de apoio |
| Consolidada | Há demonstração consistente e com autonomia em atividades adequadas ao contexto |
| Sem avaliação | Não existe avaliação registrada para aquela habilidade e período; não inferir desempenho |

Não há pontuação numérica, média ponderada nem obrigação de evolução monotônica. A professora julga as evidências; o sistema não atribui nível a partir de um texto. Habilidades podem regredir na avaliação posterior sem apagar o que foi registrado antes.

### 3.2. Matriz de escrita — RN04 / PEN-02

Ordem operacional: Pré-silábico (0), Silábico (1), Silábico-alfabético (2), Alfabético (3). Códigos servem somente à comparação; não são notas.

| Ano escolar | 1º bimestre | 2º bimestre | 3º bimestre | 4º bimestre |
| --- | --- | --- | --- | --- |
| 1º | Pré-silábico | Silábico | Silábico | Silábico-alfabético |
| 2º | Silábico-alfabético | Silábico-alfabético | Alfabético | Alfabético |
| 3º | Alfabético | Alfabético | Alfabético | Alfabético |
| 4º | Alfabético | Alfabético | Alfabético | Alfabético |
| 5º | Alfabético | Alfabético | Alfabético | Alfabético |

Os dois primeiros anos reproduzem a política da nova imagem; 3º–5º são extensão definida por delegação. São mínimos operacionais do projeto, não uma tabela normativa da BNCC. “Alfabético” não significa domínio de ortografia, compreensão ou produção textual; essas dimensões continuam nas habilidades específicas.

Para orientação, pré-silábico corresponde a registros ainda sem relação estável entre segmentos falados e escritos; silábico a representação predominantemente por sílabas; silábico-alfabético a combinação de representações silábicas e alfabéticas; alfabético a compreensão da representação dos fonemas, mesmo com dificuldades ortográficas. Essas descrições não automatizam nem substituem a avaliação docente.

Escrita ausente: mostrar “Sem avaliação de escrita”, comparação **indeterminada**, sem imputar nível. Com outro motivo conhecido, exibir “Em atenção” e a ausência adicional; sem outro motivo, exibir “Atenção automática não concluída: escrita sem avaliação”, evitando afirmar “Sem atenção”. A professora pode acrescentar atenção manual. Não transportar automaticamente a escrita de um bimestre anterior.

### 3.3. Herança, ausência, regressão e identidade — RN07 / PEN-04

1. Considerar todos os anos anteriores cursados e encerrados, inclusive repetência. O catálogo previsto nesses contextos define as habilidades esperadas. Não criar lacunas de anos que o aluno não cursou nem inferir catálogo de histórico externo desconhecido.
2. Para cada aluno/habilidade, usar a última marcação pedagógica válida até a data de referência, ordenada pelo período avaliado e depois pela revisão daquele registro. A avaliação anterior continua no histórico. Um bimestre final sem avaliação não apaga uma marcação anterior: mostrar a ausência do período separadamente.
3. Última marcação “Não consolidada” ou “Em desenvolvimento”: lacuna pedagógica pendente. Se a habilidade nunca teve marcação no contexto anterior: pendência herdada “Sem avaliação registrada”. Ambas contam em RN08, conforme caso da imagem; mostrar a decomposição, por exemplo “2 pendências: 1 não consolidada + 1 sem avaliação”.
4. Não herdar os bimestres futuros do ano em andamento. No 1º ano sem histórico anterior, não há lacunas herdadas. Histórico externo não fornecido aparece como “Histórico anterior indisponível”, sem fabricar lacunas nem afirmar que não existiram.
5. A professora atual pode consolidar ou reavaliar uma habilidade herdada por evento novo, com evidência/justificativa, autor e data. Consolidação tira a habilidade da contagem atual. Reavaliação posterior não consolidada reabre a pendência, sem apagar a consolidação anterior.
6. Contar habilidades distintas pelo identificador estável, não eventos ou anos repetidos. O mesmo ID repetido por repetência conta uma vez. Habilidades de anos diferentes não são equivalentes apenas por terem nomes parecidos; nenhuma equivalência automática no MVP.
7. Consultas de anos encerrados mostram a situação daquele contexto e identificam separadamente avanços posteriores; não reescrever indicadores históricos de 2025 com uma consolidação feita em 2026. Correções retroativas aparecem como revisões identificadas, com acesso ao registro anterior.
8. Uma avaliação antiga corrigida não supera um evento pedagógico posterior apenas porque foi editada hoje. Usar a ordem do período pedagógico; em empate, revisão vigente do mesmo registro. Evento de reavaliação atual tem contexto atual explícito.

### 3.4. Atenção — RN08 e RN09

`automática = (L >= 2) OU (escrita registrada < expectativa do ano/bimestre)`

`em atenção = motivo automático conhecido OU pelo menos uma atenção manual ativa`

Todos os motivos aplicáveis são apresentados; ausência de escrita mantém a comparação indeterminada. O limite do MVP é fixo em 2. O caso com N=1 da imagem serve para verificar a função com parâmetro alternativo, não cria configuração editável no produto.

| L | Escrita | Manual ativa | Resultado |
| --- | --- | --- | --- |
| 0 ou 1 | No mínimo esperado | Não | Sem sinal de atenção pelos critérios definidos |
| 2 | No mínimo esperado | Não | Em atenção: lacunas |
| 0 | Abaixo | Não | Em atenção: escrita |
| 3 | Abaixo | Sim | Em atenção: três motivos, uma criança no indicador |
| 0 | No mínimo esperado | Sim | Em atenção: manual |
| 0 | Ausente | Não | Comparação automática incompleta, não classificar como escrita adequada |
| 2 | Ausente | Não | Em atenção por lacunas; escrita sem avaliação |

Cada atenção manual tem ID, aluno, justificativa de 1–2.000 caracteres não vazios, autor, data de abertura, situação e eventos de alteração/encerramento. Podem coexistir motivos distintos. Professora com vínculo ativo ao aluno pode abrir, acrescentar comentário, encerrar com justificativa ou reabrir; todo evento identifica quem agiu. Texto original só é corrigido por sua autora com revisão preservada. Coordenação consulta, sem editar nem encerrar atenção pedagógica.

A atenção manual permanece ativa após avanço automático ou passagem de ano, até encerramento explícito; professora sucessora pode encerrá-la com justificativa. Correção de critério automático não encerra a manual. Transferência não apaga o histórico; registros sem vínculo atual ficam em consulta da coordenação.

## 4. Catálogo inicial — CAT-v1 / PEN-03

**Estado D:** recorte acadêmico de Língua Portuguesa (LP) e Matemática (MAT), com 8 habilidades por ano. Os identificadores abaixo são internos do projeto; não são códigos BNCC. O catálogo não pretende cobrir todos os componentes ou todas as habilidades curriculares. A BNCC orienta currículos; o mapeamento formal e a adequação local precisam de revisão pedagógica antes do uso real ([fonte oficial](https://basenacionalcomum.mec.gov.br/a-base)).

As habilidades abaixo são formulações operacionais do projeto, não transcrições da BNCC. Cada uma usa RN03; exemplos são oportunidades de observação, não provas obrigatórias ou limiares automáticos.

| ID | Habilidade | Exemplo de evidência |
| --- | --- | --- |
| H01-LP01 | Lê palavras simples | Ler palavras familiares em lista e contexto |
| H01-LP02 | Escreve palavras estabelecendo relações entre letras e sons | Produzir lista de objetos com escrita própria |
| H01-LP03 | Identifica informação explícita em texto curto lido com apoio | Responder quem participa de uma história |
| H01-LP04 | Relata acontecimentos em sequência compreensível | Recontar uma experiência com início e continuidade |
| H01-MAT01 | Conta, compara e registra quantidades até 100 | Contar coleção e comparar dois conjuntos |
| H01-MAT02 | Resolve situações simples de adição e subtração com apoio de estratégias próprias | Representar juntar ou retirar objetos |
| H01-MAT03 | Reconhece e continua padrões simples | Completar sequência de cores, formas ou números |
| H01-MAT04 | Reconhece formas e descreve posições no espaço | Identificar formas em objetos e indicar trajetos |
| H02-LP01 | Lê frases e pequenos textos com compreensão | Explicar o assunto de um pequeno texto |
| H02-LP02 | Escreve frases com segmentação entre palavras | Produzir frases compreensíveis com separação de palavras |
| H02-LP03 | Localiza informações explícitas em textos | Encontrar data ou personagem em texto curto |
| H02-LP04 | Produz e revisa pequeno texto com apoio | Escrever bilhete e revisar clareza com a professora |
| H02-MAT01 | Resolve problemas de adição e subtração | Escolher e explicar estratégia em situação cotidiana |
| H02-MAT02 | Compara e ordena números até 1.000 | Ordenar cartões e justificar maior e menor |
| H02-MAT03 | Compara medidas em situações cotidianas | Comparar comprimentos e durações com unidades adequadas |
| H02-MAT04 | Interpreta informações de tabela ou gráfico simples | Identificar categoria com maior quantidade |
| H03-LP01 | Lê textos curtos com autonomia e identifica seu assunto | Apresentar o tema após leitura individual |
| H03-LP02 | Localiza informações e faz inferências simples apoiadas no texto | Explicar sentimento de personagem com pistas |
| H03-LP03 | Produz texto curto com sequência e pontuação básica | Elaborar relato compreensível com começo, meio e fim |
| H03-LP04 | Revisa segmentação e regularidades ortográficas trabalhadas | Corrigir texto próprio com orientação |
| H03-MAT01 | Lê, compara e compõe números até a ordem de unidade de milhar | Decompor números e explicar valor posicional |
| H03-MAT02 | Resolve problemas de adição, subtração e agrupamentos multiplicativos | Comparar estratégias para grupos iguais |
| H03-MAT03 | Resolve situações de medida e uso de dinheiro | Calcular valores e comparar comprimentos ou durações |
| H03-MAT04 | Organiza dados e interpreta tabelas e gráficos | Construir tabela de pesquisa da turma e tirar conclusões |
| H04-LP01 | Identifica tema e informações centrais de textos | Resumir assunto e selecionar informações relevantes |
| H04-LP02 | Infere informações e justifica com pistas do texto | Explicar relação entre acontecimentos |
| H04-LP03 | Produz texto organizado em parágrafos e adequado à finalidade | Escrever relato ou explicação para leitor definido |
| H04-LP04 | Revisa coesão, pontuação e ortografia trabalhadas | Melhorar repetições e clareza em texto próprio |
| H04-MAT01 | Compara e decompõe números até a ordem de dezena de milhar | Explicar valor de algarismos em diferentes posições |
| H04-MAT02 | Resolve problemas envolvendo as quatro operações com números naturais | Selecionar operação e verificar plausibilidade |
| H04-MAT03 | Reconhece frações usuais e representações decimais em contextos familiares | Representar metade e quartos e interpretar preços |
| H04-MAT04 | Resolve situações de medidas e interpreta dados apresentados em tabelas e gráficos | Explicar cálculo de perímetro e comparar dados de uma pesquisa |
| H05-LP01 | Compreende textos e distingue informação explícita de inferência | Indicar o que o texto diz e o que se conclui com pistas |
| H05-LP02 | Compara informações de textos sobre um mesmo tema | Identificar concordâncias e diferenças entre fontes fornecidas |
| H05-LP03 | Produz texto com finalidade, organização e articulação de ideias | Escrever texto informativo para público definido |
| H05-LP04 | Revisa texto com crescente autonomia | Melhorar coesão, pontuação e ortografia em revisão própria |
| H05-MAT01 | Compara e representa números naturais, frações e decimais em situações adequadas | Relacionar representações usuais em uma reta numérica |
| H05-MAT02 | Resolve problemas com operações e verifica resultados por estimativa | Explicar estratégia e avaliar se o resultado faz sentido |
| H05-MAT03 | Resolve situações de medidas, perímetro e área com representações | Comparar contorno e superfície em malha quadriculada |
| H05-MAT04 | Interpreta tabelas, gráficos e situações simples de chance | Justificar conclusões e comparar possibilidades de eventos |

Manutenção: catálogo entregue com a aplicação; professores e coordenação não criam habilidades livremente no MVP. Revisão editorial gera CAT-v2 apenas para novos contextos, sem alterar CAT-v1 nem respostas históricas. Correções de descrição preservam registro da versão. Equivalências entre versões exigem decisão explícita; não comparar como se fossem idênticas.

As cinco habilidades da captura do 2º ano ficam representadas no recorte, com redações operacionais próximas; as três adicionais ampliam o catálogo para oito. Fixtures das imagens mantêm seu catálogo demonstrativo de cinco itens para reproduzir 17/40, sem misturar denominadores com CAT-v1.

## 5. Permissões e gestão — PEN-01, PEN-07 e PEN-08

| Operação | Professor com vínculo ativo | Coordenação |
| --- | --- | --- |
| Consultar turma e alunos atuais | Turmas vinculadas | Todas da escola, qualquer ano |
| Consultar histórico anterior de aluno atual | Sim | Sim |
| Consultar ex-aluno sem vínculo atual | Não; registros permanecem preservados | Sim |
| Registrar avaliação e observação | Sim, no período aberto do vínculo | Não |
| Corrigir conteúdo pedagógico próprio | Sim, período aberto e vínculo ativo; revisão preservada | Não |
| Alterar conteúdo de outra professora | Não; registrar novo evento próprio quando aplicável | Não |
| Consolidar/reavaliar lacuna herdada | Sim, aluno atual, com evento próprio | Não |
| Abrir/encerrar/reabrir atenção manual | Sim, aluno atual, com motivo | Não |
| Cadastrar alunos, turmas e professores | Não | Sim |
| Vincular docentes, substituir, matricular e transferir | Não | Sim |
| Fechar/reabrir bimestre com justificativa | Não | Sim |
| Editar catálogo ou matriz em uso | Não | Não; versão de produto |

Contas individuais; sem cadastro público. Coordenação cria/desativa contas e vínculos de professores. Conta inicial de coordenação é preparada na instalação; nenhuma professora pode elevar o próprio perfil. Autorização deve ser validada em toda leitura e alteração, inclusive ao acessar um identificador direto. Desativar conta não apaga autoria.

Matrículas têm início e fim. Uma matrícula ativa regular por aluno na escola em um instante; transferência fecha a anterior e abre a nova, mantendo histórico. Movimentação dentro do mesmo ano escolar preserva o registro bimestral do aluno e não duplica avaliações nem contagens; mostrar a turma de origem. No consolidado da escola, atribuir o aluno à turma de sua matrícula na data de referência.

Vínculos docentes têm vigência; titular e substituta podem coexistir se a coordenação indicar explicitamente. Mudança de professor revoga escrita futura do vínculo encerrado. Respostas concorrentes não são sobrescritas silenciosamente: solicitar atualização da tela e conciliação.

Passagem de ano cria matrícula nova após fechamento do ano anterior; não copia avaliações como se fossem novas. Repetência usa nova matrícula no mesmo ano escolar e mantém histórico e IDs de habilidade. Mudança excepcional de ano escolar no meio do período cria contexto novo e explicita quais habilidades não foram avaliadas; não converte automaticamente catálogos.

Transferência externa encerra matrícula; importação de prontuário de outra escola não faz parte do MVP. Para aluno ingressante sem histórico disponível, exibir a limitação. Cadastro duplicado deve ser sinalizado por nome e contexto, sem exigir CPF de criança; fusão automática não existe no MVP. Registros com histórico são arquivados, não apagados pela interface comum.

### Consulta individual e grupos pequenos

Na visão agregada, manter a linha identificadora da turma e sua quantidade de crianças, como na imagem; com N < 5, ocultar percentuais, barras e número em atenção, inclusive detalhamento por habilidade, para professora e coordenação. Mostrar “Agregado oculto: grupo menor que 5”.

A linha continua clicável para a coordenação autenticada, que pode consultar alunos na visão operacional, inclusive numa turma com 1 criança. Isso é controle de apresentação de agregados, não anonimização nem barreira contra usuário autorizado. Não haverá página pública de dados reais. Demonstrações públicas usam apenas dados sintéticos.

## 6. Registro, histórico e períodos — PEN-05 e PEN-06

Botão explícito “Salvar”; confirmação de sucesso só após persistência. Habilidades e escrita podem ficar sem avaliação, e texto livre é opcional (até 4.000 caracteres por aluno/bimestre, somando os textos vigentes de todas as autoras; cada observação é uma entrada da sua autora e versões antigas não consomem o limite). Registro parcial é permitido e exibe completude; não criar respostas padrão negativas. Avisar ao sair com alterações não salvas.

Salvar uma resposta válida torna-a vigente mesmo se o conjunto estiver incompleto. Alterações geram revisão com autor e data. A professora pode limpar uma resposta equivocada por correção justificada, preservando a versão anterior; ausência não é regressão pedagógica.

Coordenação define datas dos quatro bimestres e fecha/reabre cada um com justificativa. Fechamento aceita registros incompletos após apresentar a lista de ausências; não impede documentar a realidade nem fabrica dados. Ano fecha após seus quatro períodos serem encerrados. Reabertura de bimestre em ano fechado exige reabrir o ano, com trilha de auditoria. Reabrir o ano não retira a elegibilidade das suas habilidades para herança, não desfaz passagem de ano nem matrículas posteriores, e uma correção feita no período reaberto não supera consolidação ou reavaliação de período posterior (ordem pelo período e, no mesmo período, pela ordem de registro). Consultas de datas passadas continuam usando a matrícula daquela data. Fechar um período bloqueia a escrita pedagógica dele, mas não as ações atuais de atenção manual.

Professora edita seus registros apenas com vínculo ativo e período aberto. Titular e substituta coexistem somente quando a coordenação cadastra explicitamente a substituição; ambas preenchem respostas ainda ausentes, mas nenhuma substitui resposta de outra autora. Limpar uma resposta (voltar a "Sem avaliação") é correção da própria autora, com justificativa e versão anterior preservada. Se a autora anterior não estiver disponível, a coordenação não altera em seu nome: a professora atual registra observação de retificação/novo evento com origem e justificativa, conservando o original. Exceções administrativas adicionais ficam fora do MVP.

Observações pertencem ao bimestre. A linha do tempo mostra cada observação com contexto, sem sintetizar por IA; no resumo anual, apresenta a última observação não vazia e link para todas. Número anual de habilidades consolidadas usa a última marcação válida de cada habilidade até o fechamento, identificando que é resumo anual, não avaliação do 4º bimestre.

## 7. Indicadores e fórmulas — PEN-10

Fixar turma, ano letivo, bimestre e versão de catálogo. Para período encerrado, usar matrícula vigente no último dia do período; para atual, a data de consulta. Aluno transferido mantém histórico na origem, mas entra no total do painel da turma de referência uma vez.

Definições: N = alunos distintos no contexto; H = habilidades previstas por aluno; T = total de pares aluno/habilidade previstos (N × H se catálogo uniforme); C = pares consolidados; D = em desenvolvimento; NC = não consolidados; U = sem avaliação. Então T = C + D + NC + U. Usar as respostas daquele bimestre, sem preencher ausências com respostas anteriores. Só o resumo anual e a herança usam última marcação conforme seções 3 e 6.

| Indicador | Fórmula / apresentação |
| --- | --- |
| Consolidação da turma | 100 × C/T; mostrar C/T junto ao percentual |
| Consolidação por habilidade | 100 × alunos consolidados na habilidade/N |
| Escrita alfabética | 100 × alunos com escrita Alfabético/N; mostrar também quantidade com escrita ausente |
| Cobertura de habilidades | 100 × (T−U)/T; evita confundir baixo registro com baixo desempenho |
| Cobertura de escrita | 100 × alunos com escrita registrada/N |
| Em atenção | Quantidade distinta de alunos com qualquer motivo conhecido, sem duplicar múltiplos motivos |
| Comparação incompleta de atenção | Quantidade sem escrita e sem outro motivo conhecido; mostrar separadamente |
| Lacunas por habilidade | Crianças distintas com aquela habilidade herdada pendente/N; indicar quantas são ausência de avaliação |
| Evolução da escrita | Entre bimestres A e B do mesmo ano letivo, E = alunos com nível B > nível A; V = alunos com escrita em ambos; mostrar E de V avaliáveis e N−V sem comparação |

Na evolução, o conjunto é o da turma na data de referência B; consultar os registros A desses mesmos alunos, mesmo se mudaram de turma. Comparação padrão: 1º bimestre versus selecionado. No 1º, não calcular evolução; mostrar “Selecione dois bimestres distintos”. Níveis iguais ou menores não contam como avanço. Nenhuma comparação atribui zero a dados ausentes.

Denominadores zero: mostrar “Sem dados” e fração 0/0, sem percentual; não dividir por zero nem exibir 0% como desempenho. Se T > 0 e tudo ausente, percentual de consolidação é 0,0% com cobertura 0,0% e aviso “Sem avaliações registradas”; não rotular todos como Não consolidada.

### Arredondamento e barras

Para a fração não negativa n/d, d > 0, calcular os décimos percentuais por inteiros:

`q = floor((2000 × n + d) / (2 × d))`

Exibir `q/10` com uma casa decimal e vírgula. Preservar n/d como fração exata; não arredondar etapas intermediárias. Ex.: 7/12 → 58,3%; 2/3 → 66,7%; 1/16 → 6,3% (empate real de arredondamento). A legenda usa cinza para NC, amarelo para D, verde para C e branco hachurado/contorno para U, com rótulos e contagens acessíveis. Larguras derivam das frações originais; não corrigir percentuais para forçar soma de arredondamentos a 100,0%.

Exemplo da captura: 8 crianças × 5 habilidades = 40 pares; consolidações por habilidade = 6+3+4+3+1 = 17; 17/40 = 42,5%; escrita 6/8 = 75,0%. As contas são coerentes. Não é possível conferir o cálculo dos 2 alunos em atenção sem todos os registros individuais; a imagem comprova a exibição, não toda a origem dos dados.

Recalcular após salvamento confirmado, consolidação/reavaliação herdada, correção, abertura/encerramento manual e alteração de matrícula. Atualizar painel e ficha no mesmo contexto; não esperar reiniciar a aplicação. Consultas históricas respeitam o corte temporal, sem aplicar retroativamente uma atenção aberta depois.

## 8. Requisitos funcionais e aceitação

Identificadores RF-01 a RF-11 e seus critérios principais foram mantidos. Detalhes anteriormente propostos passam a D quando incluídos nesta versão.

| ID | Requisito | Critérios de aceitação |
| --- | --- | --- |
| RF-01 | Identificar aluno, turma, ano escolar, ano letivo e bimestre | CA-01.1: distinguir 2º ano de 2026. CA-01.2: oferecer quatro períodos. CA-01.3: nenhuma resposta muda de contexto ao trocar aba |
| RF-02 | Avaliar habilidades do catálogo vinculado | CA-02.1: turma CAT-v1 do 2º ano mostra seus oito itens. CA-02.2: salvar e reler mantém a resposta. CA-02.3: três níveis e ausência ficam distintos |
| RF-03 | Registrar escrita por bimestre | CA-03.1: escrita salva pertence ao período. CA-03.2: resposta nova não substitui bimestre anterior. CA-03.3: oferecer quatro níveis e Sem avaliação |
| RF-04 | Registrar observações livres | CA-04.1: salvar e reler “Desafios extras de leitura”. CA-04.2: professora atual consulta texto anterior com autoria/período. CA-04.3: campo vazio é permitido e limite de 4.000 é aplicado |
| RF-05 | Consultar trajetória individual | CA-05.1: mostrar contextos de 1º e 2º anos. CA-05.2: consolidação nova preserva avaliação anterior. CA-05.3: período sem resposta aparece explicitamente |
| RF-06 | Exibir lacunas de todos os anos anteriores conhecidos | CA-06.1: habilidade pendente aparece com origem e motivo. CA-06.2: consolidação remove só a pendência atual. CA-06.3: mesma habilidade na repetência conta uma vez; ausência é identificada |
| RF-07 | Registrar consolidação/reavaliação herdada | CA-07.1: avaliação 2025 continua Em desenvolvimento após consolidação em 2026. CA-07.2: contagem atual diminui. CA-07.3: evento mostra habilidade, origem, autora e data. CA-07.4: passar de duas para uma remove apenas o motivo por quantidade |
| RF-08 | Calcular atenção e exibir motivos | CA-08.1: 2 lacunas bastam. CA-08.2: escrita abaixo basta. CA-08.3: mostrar ambos quando aplicáveis. CA-08.4: 1 lacuna, escrita adequada e sem manual não sinalizam. CA-08.5: escrita igual ao mínimo não sinaliza. CA-08.6: atualização reflete-se após salvar. CA-08.7: escrita ausente deixa comparação indeterminada |
| RF-09 | Gerir atenção manual | CA-09.1: manual justificada sinaliza mesmo sem critério automático. CA-09.2: rejeitar justificativa vazia. CA-09.3: distinguir motivo manual. CA-09.4: autoria/data/situação preservadas. CA-09.5: melhora automática não encerra manual; encerramento justificado conserva histórico |
| RF-10 | Apresentar painel da turma | CA-10.1: clicar aluno abre ficha correta. CA-10.2: vários motivos contam uma criança. CA-10.3: totais usam o mesmo contexto. CA-10.4: ausência aparece nas barras e cobertura. CA-10.5: ordem alfabética, sem ranking |
| RF-11 | Permitir consulta ampla da coordenação | CA-11.1: filtrar qualquer ano/turma da escola. CA-11.2: turma clicável abre lista e ficha individual. CA-11.3: turma de 4 oculta agregados, mas permite consulta autorizada. CA-11.4: tentativa de editar avaliação é negada |
| RF-12 | Gerir alunos, turmas, matrículas e docentes | CA-12.1: coordenação cria turma e vínculo. CA-12.2: transferência encerra vínculo anterior sem apagar histórico nem duplicar contagem. CA-12.3: repetência gera matrícula nova e mantém trajetória. CA-12.4: professor não acessa operações administrativas |
| RF-13 | Gerir salvamento, revisões e fechamento | CA-13.1: parcial salvo mantém Sem avaliação. CA-13.2: período fechado bloqueia escrita. CA-13.3: reabertura guarda justificativa. CA-13.4: versões anteriores continuam consultáveis. CA-13.5: alteração concorrente não é silenciosamente perdida |
| RF-14 | Exibir regras e casos de referência | CA-14.1: mostrar fórmulas, matriz, limite 2, herança e ausência. CA-14.2: executar casos sintéticos ao abrir a tela, sem escrever dados pedagógicos. CA-14.3: mostrar total e detalhes de falhas. CA-14.4: nenhum sucesso é exibido antes da execução |

### Casos adicionais verificáveis — tela de referência

Os 11 casos da imagem são preservados conceitualmente em CR-01 a CR-11; CR-12 em diante ampliam as fronteiras. Codificação de fixture: 0 = Não consolidada, 1 = Em desenvolvimento, 2 = Consolidada; ausência é nula, nunca 0.

| ID | Entrada/situação | Esperado |
| --- | --- | --- |
| CR-01 | [2,2,1,0] | 2/4 = 50,0% |
| CR-02 | 7 consolidadas de 12 | 58,3% |
| CR-03 | 1 de 8 | 12,5% |
| CR-04 | 2 de 3 | 66,7% |
| CR-05 | Consolidada no 2º bimestre e Não consolidada no 4º | Última marcação gera lacuna no ano seguinte |
| CR-06 | Lacuna consolidada pela professora atual | Sai da contagem atual; original permanece |
| CR-07 | Habilidade prevista em ano encerrado e nunca avaliada | Pendência herdada Sem avaliação; entra na contagem, sem atribuir nível negativo |
| CR-08 | 1 lacuna e escrita alfabética no 3º bimestre do 2º ano | Sem atenção, se não houver manual |
| CR-09 | Mesmo caso com parâmetro N=1 apenas na função de teste | Atenção; configuração do produto continua 2 |
| CR-10 | Silábico-alfabético no 3º bimestre do 2º ano | Atenção por escrita |
| CR-11 | Duas crianças com dados nos dois períodos; uma avança | Evolução 1 de 2 avaliáveis |
| CR-12 | 1 de 16 | 6,3%, arredondamento meio para cima |
| CR-13 | Denominador zero | Sem dados, sem divisão por zero |
| CR-14 | 2 lacunas, escrita adequada | Atenção por lacunas |
| CR-15 | 0 lacunas, escrita abaixo | Atenção por escrita |
| CR-16 | 0 lacunas, escrita ausente e sem manual | Comparação de atenção incompleta |
| CR-17 | Dois motivos automáticos e um manual no mesmo aluno | Contagem de atenção = 1; três motivos visíveis |
| CR-18 | 4 crianças na visão agregada; depois 5 | Ocultar agregados com 4; exibir com 5 |
| CR-19 | [2,1,nulo,0] | Consolidação 1/4 = 25,0%; cobertura 3/4 = 75,0%; um Sem avaliação |
| CR-20 | Uma de três crianças não tem escrita no período A; uma das duas comparáveis avança | Evolução 1 de 2, com 1 sem comparação |
| CR-21 | Professora tenta ler aluno sem vínculo ou coordenação tenta editar avaliação | Negar ambas as operações |
| CR-22 | Catálogo v2 adicionado após ano de CAT-v1 | Não alterar denominador, textos versionados ou respostas do ano anterior |
| CR-23 | Consulta histórica anterior à consolidação ou atenção manual atual | Não aplicar evento futuro à situação histórica |
| CR-24 | 8 crianças, 5 habilidades, C por habilidade = 6,3,4,3,1 | Total 17/40 = 42,5%; por habilidade 75,0%, 37,5%, 50,0%, 37,5%, 12,5% |

## 9. Requisitos não funcionais e dados — PEN-09

| ID | Requisito definido para o MVP | Aceitação |
| --- | --- | --- |
| RNF-01 | Integridade histórica | Consolidação/correção preserva versão original e vínculo de origem |
| RNF-02 | Autenticação e autorização por papel/vínculo | Negar acesso direto não autorizado em leitura e escrita, não apenas ocultar botões |
| RNF-03 | Rastreabilidade | Registrar autor, instante e contexto de avaliações, revisões, vínculos e encerramentos; não incluir texto pedagógico em logs técnicos comuns |
| RNF-04 | Acessibilidade e clareza | Fluxos essenciais operáveis por teclado, foco visível, rótulos de campos e estados não dependentes de cor; verificar desktop e largura de 360 px |
| RNF-05 | Dados e recuperação | Usar apenas dados sintéticos na entrega; manter cópia de segurança e demonstrar restauração preservando vínculos e histórico |
| RNF-06 | Desempenho de referência | No ambiente de demonstração documentado, 95% das consultas de painel/ficha e salvamentos em até 2 s em amostra de 30 operações, com base de 500 alunos e 5 anos; excluir inicialização e registrar condições |
| RNF-07 | Persistência e falhas | Reabrir sessão mantém dados salvos; falha de gravação não exibe sucesso; conflito pede atualização |

O MVP usa nomes e trajetórias inteiramente fictícios, sem copiar registros reais de crianças. Coletar somente nome de exibição, identificador interno e dados escolares necessários; CPF, endereço, foto, saúde e laudos ficam fora do escopo. Orientar observações para acompanhamento pedagógico, evitando conteúdo pessoal desnecessário.

Na demonstração hospedada: conexão protegida, credenciais individuais e recuperação por mecanismo de autenticação confiável; não armazenar senha em texto simples. Backups diários durante período de demonstração, com retenção técnica de 30 dias e acesso restrito; uma restauração verificada antes da entrega. Esse prazo é escolha operacional para dados sintéticos, não prazo legal para registros escolares. Dados fictícios podem ser reinicializados em ambiente de demonstração identificado, sem confundir isso com exclusão de prontuários reais.

Para eventual uso real, a instituição deverá definir responsável pelo tratamento, finalidade, base legal adequada, transparência, acesso, retenção/exclusão e resposta a incidentes. Não assumir consentimento como solução universal. A ANPD orienta que prevaleça o melhor interesse da criança na avaliação concreta do tratamento ([Enunciado e explicação oficial](https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes)). Essa preparação externa não impede construir e demonstrar o MVP com dados sintéticos; não há declaração de conformidade jurídica nesta especificação.

## 10. PEN-12 — Escopo, sequência e conclusão acadêmica

**D:** aplicação web para uma escola fictícia, com uso prioritário em computador e adaptação para telas pequenas. Verificar no navegador utilizado pela instituição e em pelo menos um segundo navegador atual disponível, registrando versões no relatório de testes. Sem SLA de produção, aplicativo nativo, offline, integrações ou exportação de registros pessoais nesta etapa.

Prazo confirmado: 18/11/2026. Planejar base e fluxo principal em 14–15/11, lacunas/atenção/coordenação em 16/11 e conclusão funcional e estabilização em 17/11. Reservar 18/11 para conferência e entrega. Essa distribuição é uma meta, não garantia de capacidade nem relato de implementação; avaliar o progresso ao fim de cada dia.

| Prioridade | Requisitos e recorte | Verificação de saída |
| --- | --- | --- |
| P0 — núcleo | RF-01–RF-09, RF-10 com lista/acesso e indicadores essenciais, RF-11 com filtros e consulta individual; salvamento e revisões básicas de RF-13; base de contas/vínculos e catálogo preparada com dados sintéticos | Fluxo completo persistente, atenção correta, origem histórica preservada e acesso indevido negado |
| P1 — completar MVP | RF-12; fechamento/reabertura e tratamento completo de RF-13; indicadores restantes de RF-10; RF-14; concluir verificações não funcionais | Gestão funcional, indicadores conferidos e casos de referência executáveis |
| P2 — refinamento | Polimento visual secundário, conveniências e sessões adicionais com usuários, sem criar novos requisitos essenciais | Melhorias sem comprometer estabilidade ou entrega |

RNF-01, RNF-02, RNF-03 e RNF-07 orientam o desenvolvimento desde P0; não são complementos adiáveis. Estados compreensíveis e operação básica por teclado também acompanham cada tela. P1 continua obrigatório para declarar o MVP completo; uma entrega só com P0 deve ser identificada como parcial, com RF/CA não atendidos listados. Nenhum requisito é removido silenciosamente por causa do prazo.

**Critério de conclusão:** RF-01 a RF-14 implementados no escopo descrito, casos CR aprovados e critérios CA críticos verificados; nenhuma falha conhecida de acesso indevido, perda de registro ou cálculo de atenção. Demonstrar uma trajetória de dois anos, com ausência de avaliação, lacuna consolidada, atenção manual, coordenação navegando até aluno e turma pequena com agregado oculto. Testes de interface/permissões podem ocorrer fora da tela de referência, com resultados registrados; ela não substitui a verificação completa.

Entregáveis planejados: aplicação demonstrável, base sintética reinicializável, estes dois documentos atualizados e roteiro/relatório de verificação. Esta revisão entrega somente a documentação; não afirma implementar nem testar a aplicação.

Avaliação com professora/coordenação: observar três tarefas (registrar avaliação, localizar histórico/lacuna, interpretar atenção), anotar conclusão sem ajuda, dúvidas e sugestões. É avaliação de usabilidade e adequação do recorte, não medição de melhora na aprendizagem. Regras acadêmicas da banca, horário de entrega, equipe, escolha tecnológica e hospedagem permanecem dependentes do contexto; a data de entrega já está confirmada.

### 10.1. Especificação da atualização do protótipo

**Estado D:** definição de telas e interações para orientar a implementação. O protótipo antigo vinculado no início permanece como referência visual, sem comprovar aderência a estes requisitos. Não é necessário redesenhar a identidade visual para cumprir o prazo.

| ID | Tela/fluxo | Conteúdo e interação a representar | Requisitos |
| --- | --- | --- | --- |
| PRO-01 | Entrada e contexto | Acesso individual, perfil identificado, turma/ano/bimestre visíveis; erro de acesso e sessão encerrada | RF-01, RNF-02 |
| PRO-02 | Minha turma | Lista alfabética clicável; escrita, lacunas e atenção por aluno; indicadores contextualizados; turma vazia e cobertura incompleta | RF-10 |
| PRO-03 | Ficha e histórico | Identificação do aluno, linha do tempo, avaliações anteriores com autoria, quatro abas bimestrais, observações e todos os motivos de atenção | RF-01, RF-03–RF-06, RF-08 |
| PRO-04 | Avaliação e revisão | Habilidades de CAT-v1, três níveis e Sem avaliação, escrita e observação; Salvar, sucesso, erro, aviso de alteração não salva; período fechado; correção justificada e acesso à versão anterior | RF-02–RF-04, RF-13 |
| PRO-05 | Lacunas herdadas | Origem, última marcação e tipo de pendência; ação de consolidar/reavaliar com justificativa; histórico do evento e contagem atualizada | RF-06, RF-07 |
| PRO-06 | Atenção manual | Adicionar justificativa; lista de motivos ativos/encerrados; encerrar/reabrir com motivo; validação de texto vazio e autoria visível | RF-09 |
| PRO-07 | Coordenação: consulta | Filtrar ano/bimestre; clicar turma e depois aluno; retorno preserva filtros; avaliações somente leitura; grupo menor que 5 oculta agregados, sem bloquear consulta individual | RF-11 |
| PRO-08 | Coordenação: gestão | Formulários essenciais de alunos, turmas, professores, vínculos e matrículas; transferência/passagem/repetência; datas de vigência; fechamento/reabertura justificados | RF-12, RF-13 |
| PRO-09 | Regras e casos | Matriz, fórmulas, limite 2 e tratamento de ausência; execução sintética com estado executando, sucesso ou falha real | RF-14 |

Estados transversais: carregando, vazio, sem avaliação, erro recuperável, salvo, acesso negado e período fechado. Rótulos e mensagens devem distinguir ausência de informação de resultado pedagógico negativo. Botões de alteração pedagógica não aparecem no perfil da coordenação; a autorização também deve ser validada no sistema, não apenas na interface.

**Roteiro de aceitação do protótipo e da futura aplicação:**

1. Entrar como professora, abrir turma e aluno, selecionar bimestre, registrar uma habilidade, escrita e observação e salvar.
2. Reabrir a ficha e conferir os dados. Em protótipo apenas visual, identificar claramente a simulação; persistência real é critério da aplicação.
3. Consultar ano anterior, consolidar uma lacuna e verificar que a contagem atual mudou sem apagar o original.
4. Abrir atenção manual com justificativa, consultar os motivos e encerrá-la com motivo, mantendo histórico.
5. Mostrar um bimestre sem avaliação e o estado de comparação de escrita incompleta, sem exibir escrita adequada por falta de dado.
6. Entrar como coordenação, mudar ano/bimestre, abrir turma e aluno e verificar a ausência de edição pedagógica. Repetir com turma de quatro crianças: agregado oculto e ficha acessível.
7. Em P1, cadastrar/vincular os participantes de uma turma, fechar um período e observar o bloqueio de edição; reabrir com justificativa.
8. Executar casos de referência e registrar resultados; nunca apresentar sucesso fictício.

Para a demonstração de 18/11, preparar dados fictícios com dois anos letivos, uma turma de pelo menos cinco alunos, uma de quatro, um aluno com lacuna avaliada, outro com ausência herdada, escrita abaixo da expectativa e uma atenção manual. Manter o catálogo demonstrativo antigo separado de CAT-v1 para não misturar denominadores.

### 10.2. Controle de mudanças e limite da revisão

A sugestão anterior de excluir ausência de avaliação da contagem de lacunas foi uma recomendação da assistente, sem aprovação explícita de mudança da regra. Esta versão conserva RN07/RN08 e CR-07 como definidos na v1.1: ausência herdada conta como pendência operacional, sempre identificada separadamente. Se essa regra for alterada futuramente, atualizar juntos a contagem, o alerta, os exemplos e CR-07; não aplicar a mudança só no protótipo.

Esta entrega atualiza os dois documentos, as prioridades e a especificação do protótipo. Não publica uma nova versão do artefato no Claude, não implementa a aplicação e não certifica que os testes de software passaram.

## 11. Estado das pendências anteriores

| ID | Estado nesta versão | Resolução / limite restante |
| --- | --- | --- |
| PEN-01 | Resolvida C/D | Consulta de todas as turmas/anos, navegação individual e gestão; sem edição pedagógica pela coordenação |
| PEN-02 | Resolvida D para o MVP | Matriz completa na seção 3.2; validação pedagógica local para uso real |
| PEN-03 | Resolvida D para o MVP | CAT-v1 com 40 habilidades; recorte LP/MAT e versionamento; revisão curricular externa antes de uso real |
| PEN-04 | Resolvida C/D | Ausência visível, todos os anos conhecidos, última marcação, repetência, identidade e reavaliação |
| PEN-05 | Resolvida D | Atenção manual com autoria, justificativa, revisões, encerramento e reabertura por docente atual |
| PEN-06 | Resolvida D | Salvamento explícito, parcial permitido, fechamento/reabertura e preservação de revisões |
| PEN-07 | Resolvida D | Contas, matriz de permissões e vínculos temporais |
| PEN-08 | Resolvida C/D | Coordenação administra cadastros e transições; importação externa e fusão ficam fora do MVP |
| PEN-09 | Resolvida D no ambiente acadêmico | Dados sintéticos e recuperação; responsabilidades e retenção de dados reais são condição externa futura |
| PEN-10 | Resolvida D conforme imagens | Fórmulas, denominadores, cobertura, ausência, arredondamento, filtros e recálculo |
| PEN-11 | Resolvida D conforme imagens | Tela de regras com execução de casos sintéticos e resultados verdadeiros; consulta operacional da coordenação |
| PEN-12 | Prazo confirmado C; prioridades e roteiro D; contexto externo P | Entrega 18/11/2026, candidata em 17/11, P0–P2 e protótipo especificados; faltam horário, equipe, exigências da banca, tecnologia e hospedagem |

### 11.1. Refinamentos conciliados com a implementação (v1.3)

Decisões tomadas no desenho técnico (`openspec/changes/especificar-fio-da-aprendizagem/design.md`) e confirmadas na implementação, agora registradas aqui. Nenhum ID foi criado, removido ou renumerado; todos os RN/RF/CA/CR continuam valendo.

| Tema | Refinamento | Onde | Base |
| --- | --- | --- | --- |
| Reabertura e herança | Ano reaberto continua elegível para herança; passagem de ano e matrículas posteriores permanecem; correção antiga não supera evento de período posterior; datas de referência passadas não mudam | Seções 6 e 3.3; RN07; RF-13 (CA-13.3) | D05, D06; spec calendario-letivo "Reabertura após passagem de ano" |
| Fechamento × atenção manual | Fechar o período bloqueia escrita pedagógica dele, não as ações atuais de atenção manual | Seções 6 e 3.4; RF-09; RF-13 (CA-13.2) | D06, D07 |
| Autoria | Uma resposta vigente por campo; titular e substituta só coexistem por indicação explícita da coordenação; ninguém substitui resposta alheia; limpeza só pela autora, com justificativa | Seções 5 e 6; RN11; RF-11; RF-13 | D03, D04 |
| Observações | Entradas independentes por autora; limite de 4.000 caracteres compartilhado entre os textos vigentes do aluno/bimestre; revisões não consomem o limite | Seção 6; RN05; RF-04 (CA-04.3) | D02 |
| Grupo pequeno | Ocultação de agregados com N < 5 vale para professora e coordenação; consulta individual autorizada continua | Seção 5 (Consulta individual e grupos pequenos); RN13 | D10 |
| Gestão escolar | Duplicidade de aluno é sinalizada, nunca mesclada; cadastro com histórico é arquivado, conta é desativada e vínculo é encerrado (só o que nunca valeu pode ser cancelado ou excluído); passagem de ano e repetência só após o fechamento do ano; movimentações ficam em trilha com data, autoria e motivo | Seção 5; RF-12 (CA-12.1–12.4) | spec gestao-escolar |

## 12. Rastreabilidade e alterações

| Decisões | Requisitos principais | Objetivos |
| --- | --- | --- |
| DEC-03 a DEC-06, DEC-13, DEC-14 | RN01–RN05, RN10, RF-01–RF-04 | OBJ-01 |
| DEC-07, DEC-08, DEC-15, DEC-16 | RN06, RN07, RF-05–RF-07, RF-13, RNF-01 | OBJ-02, OBJ-03 |
| DEC-09, DEC-10, DEC-16 | RN08, RN09, RF-08, RF-09 | OBJ-04 |
| DEC-11, DEC-12, DEC-17, DEC-20 | RN11, RN13, RF-11, RF-12, RNF-02 | OBJ-05 |
| DEC-18, DEC-19 | RN12, RF-10, RF-14, RNF-04–RNF-07 | OBJ-01, OBJ-04, OBJ-05 |
| DEC-21–DEC-23 | Seções 10–10.2, PRO-01–PRO-09, prioridades P0–P2 | Planejamento da entrega e demonstração de OBJ-01–OBJ-05 |

| Versão | Data | Alteração |
| --- | --- | --- |
| 1.0 | 14/11/2026 | Consolidação inicial de conversa e três imagens |
| 1.1 | 14/11/2026 | Incorporação das duas novas telas e decisões; resolução delegada das PEN; catálogo, matriz, permissões, fórmulas, critérios e MVP |
| 1.2 | 14/11/2026 | Prazo 18/11, cronograma, prioridades por requisito, link do protótipo desatualizado e roteiro de telas/estados; regras pedagógicas preservadas |
| 1.3 | 16/11/2026 | Conciliação com o desenho técnico e a implementação (seção 11.1): reabertura e herança, fechamento × atenção manual, autoria e limpeza, observações por autora, grupo pequeno para os dois perfis e regras de gestão; IDs preservados |

Preservados os IDs de requisitos e pendências. Não se confunde escolha delegada com validação pedagógica externa, nem cálculo conferido documentalmente com teste de software executado.

