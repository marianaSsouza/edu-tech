# Roteiro de demonstração (7 minutos)

Escola fictícia, dados sintéticos. Cada passo indica a spec e o cenário que ele demonstra, para o avaliador conferir no [relatório de verificação](relatorio-de-verificacao.md).

## Antes de começar (5 minutos antes)

Na pasta do projeto, um comando por vez:

```bash
npm run seed:reset
```

```bash
npm test
```

```bash
npm run dev
```

- O `npm test` deve terminar com `Tests: 168 passed`. Deixe esse terminal visível: ele é a prova automática.
- Abra http://localhost:5173 numa janela e deixe a tela de login pronta.
- Senha de todas as contas: `demo1234`.
- A base foi pensada para novembro de 2026: o 3º bimestre tem dados completos e o 4º (em andamento) está vazio.

## 1. Coordenação: painel e grupo pequeno (≈ 1 min 30)

Entre como `coordenacao@escola.exemplo`.

1. No menu lateral, abra **Painel**. Em **Turma**, escolha **Escola inteira** e clique em **3º bim.**
   - *Fala:* "A população é a matrícula no último dia do bimestre. O 2º A tem 8 crianças e mostra os indicadores; o 2º B tem 4, então o agregado fica oculto, para a coordenação e para o professor."
   - Spec **paineis-e-indicadores**: "População do período" e "Limite de apresentação" (CR-18).
2. Em **Turma**, escolha **2º A** e, em **Período**, o **3º bimestre**: aparecem os números da turma, as habilidades com menos consolidação, os alunos para acompanhar, a consolidação por bimestre e os níveis de escrita. Depois vá em **Turmas → 2º A → Abrir turma** e mostre consolidação 48,4% (31/64), cobertura 100,0%, escrita alfabética 75,0% (6/8) e em atenção 50,0% (4/8).
   - *Fala:* "Toda porcentagem vem com a fração. A ausência entra no denominador e aparece hachurada na barra; não vira 'não consolidada'."
   - Spec **paineis-e-indicadores**: "Consolidação e cobertura" e "Frações e arredondamento".
3. Na página da turma, troque para o **4º bimestre**: aparece o aviso "Sem avaliações registradas" e 0,0%.
   - *Fala:* "Aqui o 0,0% é falta de registro, não desempenho."
   - Cenário "Turma sem avaliações" (CR-13).
4. Volte ao 3º bimestre e abra o **2º B**: aparece "Agregado oculto", mas os 4 alunos continuam na lista e podem ser abertos.

## 2. Ficha do aluno: lacunas, histórico e atenção (≈ 2 min)

Ainda como coordenação, abra o **2º A** e clique em **Bernardo**.

1. **Atenção pedagógica:** "Em atenção" por lacunas, com a escrita do 4º bimestre ainda sem avaliação.
   - Spec **atencao-pedagogica**: "Lacunas com escrita ausente".
2. **Lacunas herdadas:** "6 pendências: 1 não consolidada + 3 em desenvolvimento + 2 sem avaliação registrada".
   - *Fala:* "Habilidade nunca avaliada conta como pendência, mas aparece separada; não recebe nível negativo."
   - Spec **lacunas-herdadas**: CR-07.
3. Mostre a consolidação de H01-LP02 feita em 2026, com origem, autora, data e evidência.
4. Desça até a **linha do tempo de 2025**: o resumo anual do H01-LP02 continua "◐ Em desenvolvimento".
   - *Fala:* "O avanço de 2026 não reescreve 2025."
   - Spec **historico-pedagogico**: "Consolidação posterior" (CA-07.1).
5. Clique em **← Voltar à turma**: volta ao 3º bimestre com o filtro preservado.

## 3. Professora: avaliar e salvar (≈ 2 min)

Clique em **Sair** e entre como `beatriz@escola.exemplo` (titular do 2º A).

1. Abra 2º A → **Ana Clara** → **Avaliação →**. O 4º bimestre está aberto e vazio.
2. Marque **H02-LP01 = Consolidada** e **Escrita = Alfabético**. Mostre a completude ("1 de 8").
3. Clique em **Salvar**: aparece "✔ Tudo salvo".
   - Spec **avaliacao-bimestral**: "Salvar somente uma habilidade".
4. Troque H02-LP01 para **Em desenvolvimento**. Aparece o campo de justificativa; salve sem preencher e mostre o aviso. Preencha e salve.
   - *Fala:* "A correção guarda a versão anterior; na ficha aparece ✎ com o valor original."
5. Clique em **2º bimestre**: "🔒 Este bimestre está fechado. Somente consulta".
   - Spec **calendario-letivo**: "Tentativa de editar avaliação fechada".
6. Abra a ficha da Ana Clara (link no topo): a atenção agora diz "Sem sinal de atenção nos dados disponíveis", porque a escrita foi registrada.
   - CA-08.6: atualiza depois de salvar.

## 4. Substituta: autoria e atenção manual (≈ 1 min 30)

Clique em **Sair** e entre como `debora@escola.exemplo` (substituta do 2º A).

1. Abra a avaliação da **Ana Clara** no 4º bimestre: H02-LP01 está bloqueada com "Registrado por Profª Beatriz".
   - *Fala:* "A substituta preenche o que está vazio e pode escrever a própria observação, mas não troca a resposta da titular."
   - Spec **acesso-e-permissoes**: "Titular e substituta simultâneas".
2. Abra a ficha do **Davi** → atenção manual → **Encerrar**, escreva o motivo e salve.
   - *Fala:* "A atenção fica encerrada, a autora original continua sendo a Beatriz e o encerramento fica registrado em nome da Débora. O motivo automático de lacunas continua."
   - Spec **atencao-pedagogica**: "Sucessora encerra atenção".

## Extra, se houver tempo (≈ 1 min 30)

1. Como **Beatriz**, na ficha do **Bernardo**, clique em **Consolidar** em H01-LP03 e escreva a evidência. A contagem cai de 6 para 5 e o evento aparece com origem 2025.
   - Spec **lacunas-herdadas**: "Consolidação e reavaliação com origem" (CR-06).
2. Na página da turma **2º A** (Turmas → Abrir turma), 3º bimestre, mostre **Evolução da escrita**: "3 de 8 avaliáveis avançaram (37,5%)" em relação ao 1º bimestre.
   - Spec **paineis-e-indicadores**: "Evolução entre bimestres" (CR-11).
3. Como **coordenação**, abra **Calendário** e clique em **Fechar** no 4º bimestre. Antes de confirmar aparecem as ausências por turma; não é preciso confirmar.
   - Spec **calendario-letivo**: "Fechar bimestre incompleto" (CA-13.2).

## Gestão da escola (≈ 1 min 30)

Como **coordenação**, abra **Gestão** no menu.

1. Em **Alunos**, cadastre "Bernado" no 2º A: o sistema mostra "Possível duplicidade" com o Bernardo existente e só cadastra se você confirmar que é outra criança. Não pede CPF.
   - Spec **gestao-escolar**: "Possível duplicidade".
2. Em **Turmas e vínculos**, tente vincular outra professora como **Titular** no 2º A: é recusado. Como **Substituta**, é aceito, e as duas convivem.
   - Spec **gestao-escolar**: "Substituição autorizada".
3. Em **Alunos**, clique em **Movimentar** no Bernardo e troque para o **2º B**: a matrícula antiga termina ontem e a nova começa hoje, no mesmo registro do bimestre (nada é copiado). A movimentação aparece em "Movimentações". Abra a ficha do Bernardo: as duas turmas aparecem em 2026.
   - Spec **gestao-escolar**: "Transferência durante o bimestre".
   - *Fala:* "Passagem de ano e repetência só são aceitas depois que o ano é fechado no Calendário."
4. Em **Contas**, crie uma conta: aparece uma senha temporária uma única vez. "Nova senha" resolve o "Esqueci minha senha".
5. *Fala:* "Nada com histórico é apagado: aluno é arquivado, conta é desativada, vínculo é encerrado. A professora não vê esta tela (CA-12.4)."

## Regras e casos (≈ 30 s)

Entre como **coordenação** e abra **Regras** no menu (a professora não vê essa tela). Na aba **Conferir os cálculos**, o sistema confere na hora os 24 exemplos dos requisitos, agrupados por assunto: deve aparecer "Todos os cálculos estão certos" (23 conferidos na tela e 1 sobre permissões, testado no servidor). Marque **Simular um erro**: o primeiro exemplo fica laranja, com a "Resposta certa" e o que "O sistema calculou" lado a lado. A aba **Como o sistema decide** explica as regras em linguagem simples.

## 5. Acesso negado (≈ 30 s, opcional)

Entre como `carlos@escola.exemplo` (2º B): só aparece a turma dele. Para provar o acesso negado por endereço direto, mostre no terminal o teste "Carlos não lê aluno do 2º A; Ana Paula não lê Ana Clara (403, CR-21)".

## Fechamento (fala sugerida)

"O P0 está completo e verificado: 84 dos 93 cenários das specs estão feitos com evidência, 7 estão parciais e 1 não foi feito. Isso está detalhado no relatório de verificação. Do P1, fizemos a gestão da escola (cadastros, contas, vínculos, transferências, passagem de ano e repetência), o calendário (fechar e reabrir bimestres), a evolução da escrita, a limpeza justificada de resposta, a tela de regras e casos, a cópia de segurança com restauração conferida e a medição de desempenho (30 de 30 operações em até 2 segundos com 500 alunos e 5 anos); ficaram para depois parte das verificações finais (acessibilidade em dois navegadores e o relatório final), então a entrega está declarada como parcial."
