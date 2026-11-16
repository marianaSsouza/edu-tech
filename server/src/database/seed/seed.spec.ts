import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../data-source';
import {
  CatalogSkill, Enrollment, PedagogicalContext, SchoolClass, SkillResponse, Student, TeacherLink, User,
} from '../entities';
import { seedDatabase } from './seed';

describe('base fictícia e persistência (tarefas 1.2 a 1.4)', () => {
  let ds: DataSource;
  beforeEach(async () => {
    ds = new DataSource(buildDataSourceOptions(':memory:'));
    await ds.initialize();
  });
  afterEach(async () => {
    await ds.destroy();
  });

  const contagens = async () => ({
    usuarios: await ds.getRepository(User).count(),
    alunos: await ds.getRepository(Student).count(),
    contextos: await ds.getRepository(PedagogicalContext).count(),
    respostas: await ds.getRepository(SkillResponse).count(),
    catalogo: await ds.getRepository(CatalogSkill).count(),
  });

  it('carrega CAT-v1 (40 itens) e a base; repetir a carga não duplica identidades', async () => {
    expect((await seedDatabase(ds)).criado).toBe(true);
    const primeira = await contagens();
    expect(primeira.catalogo).toBe(40);
    expect(primeira.alunos).toBe(12);
    expect(primeira.contextos).toBe(24); // dois anos por aluno

    expect((await seedDatabase(ds)).criado).toBe(false);
    expect(await contagens()).toEqual(primeira);
  });

  it('reinicialização (reset) devolve exatamente a mesma base', async () => {
    await seedDatabase(ds);
    const antes = await contagens();
    await seedDatabase(ds, { reset: true });
    expect(await contagens()).toEqual(antes);
  });

  it('tem uma turma com oito alunos e outra com quatro em 2026', async () => {
    await seedDatabase(ds);
    const tamanho = async (nome: string) => {
      const turma = await ds.getRepository(SchoolClass).findOneByOrFail({ nome, anoLetivo: 2026 });
      return ds.getRepository(Enrollment).count({ where: { classId: turma.id } });
    };
    expect(await tamanho('2º A')).toBe(8);
    expect(await tamanho('2º B')).toBe(4);
  });

  it('mantém titular e substituta vigentes na mesma turma', async () => {
    await seedDatabase(ds);
    const turma = await ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
    const vinculos = await ds.getRepository(TeacherLink).find({ where: { classId: turma.id } });
    expect(vinculos.map((v) => v.tipo).sort()).toEqual(['SUBSTITUTA', 'TITULAR']);
    expect(vinculos.every((v) => v.ate === null)).toBe(true);
  });

  it('habilidade nunca avaliada não vira linha (ausência não é zero)', async () => {
    await seedDatabase(ds);
    const bernardo = await ds.getRepository(Student).findOneByOrFail({ nome: 'Bernardo' });
    const ctx = await ds.getRepository(PedagogicalContext).findOneByOrFail({ studentId: bernardo.id, anoLetivo: 2025 });
    const linhas = await ds.getRepository(SkillResponse).countBy({ contextId: ctx.id, skillId: 'H01-MAT04' });
    expect(linhas).toBe(0);
  });

  it('rejeita uma segunda resposta vigente para a mesma habilidade/contexto/bimestre', async () => {
    await seedDatabase(ds);
    const existente = await ds.getRepository(SkillResponse).findOneOrFail({ where: {} });
    await expect(
      ds.getRepository(SkillResponse).insert({
        contextId: existente.contextId, skillId: existente.skillId, catalogVersion: 'CAT-v1',
        bimestre: existente.bimestre, nivel: 1, autorId: existente.autorId, seq: 999999,
      }),
    ).rejects.toThrow();
  });

  it('grava de forma atômica: se a transação falha, nada fica gravado', async () => {
    await seedDatabase(ds);
    const antes = await ds.getRepository(SkillResponse).count();
    const aluna = await ds.getRepository(Student).findOneByOrFail({ nome: 'Ana Clara' });
    const ctx = await ds.getRepository(PedagogicalContext).findOneByOrFail({ studentId: aluna.id, anoLetivo: 2026 });
    const autor = await ds.getRepository(User).findOneByOrFail({ email: 'beatriz@escola.exemplo' });

    await expect(
      ds.transaction(async (m) => {
        await m.insert(SkillResponse, {
          contextId: ctx.id, skillId: 'H02-LP01', catalogVersion: 'CAT-v1', bimestre: 4, nivel: 2, autorId: autor.id, seq: 888888,
        });
        throw new Error('falha simulada depois da primeira gravação');
      }),
    ).rejects.toThrow('falha simulada');

    expect(await ds.getRepository(SkillResponse).count()).toBe(antes);
  });
});
