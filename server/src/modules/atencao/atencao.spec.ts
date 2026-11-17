import { criarBaseTeste } from '../../test-utils/base-teste';
import { PolicyService } from '../acesso/policy.service';
import { AvaliacaoService } from '../avaliacao/avaliacao.service';
import { FichaService } from '../historico/ficha.service';
import { PainelService } from '../paineis/painel.service';
import { AttentionEvent, ManualAttention, SchoolClass } from '../../database/entities';
import { AtencaoService } from './atencao.service';

type Base = Awaited<ReturnType<typeof criarBaseTeste>>;

/** Integração da atenção pedagógica (tarefas 5.1–5.3), referência: 4º bimestre de 2026. */
describe('atenção pedagógica — integração', () => {
  let b: Base;
  let ficha: FichaService;
  let av: AvaliacaoService;
  let at: AtencaoService;

  beforeEach(async () => {
    b = await criarBaseTeste();
    const policy = new PolicyService(b.ds, b.relogio);
    ficha = new FichaService(b.ds, policy, b.relogio);
    av = new AvaliacaoService(b.ds, policy, b.relogio);
    at = new AtencaoService(b.ds, policy, b.relogio);
  });
  afterEach(() => b.ds.destroy());

  const atencaoDe = async (nome: string) => (await ficha.ficha(b.beatriz, (await b.aluno(nome)).id)).atencao;

  it('Davi: lacunas (3) e atenção manual da seed; escrita do 4º bimestre ausente fica indicada (CR-17, CA-08.3)', async () => {
    const a = await atencaoDe('Davi');
    expect(a).toMatchObject({ estado: 'EM_ATENCAO', motivos: ['LACUNAS', 'MANUAL'], escritaAusente: true, lacunasPendentes: 3 });
    expect(a.manuais[0]).toMatchObject({ situacao: 'ABERTA', autorNome: 'Profª Beatriz' });
    expect(a.manuais[0].eventos).toHaveLength(1);
  });

  it('CA-08.6 / CA-08.7: sem escrita fica incompleta; salvar escrita atualiza a atenção na próxima consulta', async () => {
    expect((await atencaoDe('Ana Clara')).estado).toBe('INCOMPLETA');
    const ctx = await b.contexto('Ana Clara', 2026);
    await av.salvarEscrita(b.beatriz, ctx.id, { bimestre: 4, nivel: 3 });
    expect(await atencaoDe('Ana Clara')).toMatchObject({ estado: 'SEM_SINAL', motivos: [] });
    await av.salvarEscrita(b.beatriz, ctx.id, { bimestre: 4, nivel: 2, version: 1, justificativa: 'Revi a sondagem.' });
    expect(await atencaoDe('Ana Clara')).toMatchObject({ estado: 'EM_ATENCAO', motivos: ['ESCRITA'] });
  });

  it('CA-09.1–09.3: atenção manual justificada sinaliza; texto vazio é rejeitado; duas atenções mantêm autoras', async () => {
    const id = (await b.aluno('Ana Clara')).id;
    await expect(at.abrir(b.beatriz, id, '   ')).rejects.toMatchObject({ status: 422 });
    await at.abrir(b.beatriz, id, 'Observar a leitura em voz alta.');
    await at.abrir(b.debora, id, 'Acompanhar a socialização no recreio.');
    const a = await atencaoDe('Ana Clara');
    expect(a.motivos).toEqual(['MANUAL']);
    expect(a.manuais.map((x) => x.autorNome)).toEqual(['Profª Beatriz', 'Profª Débora']);
  });

  it('coordenação, Carlos e Ana Paula não abrem atenção (403)', async () => {
    const id = (await b.aluno('Ana Clara')).id;
    for (const u of [b.coord, b.carlos, b.anaPaula]) {
      await expect(at.abrir(u, id, 'Texto válido.')).rejects.toMatchObject({ status: 403 });
    }
  });

  it('CA-09.5: substituta encerra com justificativa (autora original preservada) e depois reabre; nada é apagado', async () => {
    const [manual] = (await atencaoDe('Davi')).manuais;
    await expect(at.registrarEvento(b.debora, manual.id, { tipo: 'ENCERRAMENTO', texto: '' })).rejects.toMatchObject({ status: 422 });
    await at.registrarEvento(b.debora, manual.id, { tipo: 'ENCERRAMENTO', texto: 'Concentração estável há quatro semanas.' });
    let a = await atencaoDe('Davi');
    expect(a.manuais[0]).toMatchObject({ situacao: 'ENCERRADA', autorNome: 'Profª Beatriz' });
    expect(a.motivos).toEqual(['LACUNAS']); // a manual saiu; o motivo automático continua
    await expect(at.registrarEvento(b.debora, manual.id, { tipo: 'ENCERRAMENTO', texto: 'de novo' })).rejects.toMatchObject({ status: 409 });

    await at.registrarEvento(b.beatriz, manual.id, { tipo: 'REABERTURA', texto: 'Voltou a dispersar nas atividades longas.' });
    a = await atencaoDe('Davi');
    expect(a.manuais[0].situacao).toBe('ABERTA');
    expect(a.manuais[0].eventos.map((e) => [e.tipo, e.autorNome])).toEqual([
      ['COMENTARIO', 'Profª Beatriz'], ['ENCERRAMENTO', 'Profª Débora'], ['REABERTURA', 'Profª Beatriz'],
    ]);
  });

  it('coordenação consulta, mas não encerra (403)', async () => {
    const [manual] = (await atencaoDe('Davi')).manuais;
    await expect(at.registrarEvento(b.coord, manual.id, { tipo: 'ENCERRAMENTO', texto: 'x' })).rejects.toMatchObject({ status: 403 });
    const f = await ficha.ficha(b.coord, (await b.aluno('Davi')).id);
    expect(f.atencao.podeAgir).toBe(false);
  });

  it('tarefa 5.2: só a autora corrige o texto original; a versão anterior fica preservada', async () => {
    const davi = await b.aluno('Davi');
    const manual = await b.ds.getRepository(ManualAttention).findOneByOrFail({ studentId: davi.id });
    const original = manual.justificativa;
    await expect(at.corrigirTexto(b.debora, manual.id, 'Outro texto.')).rejects.toMatchObject({ status: 403, codigo: 'AUTORIA' });
    await expect(at.corrigirTexto(b.coord, manual.id, 'Outro texto.')).rejects.toMatchObject({ status: 403 });
    await expect(at.corrigirTexto(b.beatriz, manual.id, '   ')).rejects.toMatchObject({ status: 422 });

    await at.corrigirTexto(b.beatriz, manual.id, 'Acompanhar a concentração na leitura e na escrita; reavaliar no 4º bimestre.');
    const a = (await ficha.ficha(b.beatriz, davi.id)).atencao.manuais[0];
    expect(a).toMatchObject({ justificativa: 'Acompanhar a concentração na leitura e na escrita; reavaliar no 4º bimestre.', autorNome: 'Profª Beatriz', minha: true });
    expect(a.eventos.at(-1)).toMatchObject({ tipo: 'CORRECAO', texto: original, autorNome: 'Profª Beatriz' });
    expect((await ficha.ficha(b.debora, davi.id)).atencao.manuais[0].minha).toBe(false);
  });

  it('tarefa 5.3 (CR-23): encerrada no 4º bimestre, a atenção manual continua valendo na consulta do 3º', async () => {
    const painel = new PainelService(b.ds, new PolicyService(b.ds, b.relogio), b.relogio);
    const t2A = await b.ds.getRepository(SchoolClass).findOneByOrFail({ nome: '2º A', anoLetivo: 2026 });
    const davi = await b.aluno('Davi');
    const manual = await b.ds.getRepository(ManualAttention).findOneByOrFail({ studentId: davi.id }); // aberta no 3º bimestre
    const motivos = async (bim: number) => (await painel.turma(b.coord, t2A.id, bim)).alunos.find((x) => x.id === davi.id)!.atencao.motivos;
    expect(await motivos(3)).toContain('MANUAL');

    await at.registrarEvento(b.beatriz, manual.id, { tipo: 'ENCERRAMENTO', texto: 'Concentração melhorou com as pausas.' });
    expect(await b.ds.getRepository(AttentionEvent).findOneBy({ attentionId: manual.id, tipo: 'ENCERRAMENTO' })).toMatchObject({ anoLetivo: 2026, bimestre: 4 });
    expect(await motivos(3)).toContain('MANUAL');     // consulta anterior ao encerramento
    expect(await motivos(4)).not.toContain('MANUAL'); // a partir do encerramento
    expect((await atencaoDe('Davi')).motivos).not.toContain('MANUAL');
    expect(await motivos(2)).not.toContain('MANUAL'); // aberta no 3º: não vale para trás
  });
});
