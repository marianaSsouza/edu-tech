import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserRouter, Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { api, ErroApi, papelLegivel, Usuario } from './api';
import Login from './pages/Login';
import Turmas from './pages/Turmas';
import AlunosTurma from './pages/AlunosTurma';
import Avaliacao from './pages/Avaliacao';
import Ficha from './pages/Ficha';
import Calendario from './pages/Calendario';

/** Quem está logado. null = sem sessão. */
export function useUsuario() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return (await api<{ usuario: Usuario }>('/auth/me')).usuario;
      } catch (e) {
        if (e instanceof ErroApi && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: Infinity,
  });
}

function Layout() {
  const { data: usuario, isLoading, error } = useUsuario();
  const qc = useQueryClient();
  const navigate = useNavigate();

  if (isLoading) return <p className="p-6 text-muted" role="status">Carregando…</p>;
  if (error) return <p className="m-6 rounded-lg bg-warn-soft p-4 text-warn" role="alert">{(error as Error).message}</p>;
  if (!usuario) return <Navigate to="/login" replace />;

  const sair = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    qc.clear();
    qc.setQueryData(['me'], null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/" className="text-lg font-extrabold text-ink no-underline">Fio da Aprendizagem</Link>
          <div className="flex items-center gap-3 text-sm">
            {usuario.papel === 'COORDENACAO' && <Link to="/calendario" className="font-bold">Calendário</Link>}
            <span>
              <b>{usuario.nome}</b> · <span className="text-muted">{papelLegivel(usuario.papel)}</span>
            </span>
            <button type="button" onClick={sair} className="btn-sec">Sair</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="px-4 pb-6 text-center text-xs text-muted">Escola fictícia · somente dados sintéticos</footer>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Turmas /> },
      { path: 'turmas/:id', element: <AlunosTurma /> },
      { path: 'alunos/:id', element: <Ficha /> },
      { path: 'calendario', element: <Calendario /> },
      { path: 'alunos/:id/avaliacao', element: <Avaliacao /> },
      { path: '*', element: <p>Página não encontrada. <Link to="/">Voltar às turmas</Link></p> },
    ],
  },
]);
