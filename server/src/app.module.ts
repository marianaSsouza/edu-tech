import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/data-source';
import { HealthController } from './health.controller';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { AcessoModule } from './modules/acesso/acesso.module';
import { EscolaModule } from './modules/escola/escola.module';
import { AvaliacaoModule } from './modules/avaliacao/avaliacao.module';
import { HistoricoModule } from './modules/historico/historico.module';
import { AtencaoModule } from './modules/atencao/atencao.service';
import { PaineisModule } from './modules/paineis/painel.service';

@Module({
  imports: [TypeOrmModule.forRoot(buildDataSourceOptions()), AcessoModule, CatalogoModule, EscolaModule, AvaliacaoModule, HistoricoModule, AtencaoModule, PaineisModule],
  controllers: [HealthController],
})
export class AppModule {}
