import { Controller, Get, Module, Param, ParseIntPipe } from '@nestjs/common';
import { UsuarioAtual } from '../../common/auth';
import { User } from '../../database/entities';
import { TurmasService } from './turmas.service';

@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmas: TurmasService) {}

  @Get()
  async listar(@UsuarioAtual() u: User) {
    return { turmas: await this.turmas.listar(u), periodoAtual: await this.turmas.periodoAtual() };
  }

  @Get(':id/alunos')
  alunos(@UsuarioAtual() u: User, @Param('id', ParseIntPipe) id: number) {
    return this.turmas.alunos(u, id);
  }
}

@Module({ controllers: [TurmasController], providers: [TurmasService], exports: [TurmasService] })
export class EscolaModule {}
