import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Papel, User } from '../../database/entities';
import { naoAutenticado } from '../../common/erros';
import { SessoesService } from './sessoes.service';

/** O que a API devolve sobre a pessoa logada (nunca o hash da senha). */
export interface UsuarioPublico { id: number; nome: string; email: string; papel: Papel }

export function publico(u: User): UsuarioPublico {
  return { id: u.id, nome: u.nome, email: u.email, papel: u.papel };
}

/** spec acesso-e-permissoes: contas individuais, sem cadastro público; conta desativada não entra (RN11, RNF-02). */
@Injectable()
export class AuthService {
  constructor(private readonly ds: DataSource, private readonly sessoes: SessoesService) {}

  async login(email: string, senha: string): Promise<{ token: string; usuario: UsuarioPublico }> {
    const credenciaisErradas = naoAutenticado('E-mail ou senha incorretos.');
    if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) throw credenciaisErradas;
    const u = await this.ds.getRepository(User).findOneBy({ email: email.trim().toLowerCase() });
    if (!u || !(await bcrypt.compare(senha, u.senhaHash))) throw credenciaisErradas;
    if (!u.ativo) throw naoAutenticado('Esta conta está desativada. Procure a coordenação.');
    return { token: this.sessoes.criar(u.id), usuario: publico(u) };
  }

  /** Recarrega a pessoa a cada requisição: desativar a conta corta o acesso na hora. */
  async usuarioDaSessao(token: string | undefined): Promise<User | null> {
    const userId = this.sessoes.usuarioDe(token);
    if (userId === null) return null;
    const u = await this.ds.getRepository(User).findOneBy({ id: userId });
    if (!u || !u.ativo) {
      this.sessoes.encerrar(token);
      return null;
    }
    return u;
  }

  logout(token: string | undefined): void {
    this.sessoes.encerrar(token);
  }
}
