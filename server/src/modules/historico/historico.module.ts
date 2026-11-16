import { Controller, Get, Module, Param, ParseIntPipe } from '@nestjs/common';
import { UsuarioAtual } from '../../common/auth';
import { User } from '../../database/entities';
import { FichaService } from './ficha.service';
import { LacunasController, LacunasService } from './lacunas.service';

@Controller('alunos')
export class FichaController {
  constructor(private readonly ficha: FichaService) {}

  @Get(':studentId/ficha')
  ler(@UsuarioAtual() u: User, @Param('studentId', ParseIntPipe) studentId: number) {
    return this.ficha.ficha(u, studentId);
  }
}

@Module({ controllers: [FichaController, LacunasController], providers: [FichaService, LacunasService] })
export class HistoricoModule {}
