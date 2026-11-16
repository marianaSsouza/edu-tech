import { HttpException } from '@nestjs/common';

/**
 * D16: erros padronizados { codigo, mensagem }.
 * 401 NAO_AUTENTICADO · 403 ACESSO_NEGADO/AUTORIA · 404 NAO_ENCONTRADO · 409 CONFLITO_VERSAO ·
 * 422 PERIODO_FECHADO/PERIODO_FUTURO/JUSTIFICATIVA_OBRIGATORIA/LIMITE_OBSERVACOES/DADOS_INVALIDOS
 */
export class ErroApi extends HttpException {
  constructor(status: number, public readonly codigo: string, mensagem: string) {
    super({ codigo, mensagem }, status);
  }
}

export const naoAutenticado = (mensagem = 'Sessão encerrada. Entre novamente.') => new ErroApi(401, 'NAO_AUTENTICADO', mensagem);
export const acessoNegado = (mensagem = 'Você não tem permissão para acessar este conteúdo.') => new ErroApi(403, 'ACESSO_NEGADO', mensagem);
export const naoEncontrado = (mensagem = 'Registro não encontrado.') => new ErroApi(404, 'NAO_ENCONTRADO', mensagem);
export const conflitoVersao = (mensagem = 'Outra pessoa já registrou ou alterou esta resposta. Atualize a tela e confira antes de salvar.') =>
  new ErroApi(409, 'CONFLITO_VERSAO', mensagem);
export const dadosInvalidos = (mensagem: string) => new ErroApi(422, 'DADOS_INVALIDOS', mensagem);

/** Violação de índice único do SQLite (duas gravações simultâneas do mesmo campo ausente) vira 409. */
export function ehViolacaoUnica(e: unknown): boolean {
  const msg = String((e as { message?: string })?.message ?? '');
  const code = String((e as { code?: string })?.code ?? (e as { driverError?: { code?: string } })?.driverError?.code ?? '');
  return code.startsWith('SQLITE_CONSTRAINT_UNIQUE') || msg.includes('UNIQUE constraint failed');
}
