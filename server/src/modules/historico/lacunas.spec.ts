import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { FichaService } from './ficha.service';
import { LacunasService } from './lacunas.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/** Tarefa 4.3: consolidação e reavaliação de lacuna herdada (RF-07, CA-07.1–07.4, CR-06). */
describe('consolidar e reavaliar lacuna herdada — integração', () => {
  let b: Base;
  let ficha: FichaService;
  let lacunas: LacunasService;
  let bernardo: number;

  beforeEach(async () => {
    b = await criarBaseTeste();
    const policy = new PolicyService(b.ds, b.relogio);
    ficha = new FichaService(b.ds, policy, b.relogio);
    lacunas = new LacunasService(b.ds, policy, b.relogio);
    bernardo = (await b.aluno('Bernardo')).id;
  });
  afterEach(() => b.ds.destroy());

  const fichaDe = (u = b.beatriz) => ficha.ficha(u, bernardo);

  it('CR-06 / CA-07.1–07.3: consolidar tira da contagem, mantém 2025 intacto e registra origem, autora e período', async () => {
    expect((await fichaDe()).lacunas.decomposicao.total).toBe(6);
    const r = await lacunas.registrar(b.beatriz, bernardo, 'H01-LP03', { tipo: 'CONSOLIDACAO', justificativa: 'Localizou informações em três textos curtos.' });
    expect(r.evento).toMatchObject({ tipo: 'CONSOLIDACAO', nivel: 2, anoLetivo: 2026, bimestre: 4, origemAnoLetivo: 2025 });

    const f = await fichaDe();
    expect(f.lacunas.decomposicao.total).toBe(5);
    expect(f.lacunas.itens.find((i) => i.skillId === 'H01-LP03')).toMatchObject({ situacao: 'CONSOLIDADA', pendente: false, ultima: { evidencia: 'Localizou informações em três textos curtos.' } });
    expect(f.linhaDoTempo[0].habilidades.find((h) => h.id === 'H01-LP03')!.resumoAnual?.nivel).toBe(1);
    expect(f.lacunas.eventos.at(-1)).toMatchObject({ skillId: 'H01-LP03', autorNome: 'Profª Beatriz', origemAnoLetivo: 2025 });
  });

  it('reabertura pedagógica: reavaliar uma herdada consolidada como Em desenvolvimento volta à contagem, com os dois eventos', async () => {
    await lacunas.registrar(b.debora, bernardo, 'H01-LP02', { tipo: 'REAVALIACAO', nivel: 1, justificativa: 'Voltou a omitir letras em palavras novas.' });
    const f = await fichaDe();
    expect(f.lacunas.decomposicao.total).toBe(7);
    expect(f.lacunas.eventos.filter((e) => e.skillId === 'H01-LP02').map((e) => e.tipo)).toEqual(['CONSOLIDACAO', 'REAVALIACAO']);
  });

  it('CA-07.4: com duas pendências, consolidar uma remove só o motivo por quantidade', async () => {
    const giovana = (await b.aluno('Giovana')).id; // 2025: uma Em desenvolvimento e uma nunca avaliada
    const antes = (await ficha.ficha(b.beatriz, giovana));
    expect(antes.lacunas.decomposicao.total).toBe(2);
    expect(antes.atencao.motivos).toContain('LACUNAS');
    const pendente = antes.lacunas.itens.find((i) => i.pendente)!;
    await lacunas.registrar(b.beatriz, giovana, pendente.skillId, { tipo: 'CONSOLIDACAO', justificativa: 'Evidência em atividade de sala.' });
    const depois = await ficha.ficha(b.beatriz, giovana);
    expect(depois.lacunas.decomposicao.total).toBe(1);
    expect(depois.atencao.motivos).not.toContain('LACUNAS');
  });

  it('validações: justificativa vazia, habilidade não herdada e reavaliação com nível inválido dão 422', async () => {
    await expect(lacunas.registrar(b.beatriz, bernardo, 'H01-LP03', { tipo: 'CONSOLIDACAO', justificativa: ' ' })).rejects.toMatchObject({ status: 422 });
    await expect(lacunas.registrar(b.beatriz, bernardo, 'H02-LP01', { tipo: 'CONSOLIDACAO', justificativa: 'x' })).rejects.toMatchObject({ status: 422 });
    await expect(lacunas.registrar(b.beatriz, bernardo, 'H01-LP03', { tipo: 'REAVALIACAO', nivel: 2, justificativa: 'x' })).rejects.toMatchObject({ status: 422 });
  });

  it('coordenação e Carlos não registram (403); a ficha da coordenação vem sem permissão', async () => {
    for (const u of [b.coord, b.carlos]) {
      await expect(lacunas.registrar(u, bernardo, 'H01-LP03', { tipo: 'CONSOLIDACAO', justificativa: 'x' })).rejects.toMatchObject({ status: 403 });
    }
    expect((await fichaDe(b.coord)).lacunas.podeRegistrar).toBe(false);
    expect((await fichaDe()).lacunas.podeRegistrar).toBe(true);
  });

  it('com o bimestre em andamento fechado, o registro é negado (422 PERIODO_FECHADO)', async () => {
    const b2 = await criarBaseTeste('2026-06-01'); // 2º bimestre de 2026, fechado na base fictícia
    try {
      const l2 = new LacunasService(b2.ds, new PolicyService(b2.ds, b2.relogio), b2.relogio);
      const id = (await b2.aluno('Bernardo')).id;
      await expect(l2.registrar(b2.beatriz, id, 'H01-LP03', { tipo: 'CONSOLIDACAO', justificativa: 'x' }))
        .rejects.toMatchObject({ status: 422, codigo: 'PERIODO_FECHADO' });
    } finally {
      await b2.ds.destroy();
    }
  });
});
