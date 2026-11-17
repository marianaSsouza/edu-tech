# Verificação de acessibilidade (RNF-04, tarefas 3.6 e 9.4)

RNF-04: fluxos essenciais operáveis por **teclado**, **foco visível**, **rótulos** nos campos e **estados que não dependem só de cor**, em computador e em **360 px** de largura.

## Parte 1 — Pré-checagem automática (17/11/2026)

- **Navegador:** Chromium 156.0.8078.75 (navegador embutido do ambiente de desenvolvimento), Windows 10.
- **Base:** demonstração recém-criada (`npm run seed`), contas da professora Beatriz e da coordenação.

| Verificação | Como | Resultado |
|---|---|---|
| Ordem do Tab no login | Tab a partir do topo | E-mail → Senha → Mostrar → Esqueci minha senha → Entrar → Contas de demonstração ✅ |
| Entrar só com teclado | Digitar e-mail, Tab, senha, Enter | Entrou ✅ |
| Ordem do Tab nas telas internas | Tab a partir do topo | Atalho "Pular para o conteúdo" → logo → menu → Sair → conteúdo ✅ |
| Foco visível | Estilo do elemento focado | Contorno de 3 px em todos os itens ✅ (no menu lateral azul o contorno é branco) |
| Rótulos | Busca de campos, botões e links sem nome acessível em 8 telas (Gestão, Painel, Calendário, Alunos, Regras, Turma, Ficha, Avaliação) | Nenhum sem nome ✅ |
| 360 px sem rolagem lateral da página | Largura do documento em 10 telas (Turmas, Painel, Painel escola, Alunos, Turma, Ficha, Avaliação, Calendário, Gestão, Regras) | Todas com 360 px ✅ (tabelas largas rolam dentro do próprio cartão) |
| Estados sem depender de cor | Revisão das telas | Selos com texto ("Em atenção", "Sem avaliação", "Fechado"), símbolos ✔/✘/⚑ e barras com texto alternativo e legenda com números ✅ |

**Problemas encontrados e corrigidos nesta verificação**

1. **Ficha e Calendário passavam de 360 px** (566 px e 606 px): textos para leitor de tela dentro das tabelas "escapavam" da área de rolagem, e o calendário empurrava a coluna da grade. Corrigido em `index.css` (áreas roláveis com `position: relative`) e em `Calendario.tsx` (`min-w-0`).
2. **Foco pouco visível no menu lateral** (contorno azul em fundo azul): agora é branco.
3. **Faltava atalho para pular o menu**: adicionado o link "Pular para o conteúdo", que aparece no primeiro Tab.

## Parte 2 — Verificação manual em dois navegadores (preencher)

Use dois navegadores instalados (por exemplo **Chrome** e **Edge**, ou **Firefox**). Para 360 px: abra as Ferramentas do desenvolvedor (F12), clique no ícone de celular e digite 360 na largura.

**Navegador A:** __________ versão: __________ **Navegador B:** __________ versão: __________
(A versão aparece em: menu ⋮ → Ajuda → Sobre.)

Em cada linha, use **só o teclado** (Tab, Shift+Tab, Enter, Espaço, setas). Marque ✅, ⚠️ (funciona com dificuldade) ou ❌, e anote o que viu.

| # | Fluxo | Conta | A · computador | A · 360 px | B · computador | B · 360 px | Observações |
|---|---|---|---|---|---|---|---|
| 1 | Entrar (e-mail, senha, Entrar) | beatriz@ | | | | | |
| 2 | Turmas → Abrir turma → abrir um aluno (Ficha) | beatriz@ | | | | | |
| 3 | Avaliação: escolher um nível com as setas, Salvar e ver "Tudo salvo" | beatriz@ | | | | | |
| 4 | Tentar sair da avaliação sem salvar e ver o aviso | beatriz@ | | | | | |
| 5 | Painel: trocar Turma e Período e ler os números | beatriz@ | | | | | |
| 6 | Gestão → Alunos: cadastrar "Bernado" e ver o aviso de duplicidade | coordenacao@ | | | | | |
| 7 | Calendário: abrir "Fechar o 4º bimestre" e Cancelar | coordenacao@ | | | | | |
| 8 | "Pular para o conteúdo" no primeiro Tab | qualquer | | | | | |

Em cada linha, confira também: **o foco aparece** (contorno) o tempo todo? Os **campos dizem o que são**? As **mensagens** (erro, sucesso, período fechado) aparecem em texto, não só em cor?

**Limitações conhecidas** (não são falhas do teste):
- Não houve teste com leitor de tela (NVDA ou similar), apenas a verificação de nomes acessíveis acima.
- Em 360 px, as tabelas largas (lacunas, avaliações por bimestre e mês do calendário) rolam para o lado **dentro do cartão**, o que é esperado.

Depois de preencher, salve este arquivo; ele é a evidência da tarefa 9.4 citada no relatório de verificação.
