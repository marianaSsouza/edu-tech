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

Abra **http://localhost:5173**. A página deve mostrar o servidor "ok", 40 habilidades e a base de demonstração carregada.

## Outros comandos

| Comando | O que faz |
| --- | --- |
| `npm test` | roda os testes do servidor (catálogo, cálculo de percentual, base fictícia, persistência) |
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
