import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../data-source';
import { seedDatabase, SENHA_DEMO } from './seed';

async function main() {
  const reset = process.argv.includes('--reset');
  const ds = new DataSource(buildDataSourceOptions());
  await ds.initialize();
  const { criado } = await seedDatabase(ds, { reset });
  if (criado) {
    console.log('Base de demonstração criada (escola fictícia, dados sintéticos).');
    console.log(`Contas: coordenacao@escola.exemplo | beatriz@escola.exemplo | carlos@escola.exemplo | debora@escola.exemplo | ana.paula@escola.exemplo  (senha: ${SENHA_DEMO})`);
  } else {
    console.log('Base já populada. Use "npm run seed:reset" para recriar do zero.');
  }
  await ds.destroy();
}
main().catch((e) => { console.error(e); process.exit(1); });
