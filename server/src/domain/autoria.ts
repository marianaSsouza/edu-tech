export type DecisaoEscrita =
  | { ok: true; acao: 'CRIAR' | 'CORRIGIR' }
  | { ok: false; status: 403 | 409 | 422; codigo: string; mensagem: string };

/**
 * D03/D04: decide o que fazer ao salvar uma resposta (habilidade ou escrita).
 * - Não existe resposta: cria (o primeiro salvamento válido vence).
 * - Existe e a tela não sabia (sem versão) ou estava desatualizada: CONFLITO, nunca sobrescreve em silêncio.
 * - Existe, versão confere, mas é de outra autora: negado (autoria); ela usa observação própria.
 * - Existe, é da própria autora: corrige, exigindo justificativa (a versão antiga é preservada).
 */
export function decidirEscritaResposta(i: {
  existente: { autorId: number; version: number } | null;
  usuarioId: number;
  versaoRecebida?: number | null;
  justificativa?: string | null;
}): DecisaoEscrita {
  const recebida = i.versaoRecebida ?? null;
  if (!i.existente) {
    if (recebida !== null) {
      return { ok: false, status: 409, codigo: 'CONFLITO_VERSAO', mensagem: 'Esta resposta mudou desde que a tela foi aberta. Atualize a tela e confira.' };
    }
    return { ok: true, acao: 'CRIAR' };
  }
  if (recebida === null || recebida !== i.existente.version) {
    return { ok: false, status: 409, codigo: 'CONFLITO_VERSAO', mensagem: 'Outra pessoa já registrou ou alterou esta resposta. Atualize a tela e confira antes de salvar.' };
  }
  if (i.existente.autorId !== i.usuarioId) {
    return { ok: false, status: 403, codigo: 'AUTORIA', mensagem: 'Só a autora pode corrigir esta resposta. Você pode acrescentar uma observação própria.' };
  }
  if (!i.justificativa || !i.justificativa.trim()) {
    return { ok: false, status: 422, codigo: 'JUSTIFICATIVA_OBRIGATORIA', mensagem: 'Para corrigir uma resposta já salva, informe a justificativa da correção.' };
  }
  return { ok: true, acao: 'CORRIGIR' };
}
