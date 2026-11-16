import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/data-source';
import { HealthController } from './health.controller';
import { CatalogoModule } from './modules/catalogo/catalogo.module';

@Module({
  imports: [TypeOrmModule.forRoot(buildDataSourceOptions()), CatalogoModule],
  controllers: [HealthController],
})
export class AppModule {}
