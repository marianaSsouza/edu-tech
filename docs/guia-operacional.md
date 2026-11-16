# Guia operacional — Fio da Aprendizagem

Como manter a demonstração funcionando: cópia de segurança, restauração e reinício. Todos os comandos são rodados na **pasta do projeto** (`fio-da-aprendizagem`).

Os dados ficam em um único arquivo: `data/fio.sqlite`. Ele **não vai para o git**, e as cópias de segurança (`data/backups/`) também não.

## 1. Fazer uma cópia de segurança

Pode ser feita com o sistema ligado.

```bash
npm run backup
```

A cópia é criada em `data/backups/fio-AAAA-MM-DD-HHMMSS.sqlite` e conferida na hora (`PRAGMA integrity_check`). Para guardar fora do computador, copie esse arquivo para um pendrive ou para a nuvem.

Faça uma cópia **antes da apresentação** e antes de qualquer teste que mude dados.

## 2. Restaurar uma cópia

1. Pare o sistema: no terminal do `npm run dev`, aperte **Ctrl+C**.
2. Restaure a cópia desejada, trocando o nome do arquivo pelo da sua cópia:

```bash
npm run restaurar -- data/backups/fio-AAAA-MM-DD-HHMMSS.sqlite
```

3. Ligue o sistema de novo:

```bash
npm run dev
```

Garantias do comando:

- Ele se recusa a rodar com o servidor ligado.
- Ele se recusa a restaurar um arquivo corrompido ou que não seja um banco.
- Antes de sobrescrever, ele guarda o banco atual em `data/fio.antes-da-restauracao-<data>.sqlite`, para nada se perder.
- No fim, ele confere que o conteúdo restaurado é idêntico ao da cópia.

Sem o nome do arquivo (`npm run restaurar`), o comando lista as cópias disponíveis.

Como a sessão de login fica na memória do servidor, todos precisam entrar de novo depois da restauração.

## 3. Ensaiar a restauração sem mexer na demonstração (evidência do RNF-05)

```bash
npm run verificar-restauracao
```

O comando:

1. faz uma cópia da base atual;
2. restaura essa cópia em uma pasta separada (`data/verificacao/`);
3. compara, tabela por tabela, o número de linhas e um hash de todo o conteúdo.

Isso inclui matrículas, vínculos, avaliações com versão e autora, revisões, observações, eventos e calendário. O resultado vai para [`docs/evidencias/restauracao-rnf05.md`](evidencias/restauracao-rnf05.md).

O teste automático `server/src/operacao/copia-seguranca.spec.ts` (rodado pelo `npm test`) faz o ciclo completo:

1. registra uma correção (versão 2, revisão com justificativa e autora);
2. faz a cópia;
3. apaga matrículas e uma avaliação;
4. restaura e confirma que tudo voltou exatamente como estava.

## 4. Recomeçar a demonstração do zero

Apaga **tudo** e recria a escola fictícia original. Faça uma cópia antes, se quiser guardar o estado atual.

```bash
npm run seed:reset
```

## 5. Medir o desempenho (RNF-06)

```bash
npm run desempenho
```

O comando:

1. cria uma base sintética separada, de 500 alunos e 5 anos (`data/desempenho.sqlite`), sem tocar na demonstração;
2. cronometra 30 operações;
3. grava o resultado em [`docs/evidencias/desempenho-rnf06.md`](evidencias/desempenho-rnf06.md).

## Registro da verificação

| Data | O quê | Resultado | Evidência |
|---|---|---|---|
| 16/11/2026 | Ensaio de restauração (RNF-05, tarefa 9.1) na base de demonstração | Banco restaurado idêntico ao original (18 tabelas) | [`restauracao-rnf05.md`](evidencias/restauracao-rnf05.md) |
| 16/11/2026 | Restauração por `npm run restaurar` em cópia de teste | Conteúdo idêntico à cópia; banco anterior guardado | Executado manualmente; mesmo comportamento coberto por `copia-seguranca.spec.ts` |
| 16/11/2026 | Medição de desempenho (RNF-06, tarefa 9.3) | 30 de 30 operações em até 2 s | [`desempenho-rnf06.md`](evidencias/desempenho-rnf06.md) |

Observação: a base de demonstração atual não tem revisões registradas (0 linhas em `revisoes_resposta`). Por isso, a preservação de versões e revisões é provada pelo teste automático, que cria uma correção antes da cópia.
