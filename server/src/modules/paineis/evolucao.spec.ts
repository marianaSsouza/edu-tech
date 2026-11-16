import { SchoolClass } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { PainelService } from './painel.service';

/** Tarefa 8.2 — evolução da escrita no painel da turma (CR-11, CR-20). */
describe('evolução da escrita — integração', () => {
  it('2º A: do 1º para o 3º bimestre, 3 de 8 avançam; no 1º pede dois bimestres; grupo pequeno fica oculto', async () => {
    const b = await criarBaseTeste();
    try {
      const painel = new PainelService(b.ds, new PolicyService(b.ds, b.relogio), b.relogio);
      const a = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
      const bb = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º B', anoLetivo: 2026 });

      const p = await painel.turma(b.beatriz, a.id, 3);
      expect(p.evolucao).toMatchObject({ a: 1, b: 3, E: 3, V: 8, semComparacao: 0, fracao: { percentual: '37,5%' } });

      // 4º bimestre sem escrita: ninguém é comparável, nada vira zero
      expect(await painel.turma(b.beatriz, a.id, 4)).toMatchObject({ evolucao: { E: 0, V: 0, semComparacao: 8, fracao: { percentual: null } } });

      expect((await painel.turma(b.beatriz, a.id, 1)).evolucao).toMatchObject({ mensagem: expect.stringContaining('dois bimestres distintos') });
      expect((await painel.turma(b.carlos, bb.id, 3)).evolucao).toBeNull();
    } finally {
      await b.ds.destroy();
    }
  });
});
