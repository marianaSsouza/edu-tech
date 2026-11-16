import { FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, ErroApi, Usuario } from '../api';
import { useUsuario } from '../App';
import { Marca } from '../components/Icones';

export default function Login() {
  const { data: usuario } = useUsuario();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [esqueci, setEsqueci] = useState(false);
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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* lado da marca */}
      <section className="degrade relative overflow-hidden px-8 py-12 text-white sm:px-16 lg:flex lg:flex-col lg:justify-center">
        <Marca tamanho={80} />
        <h1 className="mt-6 text-4xl font-extrabold sm:text-6xl">Fio da Aprendizagem</h1>
        <p className="mt-4 max-w-md text-lg sm:text-2xl">Acompanhe o aprendizado de cada criança, bimestre a bimestre.</p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="O que o sistema acompanha">
          <li className="chip chip-amarelo">Habilidades</li>
          <li className="chip chip-lilas">Histórico</li>
          <li className="chip chip-menta">Atenção pedagógica</li>
        </ul>
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 hidden h-96 w-96 rounded-full lg:block"
          style={{ backgroundImage: 'linear-gradient(160deg, #fdd34d, #f9a23b)' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 right-40 hidden h-56 w-56 rounded-full opacity-90 lg:block"
          style={{ backgroundImage: 'linear-gradient(160deg, #34c38f, #2bb3a3)' }} />
      </section>

      {/* formulário */}
      <main className="flex items-center justify-center px-4 py-10">
        <div className="card w-full max-w-md sm:p-10">
          <h2 className="text-3xl font-extrabold">Bem-vinda de volta</h2>
          <p className="mt-2 text-lg text-muted">Entre com a sua conta individual.</p>
          <form onSubmit={entrar} className="mt-6 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block font-bold">E-mail</label>
              <input id="email" type="email" autoComplete="username" required value={email}
                onChange={(e) => setEmail(e.target.value)} className="campo mt-2" />
            </div>
            <div>
              <label htmlFor="senha" className="block font-bold">Senha</label>
              <div className="mt-2 flex gap-2">
                <input id="senha" type={mostrar ? 'text' : 'password'} autoComplete="current-password" required value={senha}
                  onChange={(e) => setSenha(e.target.value)} className="campo" />
                <button type="button" className="btn-sec shrink-0" aria-pressed={mostrar} onClick={() => setMostrar((m) => !m)}>
                  {mostrar ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>
            <div>
              <button type="button" className="font-bold text-azul-escuro underline" aria-expanded={esqueci} aria-controls="ajuda-senha" onClick={() => setEsqueci((v) => !v)}>
                Esqueci minha senha
              </button>
              {esqueci && (
                <p id="ajuda-senha" className="mt-2 rounded-2xl bg-lilas px-4 py-2 text-sm text-lilas-texto">
                  O sistema não troca senha sozinho, por segurança. Peça à coordenação para gerar uma nova senha para a sua conta.
                </p>
              )}
            </div>
            {erro && <p role="alert" className="rounded-2xl bg-alerta-claro px-4 py-2 font-bold text-alerta">⚠ {erro}</p>}
            <button type="submit" className="btn w-full py-3.5 text-lg" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
            <p className="text-sm text-muted">Não há cadastro público. Peça a sua conta à coordenação.</p>
          </form>
          <details className="mt-6 text-sm text-muted">
            <summary className="cursor-pointer font-bold">Contas de demonstração (escola fictícia)</summary>
            <p className="mt-2">Senha de todas: <code>demo1234</code></p>
            <ul className="mt-1 list-disc pl-5">
              <li>coordenacao@escola.exemplo</li>
              <li>beatriz@escola.exemplo (titular 2º A)</li>
              <li>debora@escola.exemplo (substituta 2º A)</li>
              <li>carlos@escola.exemplo (titular 2º B)</li>
              <li>ana.paula@escola.exemplo (1º A em 2025)</li>
            </ul>
          </details>
        </div>
      </main>
    </div>
  );
}
