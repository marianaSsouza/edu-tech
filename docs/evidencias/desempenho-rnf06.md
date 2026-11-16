# Medição de desempenho (RNF-06, tarefa 9.3)

Gerado automaticamente por `npm run desempenho` em 16/11/2026, 13:21:23.

## Resultado

**✅ Meta cumprida: 30 de 30 operações terminaram em até 2 segundos** (meta: pelo menos 29).

| | Tempo |
|---|---|
| Mediana | 11 ms |
| 95% das operações até | 787 ms |
| Mais lenta | 845 ms |
| Painel (média / máximo) | 196 ms / 845 ms |
| Ficha (média / máximo) | 12 ms / 19 ms |
| Salvamento (média / máximo) | 5 ms / 7 ms |

## Ambiente

| Item | Valor |
|---|---|
| Sistema | Windows_NT 10.0.19045 |
| Processador | AMD FX(tm)-6300 Six-Core Processor (6 núcleos lógicos) |
| Memória | 8.0 GB |
| Node.js | v24.22.2 |
| Banco | SQLite (better-sqlite3), arquivo local, modo WAL |
| Execução | Servidor e cliente de medição na mesma máquina, via HTTP (localhost), sem cache; uma operação por vez |

## Base de referência (sintética)

| Item | Quantidade |
|---|---|
| Alunos | 500 |
| Anos letivos | 5 (2022 a 2026; 2022–2025 encerrados) |
| Turmas | 60 |
| Contextos pedagógicos (aluno × ano) | 1500 |
| Respostas de habilidade | 41.818 |
| Respostas de escrita | 5.288 |
| Observações | 823 |

Criação da base: 5.6 s (fora da medição). Nomes gerados ("Aluno 0001"…), níveis por fórmula com semente fixa: a base sai igual a cada execução.

## Condições

- A inicialização (criação da base, subida do NestJS e login) **não** entra na medição, conforme RNF-06.
- O tempo vai do envio da requisição até a resposta completa chegar.
- Painel e ficha consultados pela coordenação (vê toda a escola: é o caso mais pesado). Salvamentos feitos pela professora titular do 2º A no 4º bimestre de 2026, que está aberto.
- As fichas incluem alunos do 5º ano, com cinco anos de histórico e lacunas herdadas de quatro anos encerrados.

## As 30 operações

| # | Tipo | Operação | HTTP | Resposta | Tempo | Até 2 s? |
|---|---|---|---|---|---|---|
| 1 | Painel | Painel da escola (20 turmas de 2026) | 200 | 59.1 KB | 845 ms | sim |
| 2 | Ficha | Ficha de Aluno 0005 (1º ano, 1 ano de histórico) | 200 | 3.9 KB | 19 ms | sim |
| 3 | Salvamento | Habilidade H02-LP01, 4º bim., contexto 102 | 200 | 0.1 KB | 7 ms | sim |
| 4 | Painel | Painel da escola (20 turmas de 2026), 2º bimestre | 200 | 59.6 KB | 787 ms | sim |
| 5 | Ficha | Ficha de Aluno 0140 (2º ano, 2 anos de histórico) | 200 | 9.4 KB | 11 ms | sim |
| 6 | Salvamento | Escrita, 4º bim., contexto 104 | 200 | 0.1 KB | 5 ms | sim |
| 7 | Painel | Painel da turma 2º C (com evolução da escrita) | 200 | 8.7 KB | 32 ms | sim |
| 8 | Ficha | Ficha de Aluno 0260 (3º ano, 3 anos de histórico) | 200 | 15.4 KB | 11 ms | sim |
| 9 | Salvamento | Habilidade H02-LP01, 4º bim., contexto 106 | 200 | 0.1 KB | 4 ms | sim |
| 10 | Painel | Painel da turma 3º B (com evolução da escrita) | 200 | 9.5 KB | 42 ms | sim |
| 11 | Ficha | Ficha de Aluno 0380 (4º ano, 4 anos de histórico) | 200 | 22.3 KB | 12 ms | sim |
| 12 | Salvamento | Escrita, 4º bim., contexto 108 | 200 | 0.1 KB | 5 ms | sim |
| 13 | Painel | Painel da turma 4º A (com evolução da escrita) | 200 | 10.3 KB | 63 ms | sim |
| 14 | Ficha | Ficha de Aluno 0401 (5º ano, 5 anos de histórico) | 200 | 28.0 KB | 13 ms | sim |
| 15 | Salvamento | Habilidade H02-LP01, 4º bim., contexto 110 | 200 | 0.1 KB | 5 ms | sim |
| 16 | Painel | Painel da turma 4º D (com evolução da escrita) | 200 | 10.3 KB | 55 ms | sim |
| 17 | Ficha | Ficha de Aluno 0420 (5º ano, 5 anos de histórico) | 200 | 27.6 KB | 12 ms | sim |
| 18 | Salvamento | Escrita, 4º bim., contexto 112 | 200 | 0.1 KB | 4 ms | sim |
| 19 | Painel | Painel da turma 5º C (com evolução da escrita) | 200 | 11.1 KB | 63 ms | sim |
| 20 | Ficha | Ficha de Aluno 0440 (5º ano, 5 anos de histórico) | 200 | 27.8 KB | 10 ms | sim |
| 21 | Salvamento | Habilidade H02-LP01, 4º bim., contexto 114 | 200 | 0.1 KB | 4 ms | sim |
| 22 | Painel | Painel da turma 1º B (com evolução da escrita) | 200 | 7.7 KB | 17 ms | sim |
| 23 | Ficha | Ficha de Aluno 0460 (5º ano, 5 anos de histórico) | 200 | 27.8 KB | 10 ms | sim |
| 24 | Salvamento | Escrita, 4º bim., contexto 116 | 200 | 0.1 KB | 4 ms | sim |
| 25 | Painel | Painel da turma 2º A (com evolução da escrita) | 200 | 8.7 KB | 26 ms | sim |
| 26 | Ficha | Ficha de Aluno 0480 (5º ano, 5 anos de histórico) | 200 | 27.5 KB | 11 ms | sim |
| 27 | Salvamento | Habilidade H02-LP01, 4º bim., contexto 118 | 200 | 0.1 KB | 4 ms | sim |
| 28 | Painel | Painel da turma 2º D (com evolução da escrita) | 200 | 8.8 KB | 26 ms | sim |
| 29 | Ficha | Ficha de Aluno 0500 (5º ano, 5 anos de histórico) | 200 | 27.3 KB | 11 ms | sim |
| 30 | Salvamento | Escrita, 4º bim., contexto 120 | 200 | 0.1 KB | 4 ms | sim |
