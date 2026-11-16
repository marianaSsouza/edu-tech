import { CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '../database/entities';
import { AuthService } from '../modules/acesso/auth.service';
import { COOKIE_SESSAO, lerCookie } from '../modules/acesso/sessoes.service';
import { naoAutenticado } from './erros';

const CHAVE_PUBLICO = 'rotaPublica';

/** Marca rota sem login (só login e health). */
export const Public = () => SetMetadata(CHAVE_PUBLICO, true);

/** Injeta a pessoa logada (entidade recarregada nesta requisição). */
export const UsuarioAtual = createParamDecorator((_: unknown, ctx: ExecutionContext): User => {
  return ctx.switchToHttp().getRequest().usuario;
});

/** Guard global (APP_GUARD): toda rota exige sessão válida e conta ativa, exceto as @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(CHAVE_PUBLICO, [ctx.getHandler(), ctx.getClass()]);
    if (publica) return true;
    const req = ctx.switchToHttp().getRequest();
    const usuario = await this.auth.usuarioDaSessao(lerCookie(req.headers?.cookie, COOKIE_SESSAO));
    if (!usuario) throw naoAutenticado();
    req.usuario = usuario;
    return true;
  }
}
