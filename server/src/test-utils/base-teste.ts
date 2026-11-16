import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../database/data-source';
import { PedagogicalContext, Student, User } from '../database/entities';
import { seedDatabase } from '../database/seed/seed';
import { Relogio, relogioFixo } from '../common/relogio';

/** Data fixa dos testes de integração: 2026, bimestres 1–2 fechados, 3–4 abertos. */
export const HOJE_TESTE = '2026-11-16';

/** Banco em memória com a base fictícia completa; os serviços são instanciados direto (sem @nestjs/testing). */
export async function criarBaseTeste(hoje = HOJE_TESTE) {
  const ds = new DataSource(buildDataSourceOptions(':memory:'));
  await ds.initialize();
  await seedDatabase(ds);
  const relogio: Relogio = relogioFixo(hoje);

  const usuario = (email: string) => ds.getRepository(User).findOneByOrFail({ email });
  const aluno = (nome: string) => ds.getRepository(Student).findOneByOrFail({ nome });
  const contexto = async (nome: string, anoLetivo: number) =>
    ds.getRepository(PedagogicalContext).findOneByOrFail({ studentId: (await aluno(nome)).id, anoLetivo });

  return {
    ds, relogio, usuario, aluno, contexto,
    coord: await usuario('coordenacao@escola.exemplo'),
    beatriz: await usuario('beatriz@escola.exemplo'),
    debora: await usuario('debora@escola.exemplo'),
    carlos: await usuario('carlos@escola.exemplo'),
    anaPaula: await usuario('ana.paula@escola.exemplo'),
  };
}
