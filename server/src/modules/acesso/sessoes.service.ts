import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';

export const COOKIE_SESSAO = 'fio_sessao';
export const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000; // 8 h

interface Sessao { userId: number; expiraEm: number }

/** Sessões em memória (MVP, um processo). Reiniciar o servidor encerra todas as sessões. */
@Injectable()
export class SessoesService {
  private readonly sessoes = new Map<string, Sessao>();

  criar(userId: number, agora = Date.now()): string {
    const token = randomBytes(32).toString('hex');
    this.sessoes.set(token, { userId, expiraEm: agora + DURACAO_SESSAO_MS });
    return token;
  }

  /** Devolve o userId da sessão válida, ou null (sessão inexistente ou expirada). */
  usuarioDe(token: string | undefined, agora = Date.now()): number | null {
    if (!token) return null;
    const s = this.sessoes.get(token);
    if (!s) return null;
    if (s.expiraEm <= agora) {
      this.sessoes.delete(token);
      return null;
    }
    return s.userId;
  }

  encerrar(token: string | undefined): void {
    if (token) this.sessoes.delete(token);
  }
}

/** Lê um cookie do cabeçalho manualmente (sem cookie-parser). */
export function lerCookie(cabecalho: string | undefined, nome: string): string | undefined {
  if (!cabecalho) return undefined;
  for (const parte of cabecalho.split(';')) {
    const i = parte.indexOf('=');
    if (i < 0) continue;
    if (parte.slice(0, i).trim() === nome) return decodeURIComponent(parte.slice(i + 1).trim());
  }
  return undefined;
}
