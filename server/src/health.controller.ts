import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from './common/auth';
import { CatalogSkill, User } from './database/entities';

@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly ds: DataSource) {}

  @Get()
  async status() {
    const habilidades = await this.ds.getRepository(CatalogSkill).count({ where: { catalogVersion: 'CAT-v1' } });
    const usuarios = await this.ds.getRepository(User).count();
    return { status: 'ok', catalogo: 'CAT-v1', habilidades, baseDemonstracao: usuarios > 0 };
  }
}
