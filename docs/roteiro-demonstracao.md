# Roteiro de demonstração — Fio da Aprendizagem

**Tempo:** cerca de 10 minutos no roteiro principal, mais 3 minutos de extras opcionais.
**Dados:** escola fictícia, somente dados sintéticos.
**Ordem:** primeiro a professora (o dia a dia), depois a substituta (autoria) e por fim a coordenação (visão da escola, gestão e regras). Assim só é preciso trocar de conta duas vezes.

Cada passo indica a spec e o cenário demonstrado, para o avaliador conferir no [relatório de verificação](relatorio-de-verificacao.md). Os textos entre aspas são os que aparecem na tela (conferidos em 18/11/2026).

---

## Antes de começar (30 minutos antes)

Na pasta `fio-da-aprendizagem`, um comando por vez (no Windows, use `npm.cmd` no lugar de `npm`):

```bash
npm.cmd run seed:reset
```

```bash
npm.cmd test
```

```bash
npm.cmd run dev
```

- O `npm.cmd test` deve terminar com **`Tests: 168 passed`**. Deixe esse terminal aberto: ele é a prova automática.
- Abra **http://localhost:5173** e deixe a tela de login pronta.
- O `seed:reset` recria a escola do zero: use-o também se o ensaio deixar os dados diferentes.
- A base foi feita para novembro de 2026: o **3º bimestre** tem todos os registros e o **4º** (em andamento) está vazio.

**Contas** (senha de todas: `demo1234`)

| Conta | Quem é |
|---|---|
| `beatriz@escola.exemplo` | Professora titular do 2º A |
| `debora@escola.exemplo` | Professora substituta do 2º A |
| `coordenacao@escola.exemplo` | Coordenação |
| `carlos@escola.exemplo` | Professor do 2º B (só para o extra de acesso negado) |

**Plano B:** se o `npm.cmd run dev` falhar, rode `npm.cmd run build` e depois `npm.cmd start`, e abra **http://localhost:3000**.

---

## 1. Professora: turma, painel e avaliação (≈ 4 min)

Entre como **beatriz@escola.exemplo**.

1. **Turmas:** aparece só o **2º A**, a turma dela, com "Você é titular".
   - *Fala:* "Cada professora vê só as turmas em que tem vínculo hoje."
   - Spec **acesso-e-permissoes**: "Consulta contextual autorizada".
2. Menu **Painel**, em Período escolha **3º bimestre**. Mostre os quatro números (8 alunos, "64 / 64" avaliações, 4 em atenção, 0 sem avaliação), as **habilidades com menos consolidação** (cada uma com a etiqueta Português ou Matemática), **Para acompanhar** e **Consolidação por bimestre**.
   - *Fala:* "O bimestre sem nenhum registro aparece como 'Sem registros', não como 0%: falta de registro não é desempenho."
   - Spec **paineis-e-indicadores**: "Consolidação e cobertura" e "Turma sem avaliações".
3. Menu **Turmas → Abrir turma → Abrir** na **Ana Clara** (avaliação do 4º bimestre, aberto e vazio).
4. Marque **Consolidada** na primeira habilidade ("Lê frases e pequenos textos com compreensão") e **Alfabético** em Escrita. O contador mostra "1 de 8 avaliadas". Clique em **Salvar**: "✔ Tudo salvo. Os registros foram gravados."
   - Spec **avaliacao-bimestral**: "Salvar somente uma habilidade".
5. Troque a mesma habilidade para **Em desenvolvimento** e clique em **Salvar** sem justificar: "⚠ Para corrigir ou limpar uma resposta já salva, preencha a justificativa." Preencha a justificativa e salve de novo.
   - *Fala:* "Toda correção guarda a versão anterior, com autora e motivo."
   - Spec **avaliacao-bimestral**: "Correção identificada".
6. Clique em **2º · Fechado**: "🔒 Este bimestre está fechado. Somente consulta."
   - Spec **calendario-letivo**: "Tentativa de editar avaliação fechada".
7. Clique em **Ficha e histórico**. A atenção mostra "✓ Nada a acompanhar agora", porque a escrita foi registrada. No **Histórico** de 2026, a habilidade corrigida aparece com **✎**, e "Correções (1)" mostra o valor antigo.
   - Spec **atencao-pedagogica**: atualização após salvar (CA-08.6); **historico-pedagogico**: "Correção identificada".

## 2. Substituta: autoria (≈ 1 min 30)

Clique em **Sair** e entre como **debora@escola.exemplo**.

1. Abra a avaliação do 4º bimestre da **Ana Clara**: a habilidade salva pela Beatriz mostra "Registrado por Profª Beatriz · só ela pode corrigir. Você pode acrescentar uma observação."
   - *Fala:* "Titular e substituta trabalham juntas: cada uma preenche o que está vazio, mas ninguém troca a resposta da outra."
   - Spec **acesso-e-permissoes**: "Titular e substituta simultâneas".
2. Abra a ficha do **Davi** → **Atenções manuais**. A Débora pode **Comentar** e **Encerrar**, mas não vê "Corrigir texto": só a autora (Beatriz) corrige o texto original.
   - Spec **atencao-pedagogica**: "Sucessora encerra atenção" e "Abertura e autoria de atenção manual".

## 3. Coordenação: escola, aluno, calendário, gestão e regras (≈ 4 min 30)

Clique em **Sair** e entre como **coordenacao@escola.exemplo**.

1. **Painel →** em Turma escolha **Escola inteira** e clique em **3º bim.**: o 2º A mostra "⚑ Em atenção: 4 de 8", "Escrita alfabética: 75,0% (6/8)" e "Consolidação: 48,4%"; o 2º B mostra "🔒 Números ocultos: menos de 5 alunos".
   - *Fala:* "Turma com menos de 5 crianças não mostra números, para não expor ninguém. A ficha de cada aluno continua aberta."
   - Spec **paineis-e-indicadores**: "Limite de apresentação" (CR-18).
2. **Turmas → 2º A → Abrir turma** e clique no nome do **Bernardo** (ficha):
   - **Atenção:** "⚑ Em atenção" com "6 lacunas pendentes".
   - **Lacunas dos anos anteriores:** "6 pendentes", com as etiquetas "○ 1 não consolidada", "◐ 3 em desenvolvimento" e "— 2 sem avaliação".
   - *Fala:* "Habilidade nunca avaliada conta como pendência, mas aparece separada e não recebe nota."
   - Spec **lacunas-herdadas**: CR-07.
   - Em **Já consolidadas**, a habilidade "Escreve palavras estabelecendo relações entre letras e sons" foi consolidada em 2026 ("Ver evidência"). No **Histórico de 2025**, ela continua **◐** na coluna Final.
   - *Fala:* "O avanço de 2026 não reescreve 2025."
   - Spec **historico-pedagogico**: "Consolidação posterior" (CA-07.1).
3. **Calendário:** clique em **Fechar o 4º bimestre**. Antes de confirmar aparecem as ausências por turma. **Cancele** (não é preciso fechar).
   - *Fala:* "A professora também vê o calendário, mas só para consulta, sem os botões."
   - Spec **calendario-letivo**: "Fechar bimestre incompleto" (CA-13.2).
4. **Gestão → Alunos:** digite "Bernado" no 2º A e clique em **Cadastrar aluno**. Aparece "⚠ Possível duplicidade" com o Bernardo existente. Clique em **Cancelar**.
   - *Fala:* "O sistema avisa e nunca junta históricos sozinho. Não pedimos CPF nem dados sensíveis."
   - Spec **gestao-escolar**: "Possível duplicidade".
5. **Gestão → Turmas e vínculos:** mostre o 2º A com a Beatriz (Titular) e a Débora (Substituta), as duas "Vigente".
   - *Fala:* "Só uma titular por vez; a substituta convive com ela quando a coordenação indica. Nada com histórico é apagado: aluno é arquivado, conta é desativada, vínculo é encerrado."
   - Spec **gestao-escolar**: "Substituição autorizada".
6. **Regras → Conferir os cálculos:** "Todos os cálculos estão certos" (23 exemplos conferidos na hora e 1 sobre permissões, testado no servidor). Marque **Simular um erro**: o primeiro exemplo fica laranja, com "Resposta certa" e "O sistema calculou" lado a lado.
   - *Fala:* "Os cálculos do sistema são conferidos ao vivo contra os casos de referência dos requisitos; se algo estivesse errado, a tela mostraria."
   - Spec **regras-e-casos-de-referencia**: CA-14.1 a 14.4.

## Extras, se houver tempo (≈ 3 min)

Os extras 2 e 3 alteram os dados. Depois da apresentação, rode `npm.cmd run seed:reset` se quiser voltar ao início.

1. **Acesso negado:** entre como **carlos@escola.exemplo**: só aparece o 2º B. No terminal, mostre que os testes de acesso passaram (CR-21: professora sem vínculo recebe 403, mesmo digitando o endereço).
2. **Transferência:** como coordenação, **Gestão → Alunos → Movimentar** no Bernardo, escolha **Trocar de turma** para o **2º B** e confirme. A movimentação aparece na lista e, na ficha, o Histórico de 2026 mostra "Turma 2º A → 2º B".
   - Spec **gestao-escolar**: "Transferência durante o bimestre".
   - *Fala:* "Passagem de ano e repetência só são aceitas depois que o ano é fechado no Calendário."
3. **Evolução da escrita:** em **Turmas → 2º A → Abrir turma**, 3º bimestre, desça até "Evolução da escrita": "3 de 8 avaliáveis avançaram (37,5%)".
   - Spec **paineis-e-indicadores**: "Evolução entre bimestres" (CR-11).

## Fechamento (fala sugerida)

"O Fio da Aprendizagem cobre o registro por bimestre, a ficha com histórico e lacunas, a atenção pedagógica, os painéis, o calendário, a gestão da escola e a tela de regras. São 168 testes automáticos passando e 90 dos 93 cenários das specs verificados com evidência; nenhum ficou sem fazer. Também medimos o desempenho (30 de 30 operações em até 2 segundos com 500 alunos e 5 anos), ensaiamos cópia de segurança e restauração, e fizemos a verificação de acessibilidade por teclado e no celular. Ficam como limitações registradas no relatório: um teste automático de interface, a publicação de um catálogo novo e o teste com leitor de tela. Por isso a entrega está classificada como parcial, de forma transparente."
