import { User } from '../../database/entities';
import { PolicyService } from '../acesso/policy.service';
import { executarCasos } from './casos-referencia';
import { RegrasController } from './regras.module';

/** Tarefa 8.3 / RF-14 — os 24 casos de referência rodam com as funções reais e batem com o contrato. */
describe('casos de referência CR-01 a CR-24', () => {
  it('23 casos executados na tela aprovados; CR-21 identificado como verificado fora da tela', () => {
    const r = executarCasos();
    const falhas = r.casos.filter((c) => c.status === 'FALHOU').map((c) => `${c.id}: esperado "${c.esperado}", obtido "${c.obtido}"`);
    expect(falhas).toEqual([]);
    expect(r).toMatchObject({ total: 23, aprovados: 23, falhas: 0, foraDaTela: 1 });
    expect(r.casos.map((c) => c.id).sort()).toEqual(Array.from({ length: 24 }, (_, i) => `CR-${String(i + 1).padStart(2, '0')}`));
    expect(r.casos.find((c) => c.id === 'CR-21')).toMatchObject({ status: 'FORA_DA_TELA', obtido: '—', tema: 'ACESSO' });
  });

  it('CA-14.3: falha controlada aparece como falha, com esperado e obtido, e ajusta o total', () => {
    const r = executarCasos('CR-01');
    expect(r).toMatchObject({ aprovados: 22, falhas: 1 });
    expect(r.casos.find((c) => c.id === 'CR-01')).toMatchObject({ status: 'FALHOU', obtido: '2 de 4 = 50,0%' });
  });

  it('a tela de regras é só da coordenação: professora recebe 403', () => {
    const ctrl = new RegrasController(new PolicyService(null as never, null as never));
    const prof = { id: 2, papel: 'PROFESSOR' } as User;
    const coord = { id: 1, papel: 'COORDENACAO' } as User;
    expect(() => ctrl.regras(prof)).toThrow(expect.objectContaining({ status: 403, codigo: 'ACESSO_NEGADO' }));
    expect(() => ctrl.casos(prof)).toThrow(expect.objectContaining({ status: 403 }));
    expect(ctrl.regras(coord).limiteLacunas).toBe(2);
    expect(ctrl.casos(coord).aprovados).toBe(23);
  });
});
