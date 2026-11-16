import { Module } from '@nestjs/common';
import { CatalogoService } from './catalogo.service';

@Module({ providers: [CatalogoService], exports: [CatalogoService] })
export class CatalogoModule {}
