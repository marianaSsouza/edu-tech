# Fio da Aprendizagem — guia de execução

MVP acadêmico (escola fictícia, dados sintéticos). Uma aplicação web única: **NestJS + TypeORM + SQLite** no servidor e **React + Vite + Tailwind** no cliente. As decisões estão em `openspec/changes/especificar-fio-da-aprendizagem/design.md` (D13 a D17).

## Ferramentas e versões (tarefa 1.1)

| Ferramenta | Versão |
| --- | --- |
| Node.js | 20 ou maior (desenvolvido com 24) |
| NestJS | 11 |
| TypeORM | 0.3.x |
| SQLite (`better-sqlite3`) | 12 (binário pronto para Node 24) |
| React / Vite / Tailwind | 18 / 6 / 4 |

## Primeira execução

```bash
npm install        # na raiz do projeto (instala servidor e cliente)
npm run seed       # cria data/fio.sqlite com CAT-v1 e a base fictícia
npm run dev        # servidor em http://localhost:3000 e cliente em http://localhost:5173
```

Abra **http://localhost:5173** e entre com uma das contas de demonstração abaixo. Fluxo: Turmas → Alunos da turma → Avaliação (por bimestre) → Salvar.

## Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm test` | roda os testes do servidor (catálogo, regras puras, base fictícia, persistência, acesso e avaliação) |
| `npm run seed:reset` | apaga os dados e recria a base fictícia do zero |
| `npm run build` e `npm start` | compila tudo e serve cliente e API juntos em http://localhost:3000 |

## Contas de demonstração (senha: `demo1234`)

| Perfil | E-mail |
| --- | --- |
| Coordenação | coordenacao@escola.exemplo |
| Professora titular do 2º A | beatriz@escola.exemplo |
| Professora substituta do 2º A | debora@escola.exemplo |
| Professor titular do 2º B | carlos@escola.exemplo |
| Professora do 1º A de 2025 | ana.paula@escola.exemplo |

## Base fictícia

Dois anos letivos (2025, 1º ano; 2026, 2º ano), 12 alunos, turma 2º A com 8 e 2º B com 4 alunos (abaixo do grupo mínimo de 5), titular e substituta no 2º A, habilidades avaliadas e nunca avaliadas, uma consolidação posterior e uma atenção manual.

## Problemas comuns

- **`npm install` falha em `better-sqlite3`:** confira `node -v` (precisa ser 20 ou maior) e rode `npm install` de novo. Se pedir compilador, o binário pronto não foi encontrado; me envie a mensagem de erro.
- **Porta ocupada:** use `PORT=3001 npm start` (ou ajuste a porta no `vite.config.ts`).
- **Banco em outro lugar:** defina `DB_PATH` com o caminho do arquivo.

## Permissões e salvamento (Slice 2, tarefas 2.1–2.2 e 3.1–3.3/3.5)

- **Login** por sessão (cookie `fio_sessao`, 8 h, guardado em memória: reiniciar o servidor desloga todo mundo). Conta desativada não entra.
- **Quem lê:** coordenação lê todos os alunos e turmas. Professora lê só alunos da turma com vínculo vigente hoje (inclusive o histórico de anos anteriores desses alunos). Ex-aluno sem vínculo: negado.
- **Quem escreve:** só professora com vínculo atual, em bimestre já iniciado e não fechado. Coordenação só consulta.
- **Autoria:** titular e substituta preenchem habilidades ainda sem resposta; a resposta de outra professora não pode ser trocada (use uma observação própria). Corrigir a própria resposta exige justificativa e guarda a versão anterior.
- **Conflito:** se outra pessoa salvou antes, o servidor responde 409; a tela recarrega e mantém só o que não foi salvo.
- **Observações:** uma por autora; limite somado de 4.000 caracteres por aluno/bimestre.

Exemplos com a base fictícia (data atual em 2026): Beatriz e Débora editam o 4º bimestre do 2º A; Carlos não abre alunos do 2º A; Ana Paula não abre mais a turma de 2025; o 1º e o 2º bimestres de 2026 estão fechados.

## Ficha, atenção e painel (grupos 4 a 6)

- **Painel** (tela inicial): turmas do ano com filtros de ano e bimestre. A população é a matrícula na data de referência (último dia do bimestre já encerrado, ou hoje). Turma com menos de 5 crianças mostra "Agregado oculto", para professora e coordenação; a lista de alunos e a ficha continuam acessíveis.
- **Turma**: indicadores do bimestre (consolidação, coberturas, escrita alfabética, em atenção, atenção não concluída), barras com ausência separada, lacunas por habilidade e lista alfabética de alunos.
- **Ficha do aluno**: atenção pedagógica com todos os motivos, atenção manual (abrir, comentar, encerrar, reabrir), lacunas herdadas com decomposição e linha do tempo com resumo anual e correções.
- **Fora do P0 por enquanto**: consolidar/reavaliar lacuna pela tela, corrigir texto original de atenção manual, evolução da escrita entre bimestres e gestão escolar (grupos 7 a 10).

### Exemplos de permissão, correção e estados (tarefas 2.3, 4.4 e 5.3)

- **Transferência:** se um aluno do 2º A passa para o 2º B no mesmo ano, o registro bimestral continua no mesmo contexto (nada é copiado). O professor do 2º B passa a ler e a preencher o que estiver ausente; as respostas já salvas continuam com a autora original, que só pode corrigi-las se tiver vínculo atual com o aluno.
- **Correção x avanço:** corrigir uma avaliação antiga troca a versão vigente daquele mesmo período e guarda a anterior (aparece "✎ corrigida" na ficha). Um avanço (consolidação feita depois) é um evento novo, num período posterior: não reescreve o ano anterior e prevalece sobre ele na herança, mesmo que a correção antiga seja feita hoje.
- **Estados de atenção:** "Em atenção" (com todos os motivos), "Sem sinal de atenção nos dados disponíveis" e "Atenção automática não concluída: escrita sem avaliação". "Histórico anterior indisponível" é um aviso separado e não muda o estado de atenção.
