import { Body, Controller, Get, Module, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { UsuarioAtual } from '../../common/auth';
import { dadosInvalidos } from '../../common/erros';
import { User } from '../../database/entities';
import { AvaliacaoService, SalvarRespostaBody } from './avaliacao.service';

const opcional = (v: string | undefined, campo: string): number | undefined => {
  if (v === undefined || v === '') return undefined;
  const n = Number(v);
  if (!Number.isInteger(n)) throw dadosInvalidos(`${campo} inválido.`);
  return n;
};

/** Rotas da avaliação bimestral (D16). Autorização sempre no serviço, via PolicyService. */
@Controller()
export class AvaliacaoController {
  constructor(private readonly avaliacao: AvaliacaoService) {}

  @Get('alunos/:studentId/avaliacao')
  ler(
    @UsuarioAtual() u: User,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('ano') ano?: string,
    @Query('bimestre') bimestre?: string,
  ) {
    return this.avaliacao.ler(u, studentId, opcional(ano, 'ano'), opcional(bimestre, 'bimestre'));
  }

  @Put('contextos/:ctxId/habilidades/:skillId')
  salvarHabilidade(
    @UsuarioAtual() u: User,
    @Param('ctxId', ParseIntPipe) ctxId: number,
    @Param('skillId') skillId: string,
    @Body() body: SalvarRespostaBody,
  ) {
    return this.avaliacao.salvarHabilidade(u, ctxId, skillId, body);
  }

  @Post('contextos/:ctxId/habilidades/:skillId/limpar')
  limparHabilidade(
    @UsuarioAtual() u: User,
    @Param('ctxId', ParseIntPipe) ctxId: number,
    @Param('skillId') skillId: string,
    @Body() body: SalvarRespostaBody,
  ) {
    return this.avaliacao.limpar(u, ctxId, { tipo: 'HABILIDADE', skillId }, body);
  }

  @Post('contextos/:ctxId/escrita/limpar')
  limparEscrita(@UsuarioAtual() u: User, @Param('ctxId', ParseIntPipe) ctxId: number, @Body() body: SalvarRespostaBody) {
    return this.avaliacao.limpar(u, ctxId, { tipo: 'ESCRITA' }, body);
  }

  @Put('contextos/:ctxId/escrita')
  salvarEscrita(@UsuarioAtual() u: User, @Param('ctxId', ParseIntPipe) ctxId: number, @Body() body: SalvarRespostaBody) {
    return this.avaliacao.salvarEscrita(u, ctxId, body);
  }

  @Post('contextos/:ctxId/observacoes')
  criarObservacao(@UsuarioAtual() u: User, @Param('ctxId', ParseIntPipe) ctxId: number, @Body() body: { bimestre?: unknown; texto?: unknown }) {
    return this.avaliacao.criarObservacao(u, ctxId, body);
  }

  @Put('observacoes/:id')
  editarObservacao(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number, @Body() body: { texto?: unknown; version?: unknown }) {
    return this.avaliacao.editarObservacao(u, id, body);
  }
}

@Module({ controllers: [AvaliacaoController], providers: [AvaliacaoService] })
export class AvaliacaoModule {}
