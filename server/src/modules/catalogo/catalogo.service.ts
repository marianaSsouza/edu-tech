import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CatalogSkill } from '../../database/entities';
import { CATALOGO_VERSAO_ATUAL } from '../../database/seed/cat-v1';
import { carregarCatalogo } from './carregar-catalogo';

@Injectable()
export class CatalogoService implements OnModuleInit {
  constructor(private readonly ds: DataSource) {}

  async onModuleInit(): Promise<void> {
    await carregarCatalogo(this.ds);
  }

  porEtapa(etapa: number, versao: string = CATALOGO_VERSAO_ATUAL): Promise<CatalogSkill[]> {
    return this.ds.getRepository(CatalogSkill).find({ where: { etapa, catalogVersion: versao }, order: { ordem: 'ASC' } });
  }
}
