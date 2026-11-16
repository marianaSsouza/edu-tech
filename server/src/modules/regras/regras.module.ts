import { Controller, Get, Module, Query } from '@nestjs/common';
import { UsuarioAtual } from '../../common/auth';
import { acessoNegado } from '../../common/erros';
import { User } from '../../database/entities';
import { LIMITE_LACUNAS, LIMITE_TEXTO_ATENCAO, MINIMO_ESCRITA } from '../../domain/atencao';
import { LIMITE_OBSERVACOES } from '../../domain/observacoes';
import { GRUPO_MINIMO } from '../../domain/painel';
import { CAT_V1, CATALOGO_VERSAO_ATUAL } from '../../database/seed/cat-v1';
import { CAT_DEMO_5 } from '../../database/seed/catalogo-demo.fixture';
import { PolicyService } from '../acesso/policy.service';
import { executarCasos } from './casos-referencia';

/**
 * RF-14 / PRO-09: regras visíveis (valores lidos das constantes que o sistema usa de fato)
 * e execução dos casos sintéticos, sem acesso ao banco (CA-14.2).
 * Decisão da usuária (16/11): a tela é só da coordenação; a permissão é conferida aqui, pelo PolicyService.
 */
@Controller('regras')
export class RegrasController {
  constructor(private readonly policy: PolicyService) {}

  @Get()
  regras(@UsuarioAtual() u: User) {
    this.exigirCoordenacao(u);
    return {
      matrizEscrita: MINIMO_ESCRITA,
      limiteLacunas: LIMITE_LACUNAS,
      grupoMinimo: GRUPO_MINIMO,
      limiteObservacoes: LIMITE_OBSERVACOES,
      limiteTextoAtencao: LIMITE_TEXTO_ATENCAO,
      catalogo: {
        versao: CATALOGO_VERSAO_ATUAL,
        total: CAT_V1.length,
        porEtapa: [1, 2, 3, 4, 5].map((etapa) => ({ etapa, habilidades: CAT_V1.filter((h) => h.etapa === etapa).length })),
      },
      catalogoDemonstrativo: { itens: CAT_DEMO_5.length, ids: CAT_DEMO_5.map((h) => h.id) },
    };
  }

  @Get('casos')
  casos(@UsuarioAtual() u: User, @Query('falhaControlada') falhaControlada?: string) {
    this.exigirCoordenacao(u);
    return { executadoEm: new Date().toISOString(), ...executarCasos(falhaControlada || undefined) };
  }

  private exigirCoordenacao(u: User) {
    if (!this.policy.ehCoordenacao(u)) throw acessoNegado('A tela de regras e casos é exclusiva da coordenação.');
  }
}

@Module({ controllers: [RegrasController] })
export class RegrasModule {}
