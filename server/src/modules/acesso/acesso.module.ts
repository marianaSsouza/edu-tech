import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '../../common/auth';
import { Relogio } from '../../common/relogio';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PolicyService } from './policy.service';
import { SessoesService } from './sessoes.service';

/** Global: os demais módulos injetam PolicyService e Relogio sem reimportar. */
@Global()
@Module({
  controllers: [AuthController],
  providers: [
    SessoesService, AuthService, PolicyService, Relogio,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [AuthService, PolicyService, Relogio],
})
export class AcessoModule {}
