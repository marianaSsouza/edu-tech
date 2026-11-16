import { estaVigente } from './vigencia';
import { bimestreSugerido, situacaoPeriodo } from './periodo';
import { LIMITE_OBSERVACOES, verificarLimite } from './observacoes';
import { decidirEscritaResposta } from './autoria';

describe('vigência de datas civis (D06)', () => {
  it('é inclusiva nas duas pontas e aceita fim em aberto', () => {
    expect(estaVigente('2026-02-02', '2026-12-18', '2026-02-02')).toBe(true);
    expect(estaVigente('2026-02-02', '2026-12-18', '2026-12-18')).toBe(true);
    expect(estaVigente('2026-02-02', '2026-12-18', '2026-02-01')).toBe(false);
    expect(estaVigente('2026-02-02', '2026-12-18', '2026-12-19')).toBe(false);
    expect(estaVigente('2026-02-02', null, '2030-01-01')).toBe(true);
  });
});

describe('situação do período (D06; RF-13, CA-13.2/13.3)', () => {
  const hoje = '2026-11-16';
  it('período que ainda não começou é FUTURO, mesmo aberto', () => {
    expect(situacaoPeriodo({ estado: 'ABERTO', inicio: '2027-02-08' }, hoje)).toBe('FUTURO');
  });
  it('período fechado bloqueia escrita', () => {
    expect(situacaoPeriodo({ estado: 'FECHADO', inicio: '2026-04-27' }, hoje)).toBe('FECHADO');
  });
  it('período aberto ou reaberto já iniciado está DISPONIVEL', () => {
    expect(situacaoPeriodo({ estado: 'ABERTO', inicio: '2026-09-28' }, hoje)).toBe('DISPONIVEL');
    expect(situacaoPeriodo({ estado: 'REABERTO', inicio: '2026-02-09' }, hoje)).toBe('DISPONIVEL');
  });
  it('bimestre sugerido é o mais recente já iniciado, ou o 1º', () => {
    const p = [
      { bimestre: 1, inicio: '2026-02-09' }, { bimestre: 2, inicio: '2026-04-27' },
      { bimestre: 3, inicio: '2026-07-20' }, { bimestre: 4, inicio: '2026-09-28' },
    ];
    expect(bimestreSugerido(p, hoje)).toBe(4);
    expect(bimestreSugerido(p, '2026-05-01')).toBe(2);
    expect(bimestreSugerido(p, '2026-01-10')).toBe(1);
  });
});

describe('limite compartilhado de observações (D02; RN05, RF-04, CA-04.3)', () => {
  const tres = [{ id: 1, texto: 'a'.repeat(3000) }];
  it('3.000 + 1.000 cabe exatamente no limite', () => {
    expect(verificarLimite(tres, 'b'.repeat(1000))).toEqual({ cabe: true, usado: 4000, max: LIMITE_OBSERVACOES });
  });
  it('3.000 + 1.001 é rejeitado', () => {
    expect(verificarLimite(tres, 'b'.repeat(1001)).cabe).toBe(false);
  });
  it('ao editar, o texto antigo da própria observação sai da conta', () => {
    expect(verificarLimite(tres, 'c'.repeat(4000), 1).cabe).toBe(true);
  });
  it('conta caracteres, não unidades UTF-16 (acentos e emoji contam 1)', () => {
    expect(verificarLimite([], '😀é').usado).toBe(2);
  });
});

describe('decisão de escrita de resposta (D03/D04; CA-13.4, CA-13.5)', () => {
  const beatriz = 10;
  const debora = 20;
  it('cria quando não existe resposta e a tela não informou versão', () => {
    expect(decidirEscritaResposta({ existente: null, usuarioId: beatriz })).toEqual({ ok: true, acao: 'CRIAR' });
  });
  it('versão informada para resposta inexistente dá 409', () => {
    const d = decidirEscritaResposta({ existente: null, usuarioId: beatriz, versaoRecebida: 1 });
    expect(d).toMatchObject({ ok: false, status: 409, codigo: 'CONFLITO_VERSAO' });
  });
  it('segunda professora sem versão (tela via campo vazio) recebe 409', () => {
    const d = decidirEscritaResposta({ existente: { autorId: beatriz, version: 1 }, usuarioId: debora });
    expect(d).toMatchObject({ ok: false, status: 409, codigo: 'CONFLITO_VERSAO' });
  });
  it('outra autora com versão correta recebe AUTORIA (403)', () => {
    const d = decidirEscritaResposta({ existente: { autorId: beatriz, version: 1 }, usuarioId: debora, versaoRecebida: 1, justificativa: 'x' });
    expect(d).toMatchObject({ ok: false, status: 403, codigo: 'AUTORIA' });
  });
  it('versão desatualizada da própria autora dá 409', () => {
    const d = decidirEscritaResposta({ existente: { autorId: beatriz, version: 2 }, usuarioId: beatriz, versaoRecebida: 1, justificativa: 'x' });
    expect(d).toMatchObject({ ok: false, status: 409 });
  });
  it('correção sem justificativa dá 422; com justificativa corrige', () => {
    const base = { existente: { autorId: beatriz, version: 1 }, usuarioId: beatriz, versaoRecebida: 1 };
    expect(decidirEscritaResposta({ ...base, justificativa: '   ' })).toMatchObject({ ok: false, status: 422, codigo: 'JUSTIFICATIVA_OBRIGATORIA' });
    expect(decidirEscritaResposta({ ...base, justificativa: 'Marquei a habilidade errada.' })).toEqual({ ok: true, acao: 'CORRIGIR' });
  });
});
