import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { relogioFixo } from '../common/relogio';
import { buildDataSourceOptions } from '../database/data-source';
import { Enrollment, ResponseRevision, SkillResponse, TeacherLink, User } from '../database/entities';
import { seedDatabase } from '../database/seed/seed';
import { PolicyService } from '../modules/acesso/policy.service';
import { AvaliacaoService } from '../modules/avaliacao/avaliacao.service';
import { compararImpressoes, fazerCopia, impressaoDigital, restaurarCopia } from './copia-seguranca';

/**
 * Tarefa 9.1 / RNF-05 — cenário "Restauração antes da entrega" (gestao-escolar):
 * WHEN uma cópia é restaurada em ambiente de verificação
 * THEN matrículas, vínculos, avaliações, revisões e autoria são recuperados.
 */
describe('cópia de segurança e restauração', () => {
  let pasta: string;
  let banco: string;

  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), 'fio-backup-'));
    banco = join(pasta, 'fio.sqlite');
  });
  afterEach(() => rmSync(pasta, { recursive: true, force: true }));

  const abrir = async () => { const ds = new DataSource(buildDataSourceOptions(banco)); await ds.initialize(); return ds; };
  const servico = (ds: DataSource) => { const r = relogioFixo('2026-11-16'); return new AvaliacaoService(ds, new PolicyService(ds, r), r); };

  it('restaura vínculos, matrículas, avaliações com versão, revisões e autoria exatamente como estavam', async () => {
    // base de demonstração com uma correção (versão 2 + revisão com justificativa e autora)
    let ds = await abrir();
    await seedDatabase(ds);
    const beatriz = await ds.getRepository(User).findOneByOrFail({ email: 'beatriz@escola.exemplo' });
    const ctx = (await ds.query(`SELECT c.id FROM contextos_pedagogicos c JOIN alunos a ON a.id = c.studentId WHERE a.nome = 'Ana Clara' AND c.anoLetivo = 2026`))[0].id;
    await servico(ds).salvarHabilidade(beatriz, ctx, 'H02-LP01', { bimestre: 4, nivel: 1 });
    await servico(ds).salvarHabilidade(beatriz, ctx, 'H02-LP01', { bimestre: 4, nivel: 2, version: 1, justificativa: 'Reavaliei com nova atividade.' });
    await ds.destroy();

    const antes = impressaoDigital(banco);
    const copia = join(pasta, 'backups', 'fio-copia.sqlite');
    await fazerCopia(banco, copia);
    expect(compararImpressoes(antes, impressaoDigital(copia))).toEqual([]);

    // depois da cópia, os dados mudam (simula perda/erro): apaga matrículas e uma avaliação
    ds = await abrir();
    await ds.query(`DELETE FROM matriculas`);
    await ds.getRepository(SkillResponse).delete({ contextId: ctx, skillId: 'H02-LP01', bimestre: 4 });
    await ds.destroy();
    expect(compararImpressoes(antes, impressaoDigital(banco))).not.toEqual([]);

    // restauração: guarda o banco estragado ao lado e volta exatamente ao conteúdo da cópia
    const protecao = await restaurarCopia(copia, banco, 'teste');
    expect(protecao && existsSync(protecao)).toBeTruthy();
    expect(compararImpressoes(antes, impressaoDigital(banco))).toEqual([]);

    // e a aplicação lê normalmente o banco restaurado
    ds = await abrir();
    const resposta = await ds.getRepository(SkillResponse).findOneByOrFail({ contextId: ctx, skillId: 'H02-LP01', bimestre: 4 });
    expect(resposta).toMatchObject({ nivel: 2, version: 2, autorId: beatriz.id });
    const revisao = await ds.getRepository(ResponseRevision).findOneByOrFail({ responseId: resposta.id });
    expect(revisao).toMatchObject({ nivelAnterior: 1, nivelNovo: 2, autorId: beatriz.id, justificativa: 'Reavaliei com nova atividade.' });
    expect(await ds.getRepository(Enrollment).count()).toBe(24);
    expect(await ds.getRepository(TeacherLink).countBy({ userId: beatriz.id })).toBe(1);
    await ds.destroy();
  });

  it('recusa restaurar um arquivo que não é um banco válido', async () => {
    const falso = join(pasta, 'falso.sqlite');
    require('fs').writeFileSync(falso, 'isto não é um banco');
    await expect(restaurarCopia(falso, banco)).rejects.toThrow();
    expect(existsSync(banco)).toBe(false);
  });
});
