# Restauração da cópia de segurança (RNF-05, tarefa 9.1)

Gerado automaticamente por `npm run verificar-restauracao` em 16/11/2026, 13:29:54.

## Resultado

**✅ Restauração conferida: o banco restaurado é idêntico ao original** (18 tabelas, 604 registros).

## O que foi feito

1. Banco de origem: `data/fio.sqlite` (base de demonstração em uso; dados fictícios).
2. Cópia de segurança gerada com a API de backup do SQLite: `data/backups/fio-2026-11-16-132954.sqlite` (integridade conferida com `PRAGMA integrity_check`).
3. A cópia foi restaurada em um **ambiente de verificação separado**: `data/verificacao/fio-restaurado.sqlite`. O banco de demonstração não foi alterado.
4. Para cada tabela, comparamos o número de linhas e um hash SHA-256 de **todas as colunas de todas as linhas** (ids, níveis, versões, autoras, datas, justificativas). Hash igual = conteúdo igual.

## Vínculos, histórico, versões e autoria

| O quê | Tabela | Linhas no original | Linhas no restaurado | Conteúdo |
|---|---|---|---|---|
| Contas | `usuarios` | 5 | 5 | ✅ idêntico |
| Turmas | `turmas` | 3 | 3 | ✅ idêntico |
| Alunos | `alunos` | 12 | 12 | ✅ idêntico |
| Matrículas | `matriculas` | 24 | 24 | ✅ idêntico |
| Vínculos docentes | `vinculos_docentes` | 4 | 4 | ✅ idêntico |
| Avaliações de habilidade (com versão e autora) | `respostas_habilidade` | 383 | 383 | ✅ idêntico |
| Avaliações de escrita (com versão e autora) | `respostas_escrita` | 85 | 85 | ✅ idêntico |
| Revisões (correções e limpezas) | `revisoes_resposta` | 0 | 0 | ✅ idêntico |
| Observações | `observacoes` | 11 | 11 | ✅ idêntico |
| Consolidações e reavaliações | `eventos_pedagogicos` | 1 | 1 | ✅ idêntico |
| Atenções manuais | `atencoes_manuais` | 1 | 1 | ✅ idêntico |
| Eventos de atenção | `eventos_atencao` | 1 | 1 | ✅ idêntico |
| Bimestres | `periodos` | 8 | 8 | ✅ idêntico |
| Fechamentos e reaberturas | `eventos_calendario` | 0 | 0 | ✅ idêntico |

Demais tabelas: `anos_encerrados` (1) ✅, `contextos_pedagogicos` (24) ✅, `habilidades_catalogo` (40) ✅, `sequencias` (1) ✅.

O teste automático `server/src/operacao/copia-seguranca.spec.ts` repete o ciclo com uma correção registrada (versão 2 + revisão com justificativa e autora), estraga os dados depois da cópia e confirma que a restauração devolve exatamente o conteúdo da cópia.
