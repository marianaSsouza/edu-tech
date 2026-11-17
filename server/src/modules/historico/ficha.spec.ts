import { Enrollment, PedagogicalContext, Period, SchoolClass, Student } from '../../database/entities';
import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { AvaliacaoService } from '../avaliacao/avaliacao.service';
import { FichaService } from './ficha.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

describe('ficha do aluno: histórico e lacunas herdadas — integração (tarefas 4.1, 4.2)', () => {
  let b: Base;
  let ficha: FichaService;
  let av: AvaliacaoService;

  beforeEach(async () => {
    b = await criarBaseTeste();
    const policy = new PolicyService(b.ds, b.relogio);
    ficha = new FichaService(b.ds, policy, b.relogio);
    av = new AvaliacaoService(b.ds, policy, b.relogio);
  });
  afterEach(() => b.ds.destroy());

  it('CA-05.1: mostra os contextos de 1º e 2º anos com autoria; CA-05.3: bimestre sem resposta aparece como ausente', async () => {
    const f = await ficha.ficha(b.beatriz, (await b.aluno('Ana Clara')).id);
    expect(f.linhaDoTempo.map((c) => [c.contexto.anoLetivo, c.contexto.etapa])).toEqual([[2025, 1], [2026, 2]]);
    const [ano25, ano26] = f.linhaDoTempo;
    expect(ano25.habilidades[0].porBimestre[3]?.autorNome).toBe('Profª Ana Paula');
    expect(ano25.habilidades[0].porBimestre[0]).toBeNull(); // 1º bimestre de 2025 sem avaliação
    expect(ano26.habilidades[0].porBimestre[3]).toBeNull(); // 4º bimestre de 2026 ainda sem resposta
    expect(ano26.professoras.map((p) => p.tipo).sort()).toEqual(['SUBSTITUTA', 'TITULAR']);
    expect(f.historicoAnteriorIndisponivel).toBe(false);
  });

  it('Bernardo: 6 pendências herdadas (3 em desenvolvimento + 1 não consolidada + 2 sem avaliação); consolidação de 2026 sai da conta', async () => {
    const f = await ficha.ficha(b.beatriz, (await b.aluno('Bernardo')).id);
    expect(f.lacunas.referencia).toEqual({ anoLetivo: 2026, bimestre: 4 });
    expect(f.lacunas.decomposicao).toEqual({ total: 6, naoConsolidada: 1, emDesenvolvimento: 3, semAvaliacao: 2 });
    const lp02 = f.lacunas.itens.find((i) => i.skillId === 'H01-LP02')!;
    expect(lp02).toMatchObject({ situacao: 'CONSOLIDADA', pendente: false, ultima: { tipo: 'CONSOLIDACAO', anoLetivo: 2026 } });
    // CA-07.1: a avaliação de 2025 continua Em desenvolvimento no resumo anual daquele ano
    const resumo25 = f.linhaDoTempo[0].habilidades.find((h) => h.id === 'H01-LP02')!.resumoAnual;
    expect(resumo25).toEqual({ nivel: 1, bimestre: 4 });
    // CA-07.3: o evento mostra habilidade, origem, autora e data
    expect(f.lacunas.eventos[0]).toMatchObject({ tipo: 'CONSOLIDACAO', skillId: 'H01-LP02', origemAnoLetivo: 2025, autorNome: 'Profª Beatriz' });
  });

  it('correção identificada: a ficha mostra a revisão com o valor original', async () => {
    const ctx = await b.contexto('Ana Clara', 2026);
    await av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP01', { bimestre: 4, nivel: 1 });
    await av.salvarHabilidade(b.beatriz, ctx.id, 'H02-LP01', { bimestre: 4, nivel: 2, version: 1, justificativa: 'Revi a leitura.' });
    const f = await ficha.ficha(b.beatriz, ctx.studentId);
    const cel = f.linhaDoTempo[1].habilidades.find((h) => h.id === 'H02-LP01')!.porBimestre[3]!;
    expect(cel.nivel).toBe(2);
    expect(cel.revisoes).toEqual([expect.objectContaining({ nivelAnterior: 1, nivelNovo: 2, autorNome: 'Profª Beatriz', justificativa: 'Revi a leitura.' })]);
  });

  it('ingressante sem prontuário: "Histórico anterior indisponível" e nenhuma lacuna fabricada (RN14)', async () => {
    const turma = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
    const s = await b.ds.getRepository(Student).save({ nome: 'Nina (ingressante)' });
    const c = await b.ds.getRepository(PedagogicalContext).save({ studentId: s.id, anoLetivo: 2026, etapa: 2, catalogVersion: 'CAT-v1' });
    await b.ds.getRepository(Enrollment).insert({ contextId: c.id, classId: turma.id, de: '2026-08-10', ate: null });
    const f = await ficha.ficha(b.beatriz, s.id);
    expect(f.historicoAnteriorIndisponivel).toBe(true);
    expect(f.lacunas.decomposicao.total).toBe(0);
    expect(f.atencao.estado).toBe('INCOMPLETA'); // limitação do histórico não cria estado de atenção

    // cenário "Histórico externo desconhecido": escrita adequada, sem pendência e sem manual
    await av.salvarEscrita(b.beatriz, c.id, { bimestre: 4, nivel: 3 });
    const depois = await ficha.ficha(b.beatriz, s.id);
    expect(depois.atencao).toMatchObject({ estado: 'SEM_SINAL', motivos: [] });
    expect(depois.historicoAnteriorIndisponivel).toBe(true); // a limitação continua visível, separada
  });

  it('ano anterior reaberto continua elegível para herança (spec lacunas, "Ano anterior reaberto")', async () => {
    await b.ds.getRepository(Period).update({ anoLetivo: 2025, bimestre: 4 }, { estado: 'REABERTO' });
    const f = await ficha.ficha(b.beatriz, (await b.aluno('Bernardo')).id);
    expect(f.lacunas.decomposicao.total).toBe(6);
  });

  it('acesso: Ana Paula e Carlos não abrem a ficha da Ana Clara; coordenação abre (CR-21)', async () => {
    const id = (await b.aluno('Ana Clara')).id;
    await expect(ficha.ficha(b.anaPaula, id)).rejects.toMatchObject({ status: 403 });
    await expect(ficha.ficha(b.carlos, id)).rejects.toMatchObject({ status: 403 });
    await expect(ficha.ficha(b.coord, id)).resolves.toBeDefined();
  });
});
