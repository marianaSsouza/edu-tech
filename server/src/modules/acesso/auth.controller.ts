import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public, UsuarioAtual } from '../../common/auth';
import { User } from '../../database/entities';
import { AuthService, publico } from './auth.service';
import { COOKIE_SESSAO, DURACAO_SESSAO_MS, lerCookie } from './sessoes.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email?: string; senha?: string }, @Res({ passthrough: true }) res: Response) {
    const { token, usuario } = await this.auth.login(body?.email as string, body?.senha as string);
    res.cookie(COOKIE_SESSAO, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === '1',
      maxAge: DURACAO_SESSAO_MS,
      path: '/',
    });
    return { usuario };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.auth.logout(lerCookie(req.headers.cookie, COOKIE_SESSAO));
    res.clearCookie(COOKIE_SESSAO, { path: '/' });
    return { ok: true };
  }

  @Get('me')
  me(@UsuarioAtual() u: User) {
    return { usuario: publico(u) };
  }
}
