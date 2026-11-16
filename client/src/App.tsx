import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserRouter, Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
import { IconeAluno, IconeCalendario, IconeGestao, IconeMenu, IconePainel, IconeRegras, IconeTurmas, Marca } from './components/Icones';
import Alunos from './pages/Alunos';
import Gestao from './pages/Gestao';
import { BotaoVoltar } from './components/BotaoVoltar';

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
  const [menuAberto, setMenuAberto] = useState(false);

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
    { para: '/painel', rotulo: 'Painel', icone: <IconePainel />, ativo: pathname.startsWith('/painel') },
    { para: '/', rotulo: 'Turmas', icone: <IconeTurmas />, ativo: pathname === '/' || pathname.startsWith('/turmas/') },
    { para: '/alunos', rotulo: 'Alunos', icone: <IconeAluno />, ativo: pathname.startsWith('/alunos') },
    ...(coord ? [
      { para: '/calendario', rotulo: 'Calendário', icone: <IconeCalendario />, ativo: pathname.startsWith('/calendario') },
      { para: '/gestao', rotulo: 'Gestão', icone: <IconeGestao />, ativo: pathname.startsWith('/gestao') },
      { para: '/regras', rotulo: 'Regras', icone: <IconeRegras />, ativo: pathname.startsWith('/regras') },
    ] : []),
  ];

  const menu = (
    <>
      <Link to="/" onClick={() => setMenuAberto(false)} className="hidden items-center gap-3 px-2 text-white no-underline md:flex">
        <Marca tamanho={52} />
        <span className="text-xl font-extrabold leading-tight">Fio da<br />Aprendizagem</span>
      </Link>
      <nav aria-label="Menu principal" className="flex flex-col gap-1.5 md:mt-8">
        {itensMenu.map((m) => (
          <Link key={m.para} to={m.para} onClick={() => setMenuAberto(false)} aria-current={m.ativo ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-lg font-bold text-white no-underline transition hover:bg-white/15 ${m.ativo ? 'bg-white/20 shadow-sm' : ''}`}>
            {m.icone}{m.rotulo}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-3xl bg-white/15 p-4">
        <div className="flex items-center gap-3">
          <Avatar nome={usuario.nome} cor="amarelo" />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-extrabold">{usuario.nome}</div>
            <div className="text-sm text-white/85">{papelLegivel(usuario.papel)}</div>
          </div>
        </div>
        <button type="button" onClick={sair} className="mt-3 rounded-xl border-2 border-white/90 px-4 py-1.5 font-extrabold text-white transition hover:bg-white/15">Sair</button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* menu lateral (computador) */}
      <aside className="lateral sticky top-0 hidden h-screen w-72 shrink-0 flex-col p-5 text-white md:flex">{menu}</aside>

      {/* barra de cima (celular) */}
      <header className="lateral flex items-center justify-between px-4 py-3 text-white md:hidden">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-white no-underline"><Marca tamanho={36} /> Fio da Aprendizagem</Link>
        <button type="button" className="rounded-xl p-2 hover:bg-white/15" aria-expanded={menuAberto} aria-controls="menu-celular" onClick={() => setMenuAberto((v) => !v)}>
          <IconeMenu /><span className="sr-only">{menuAberto ? 'Fechar menu' : 'Abrir menu'}</span>
        </button>
      </header>
      {menuAberto && <div id="menu-celular" className="lateral flex flex-col gap-4 px-4 pb-5 text-white md:hidden">{menu}</div>}

      <div className="min-w-0 flex-1">
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          {pathname !== '/' && <BotaoVoltar />}
          <Outlet />
        </main>
        <footer className="px-4 pb-6 text-center text-xs text-muted">Escola fictícia · somente dados sintéticos</footer>
      </div>
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
      { path: 'alunos', element: <Alunos /> },
      { path: 'alunos/:id', element: <Ficha /> },
      { path: 'calendario', element: <Calendario /> },
      { path: 'painel', element: <Painel /> },
      { path: 'regras', element: <Regras /> },
      { path: 'gestao', element: <Gestao /> },
      { path: 'alunos/:id/avaliacao', element: <Avaliacao /> },
      { path: '*', element: <p>Página não encontrada. <Link to="/">Voltar às turmas</Link></p> },
    ],
  },
]);
