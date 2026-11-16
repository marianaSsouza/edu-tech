import { Injectable } from '@nestjs/common';
import { hojeEmSaoPaulo } from '../domain/vigencia';

/** D06: fonte única de "hoje" (America/Sao_Paulo). Nos testes, use `relogioFixo('2026-11-16')`. */
@Injectable()
export class Relogio {
  hoje(): string {
    return hojeEmSaoPaulo();
  }
}

export function relogioFixo(data: string): Relogio {
  return { hoje: () => data };
}
