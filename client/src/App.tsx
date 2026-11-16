import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserRouter, Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api, ErroApi, papelLegivel, Usuario } from './api';
import Login from './pages/Login';
import Turmas from './pages/Turmas';
import AlunosTurma from './pages/AlunosTurma';
import Avaliacao from './pages/Avaliacao';
import Ficha from './pages/Ficha';
import Calendario from './pages/Calendario';
import Painel from './pages/Painel';
import Regras from './pages/Regras';
import { Avatar } from './components/ui';

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
  const { pathname } = useLocation();

  if (isLoading) return <p className="p-6 text-muted" role="status">⏳ Carregando…</p>;
  if (error) return <p className="m-6 rounded-lg bg-warn-soft p-4 text-warn" role="alert">{(error as Error).message}</p>;
  if (!usuario) return <Navigate to="/login" replace />;

  const sair = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    qc.clear();
    qc.setQueryData(['me'], null);
    navigate('/login');
  };

  const coord = usuario.papel === 'COORDENACAO';
  const itensMenu = [
    { para: '/', rotulo: 'Turmas', fim: true },
    ...(coord ? [{ para: '/painel', rotulo: 'Painel', fim: false }, { para: '/calendario', rotulo: 'Calendário', fim: false }, { para: '/regras', rotulo: 'Regras', fim: false }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="degrade text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-6">
            <Link to="/" className="text-xl font-extrabold text-white no-underline sm:text-2xl">Fio da Aprendizagem</Link>
            <nav aria-label="Menu principal" className="flex flex-wrap gap-1">
              {itensMenu.map((m) => (
                <NavLink key={m.para} to={m.para} end={m.fim}
                  className={({ isActive }) => `rounded-full px-4 py-1.5 text-base font-bold text-white no-underline transition hover:bg-white/15 ${isActive || (m.para === '/' && (pathname.startsWith('/turmas/') || pathname.startsWith('/alunos/'))) ? 'bg-white/25' : ''}`}>
                  {m.rotulo}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Avatar nome={usuario.nome} cor="amarelo" />
            <div className="hidden leading-tight sm:block">
              <div className="font-extrabold">{usuario.nome}</div>
              <div className="text-sm text-white/85">{papelLegivel(usuario.papel)}</div>
            </div>
            <button type="button" onClick={sair} className="rounded-2xl border-2 border-white/90 px-4 py-2 font-extrabold text-white transition hover:bg-white/15">Sair</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
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
      { path: 'painel', element: <Painel /> },
      { path: 'regras', element: <Regras /> },
      { path: 'alunos/:id/avaliacao', element: <Avaliacao /> },
      { path: '*', element: <p>Página não encontrada. <Link to="/">Voltar às turmas</Link></p> },
    ],
  },
]);
