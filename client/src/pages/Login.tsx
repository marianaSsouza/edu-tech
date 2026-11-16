import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, ErroApi, Usuario } from '../api';
import { useUsuario } from '../App';

export default function Login() {
  const { data: usuario } = useUsuario();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const entrar = async (ev: FormEvent) => {
    ev.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const r = await api<{ usuario: Usuario }>('/auth/login', { method: 'POST', body: { email, senha } });
      qc.clear();
      qc.setQueryData(['me'], r.usuario);
      navigate('/');
    } catch (e) {
      setErro((e as ErroApi).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-extrabold">Fio da Aprendizagem</h1>
      <p className="mt-1 text-muted">Entre com a sua conta da escola.</p>
      <form onSubmit={entrar} className="card mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="block font-bold">E-mail</label>
          <input id="email" type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} className="campo mt-1" />
        </div>
        <div>
          <label htmlFor="senha" className="block font-bold">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" required value={senha}
            onChange={(e) => setSenha(e.target.value)} className="campo mt-1" />
        </div>
        {erro && <p role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-warn">⚠ {erro}</p>}
        <button type="submit" className="btn w-full" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
      <details className="mt-6 text-sm text-muted">
        <summary className="cursor-pointer">Contas de demonstração (escola fictícia)</summary>
        <p className="mt-2">Senha de todas: <code>demo1234</code></p>
        <ul className="mt-1 list-disc pl-5">
          <li>coordenacao@escola.exemplo</li>
          <li>beatriz@escola.exemplo (titular 2º A)</li>
          <li>debora@escola.exemplo (substituta 2º A)</li>
          <li>carlos@escola.exemplo (titular 2º B)</li>
          <li>ana.paula@escola.exemplo (1º A em 2025)</li>
        </ul>
      </details>
    </main>
  );
}
