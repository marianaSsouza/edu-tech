import { FormEvent, ReactNode, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, ErroApi } from '../api';
import { useUsuario } from '../App';
import { Carregando, ErroCaixa } from '../components/Estado';
import { Titulo } from '../components/ui';

interface Resumo {
  hoje: string; anoAtual: number;
  turmas: Array<{
    id: number; nome: string; etapa: number; anoLetivo: number; alunosHoje: number; vazia: boolean;
    vinculos: Array<{ id: number; userId: number; nome: string; tipo: 'TITULAR' | 'SUBSTITUTA'; de: string; ate: string | null; situacao: 'VIGENTE' | 'FUTURO' | 'ENCERRADO' }>;
  }>;
  usuarios: Array<{ id: number; nome: string; email: string; papel: 'PROFESSOR' | 'COORDENACAO'; ativo: boolean }>;
  alunos: Array<{ id: number; nome: string; arquivado: boolean; turmaAtual: { id: number; nome: string } | null }>;
}
type Aba = 'alunos' | 'turmas' | 'contas';

const br = (d: string) => d.split('-').reverse().join('/');
const SIT = { VIGENTE: ['Vigente', 'chip-menta'], FUTURO: ['Começa depois', 'chip-lilas'], ENCERRADO: ['Encerrado', 'chip-cinza'] } as const;

/** Envia e devolve a mensagem de erro (ou null); recarrega a gestão e as telas que dependem dela. */
function useEnviar() {
  const qc = useQueryClient();
  return async <T,>(caminho: string, body: unknown): Promise<{ ok: true; dados: T } | { ok: false; erro: ErroApi }> => {
    try {
      const dados = await api<T>(caminho, { method: 'POST', body });
      qc.invalidateQueries();
      return { ok: true, dados };
    } catch (e) {
      return { ok: false, erro: e as ErroApi };
    }
  };
}

/**
 * Tarefa 7.1 / PRO-08 — gestão da escola (só coordenação, CA-12.4): alunos, turmas com vínculos e contas.
 * Nada com histórico é apagado: aluno é arquivado, conta é desativada, vínculo é encerrado.
 */
export default function Gestao() {
  const { data: usuario } = useUsuario();
  const [aba, setAba] = useState<Aba>('alunos');
  const q = useQuery({ queryKey: ['gestao'], queryFn: () => api<Resumo>('/gestao'), enabled: usuario?.papel === 'COORDENACAO' });

  if (usuario && usuario.papel !== 'COORDENACAO') {
    return <ErroCaixa erro={{ status: 403, message: 'A gestão da escola é exclusiva da coordenação.' }} />;
  }

  return (
    <section>
      <Titulo titulo="Gestão da escola" sub="Cadastre alunos, turmas e contas, e defina quem dá aula em cada turma. Nada com histórico é apagado." />
      <nav aria-label="Seções" className="mt-6 flex flex-wrap gap-2">
        {([['alunos', 'Alunos'], ['turmas', 'Turmas e vínculos'], ['contas', 'Contas']] as const).map(([v, r]) => (
          <button key={v} type="button" className="aba px-5 py-2.5" aria-current={aba === v ? 'page' : undefined} onClick={() => setAba(v)}>{r}</button>
        ))}
      </nav>
      {q.isLoading && <div className="mt-6"><Carregando /></div>}
      {q.error && <div className="mt-6"><ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} /></div>}
      {q.data && (
        <div className="mt-6">
          {aba === 'alunos' && <AbaAlunos r={q.data} />}
          {aba === 'turmas' && <AbaTurmas r={q.data} />}
          {aba === 'contas' && <AbaContas r={q.data} meuId={usuario?.id} />}
        </div>
      )}
    </section>
  );
}

function Aviso({ tipo, children }: { tipo: 'erro' | 'ok'; children: ReactNode }) {
  return (
    <div role={tipo === 'erro' ? 'alert' : 'status'}
      className={`mt-3 rounded-2xl px-4 py-3 ${tipo === 'erro' ? 'bg-alerta-claro text-alerta' : 'bg-menta text-menta-texto'}`}>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------ alunos

type Parecido = { id: number; nome: string; turma: string | null; arquivado: boolean };

function AbaAlunos({ r }: { r: Resumo }) {
  const enviar = useEnviar();
  const turmasDoAno = r.turmas.filter((t) => t.anoLetivo === r.anoAtual);
  const deOutroAno = r.turmas.filter((t) => t.anoLetivo > r.anoAtual);
  const [nome, setNome] = useState('');
  const [turmaId, setTurmaId] = useState<number | ''>(turmasDoAno[0]?.id ?? '');
  const [parecidos, setParecidos] = useState<Parecido[] | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null);
  const [busca, setBusca] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cadastrar = async (confirmarDuplicidade: boolean) => {
    setEnviando(true);
    setMsg(null);
    const res = await enviar<{ nome: string; turma: { nome: string } }>('/gestao/alunos', { nome, turmaId, confirmarDuplicidade });
    setEnviando(false);
    if (res.ok) {
      setMsg({ tipo: 'ok', texto: `${res.dados.nome} foi cadastrado(a) e matriculado(a) no ${res.dados.turma.nome} a partir de hoje.` });
      setNome('');
      setParecidos(null);
    } else if (res.erro.codigo === 'POSSIVEL_DUPLICIDADE') {
      setParecidos((res.erro.detalhes.parecidos as Parecido[]) ?? []);
    } else {
      setMsg({ tipo: 'erro', texto: res.erro.message });
    }
  };

  const arquivar = async (a: Resumo['alunos'][number]) => {
    if (!window.confirm(`Arquivar ${a.nome}? A matrícula atual é encerrada hoje. Avaliações e histórico continuam guardados e consultáveis pela coordenação.`)) return;
    const res = await enviar('/gestao/alunos/' + a.id + '/arquivar', {});
    setMsg(res.ok ? { tipo: 'ok', texto: `${a.nome} foi arquivado(a). O histórico continua disponível na ficha.` } : { tipo: 'erro', texto: res.erro.message });
  };

  const lista = r.alunos.filter((a) => !busca.trim() || a.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <article className="card h-fit">
        <h2 className="text-2xl font-extrabold">Novo aluno</h2>
        <p className="mt-1 text-sm text-muted">Só nome e turma. Não pedimos CPF, endereço, foto, saúde ou laudos.</p>
        <form className="mt-4 space-y-4" onSubmit={(e: FormEvent) => { e.preventDefault(); cadastrar(false); }}>
          <div>
            <label htmlFor="g-nome" className="font-bold">Nome de exibição</label>
            <input id="g-nome" className="campo mt-2" maxLength={80} value={nome} onChange={(e) => { setNome(e.target.value); setParecidos(null); }} />
          </div>
          <div>
            <label htmlFor="g-turma" className="font-bold">Turma ({r.anoAtual})</label>
            <select id="g-turma" className="campo mt-2" value={turmaId} onChange={(e) => { setTurmaId(Number(e.target.value)); setParecidos(null); }}>
              {turmasDoAno.map((t) => <option key={t.id} value={t.id}>{t.nome} · {t.etapa}º ano</option>)}
            </select>
          </div>
          {deOutroAno.length > 0 && (
            <p className="rounded-2xl bg-lilas px-4 py-2 text-sm text-lilas-texto">
              {deOutroAno.map((t) => `${t.nome} (${t.anoLetivo})`).join(', ')} não {deOutroAno.length === 1 ? 'aparece' : 'aparecem'} aqui:
              aluno novo entra só em turma de {r.anoAtual}. Turmas do próximo ano recebem alunos na passagem de ano.
              Se foi engano, em <b>Turmas e vínculos</b> cancele os vínculos que ainda não começaram, exclua a turma e crie de novo com o ano {r.anoAtual}.
            </p>
          )}
          {!parecidos && <button type="submit" className="btn w-full py-3" disabled={enviando || !nome.trim() || !turmaId}>Cadastrar aluno</button>}
        </form>

        {parecidos && (
          <div role="alert" className="mt-4 rounded-2xl border-2 border-amarelo bg-[#fff8e1] p-4">
            <p className="font-extrabold">⚠ Possível duplicidade</p>
            <p className="mt-1 text-sm">Já existe aluno com nome parecido. Confira se não é a mesma criança. Os cadastros <b>nunca são juntados</b> automaticamente.</p>
            <ul className="mt-2 space-y-1 text-sm">
              {parecidos.map((p) => (
                <li key={p.id}>
                  <Link to={`/alunos/${p.id}`} className="font-bold">{p.nome}</Link>
                  <span className="text-muted"> · {p.turma ?? 'sem matrícula hoje'}{p.arquivado ? ' · arquivado' : ''}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn px-4 py-2 text-sm" disabled={enviando} onClick={() => cadastrar(true)}>É outra criança: cadastrar mesmo assim</button>
              <button type="button" className="btn-sec px-4 py-2 text-sm" onClick={() => setParecidos(null)}>Cancelar</button>
            </div>
          </div>
        )}
        {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      </article>

      <article className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-extrabold">Alunos ({r.alunos.length})</h2>
          <label className="w-full sm:w-64">
            <span className="sr-only">Buscar aluno</span>
            <input type="search" className="campo" placeholder="Buscar aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </label>
        </div>
        <ul className="mt-3 divide-y divide-line">
          {lista.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <Link to={`/alunos/${a.id}`} className="text-lg font-bold">{a.nome}</Link>
                <p className="text-sm text-muted">{a.turmaAtual ? `Matrícula atual: ${a.turmaAtual.nome}` : 'Sem matrícula hoje'}</p>
              </div>
              {a.arquivado ? <span className="chip chip-cinza">Arquivado</span>
                : <button type="button" className="btn-sec px-4 py-1.5 text-sm" onClick={() => arquivar(a)}>Arquivar</button>}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

// ------------------------------------------------------------------ turmas e vínculos

function AbaTurmas({ r }: { r: Resumo }) {
  const enviar = useEnviar();
  const [nome, setNome] = useState('');
  const [etapa, setEtapa] = useState(1);
  const [ano, setAno] = useState(r.anoAtual);
  const [msg, setMsg] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null);
  const anos = [...new Set(r.turmas.map((t) => t.anoLetivo))].sort((a, b) => b - a);

  const criar = async (e: FormEvent) => {
    e.preventDefault();
    const res = await enviar<{ nome: string }>('/gestao/turmas', { nome, etapa, anoLetivo: ano });
    setMsg(res.ok ? { tipo: 'ok', texto: `Turma ${res.dados.nome} criada. Agora vincule a professora titular.` } : { tipo: 'erro', texto: res.erro.message });
    if (res.ok) setNome('');
  };

  return (
    <div className="space-y-6">
      <article className="card">
        <h2 className="text-2xl font-extrabold">Nova turma</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" onSubmit={criar}>
          <div>
            <label htmlFor="t-nome" className="font-bold">Nome</label>
            <input id="t-nome" className="campo mt-2" placeholder="Ex.: 3º C" maxLength={20} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div>
            <label htmlFor="t-etapa" className="font-bold">Ano escolar</label>
            <select id="t-etapa" className="campo mt-2" value={etapa} onChange={(e) => setEtapa(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}º ano</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="t-ano" className="font-bold">Ano letivo</label>
            <select id="t-ano" className="campo mt-2" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              <option value={r.anoAtual}>{r.anoAtual}</option>
              <option value={r.anoAtual + 1}>{r.anoAtual + 1} (próximo ano)</option>
            </select>
          </div>
          <button type="submit" className="btn py-3" disabled={!nome.trim()}>Criar turma</button>
        </form>
        {ano > r.anoAtual && (
          <p className="mt-3 rounded-2xl bg-[#fff8e1] px-4 py-2 text-sm">
            ⚠ Turma de <b>{ano}</b>: ela só recebe alunos quando o ano letivo {ano} começar (passagem de ano). Para matricular alunos agora, escolha {r.anoAtual}.
          </p>
        )}
        {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      </article>

      {anos.map((a) => (
        <section key={a}>
          <h2 className="text-xl font-extrabold">{a}</h2>
          <div className="mt-3 grid gap-6 lg:grid-cols-2">
            {r.turmas.filter((t) => t.anoLetivo === a).map((t) => <CartaoTurma key={t.id} t={t} r={r} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function CartaoTurma({ t, r }: { t: Resumo['turmas'][number]; r: Resumo }) {
  const enviar = useEnviar();
  const professoras = r.usuarios.filter((u) => u.papel === 'PROFESSOR' && u.ativo);
  const inicioPadrao = t.anoLetivo === r.anoAtual ? r.hoje : `${t.anoLetivo}-02-01`;
  const [aberto, setAberto] = useState(false);
  const [userId, setUserId] = useState<number | ''>(professoras[0]?.id ?? '');
  const [tipo, setTipo] = useState<'TITULAR' | 'SUBSTITUTA'>(t.vinculos.some((v) => v.tipo === 'TITULAR' && v.situacao !== 'ENCERRADO') ? 'SUBSTITUTA' : 'TITULAR');
  const [de, setDe] = useState(inicioPadrao);
  const [ate, setAte] = useState('');
  const [encerrando, setEncerrando] = useState<number | null>(null);
  const [fim, setFim] = useState(r.hoje);
  const [msg, setMsg] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null);

  const excluir = async () => {
    if (!window.confirm(`Excluir a turma ${t.nome} (${t.anoLetivo})? Ela está vazia: sem alunos e sem professoras.`)) return;
    const res = await enviar(`/gestao/turmas/${t.id}/excluir`, {});
    if (!res.ok) setMsg({ tipo: 'erro', texto: res.erro.message });
  };
  const cancelar = async (v: Resumo['turmas'][number]['vinculos'][number]) => {
    if (!window.confirm(`Cancelar o vínculo de ${v.nome}? Ele ainda não começou, então nada registrado é perdido.`)) return;
    const res = await enviar(`/gestao/vinculos/${v.id}/cancelar`, {});
    setMsg(res.ok ? { tipo: 'ok', texto: `Vínculo de ${v.nome} cancelado.` } : { tipo: 'erro', texto: res.erro.message });
  };
  const vincular = async (e: FormEvent) => {
    e.preventDefault();
    const res = await enviar('/gestao/vinculos', { classId: t.id, userId, tipo, de, ate: ate || null });
    setMsg(res.ok ? { tipo: 'ok', texto: 'Vínculo criado.' } : { tipo: 'erro', texto: res.erro.message });
    if (res.ok) setAberto(false);
  };
  const encerrar = async (id: number) => {
    const res = await enviar(`/gestao/vinculos/${id}/encerrar`, { ate: fim });
    setMsg(res.ok ? { tipo: 'ok', texto: `Vínculo encerrado em ${br(fim)}. A autoria do que ela registrou continua.` } : { tipo: 'erro', texto: res.erro.message });
    if (res.ok) setEncerrando(null);
  };

  return (
    <article className="card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-2xl font-extrabold">{t.nome}</h3>
          <p className="text-muted">{t.etapa}º ano · {t.anoLetivo} · {t.alunosHoje} {t.alunosHoje === 1 ? 'aluno matriculado hoje' : 'alunos matriculados hoje'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.vazia && <button type="button" className="btn-sec px-4 py-1.5 text-sm" onClick={excluir}>Excluir turma vazia</button>}
          <Link to={`/turmas/${t.id}?ano=${t.anoLetivo}`} className="btn-sec px-4 py-1.5 text-sm">Abrir turma</Link>
        </div>
      </div>

      <h4 className="mt-4 font-extrabold">Professoras</h4>
      {t.vinculos.length === 0 && <p className="mt-1 text-sm text-muted">Nenhuma professora vinculada.</p>}
      <ul className="mt-2 space-y-2">
        {t.vinculos.map((v) => (
          <li key={v.id} className="rounded-2xl border border-line p-3">
            <div className="flex flex-wrap items-center gap-2">
              <b>{v.nome}</b>
              <span className={`chip ${v.tipo === 'TITULAR' ? 'chip-lilas' : 'chip-amarelo'}`}>{v.tipo === 'TITULAR' ? 'Titular' : 'Substituta'}</span>
              <span className={`chip ${SIT[v.situacao][1]}`}>{SIT[v.situacao][0]}</span>
            </div>
            <p className="mt-1 text-sm text-muted">De {br(v.de)} {v.ate ? `até ${br(v.ate)}` : 'sem data de fim'}</p>
            {v.situacao === 'FUTURO' && (
              <button type="button" className="btn-sec mt-2 px-3 py-1 text-sm" onClick={() => cancelar(v)}>Cancelar vínculo</button>
            )}
            {v.situacao === 'VIGENTE' && (encerrando === v.id ? (
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="text-sm font-bold">Último dia
                  <input type="date" className="campo mt-1 py-1.5" min={v.de} value={fim} onChange={(e) => setFim(e.target.value)} />
                </label>
                <button type="button" className="btn px-4 py-2 text-sm" onClick={() => encerrar(v.id)}>Confirmar encerramento</button>
                <button type="button" className="btn-sec px-4 py-2 text-sm" onClick={() => setEncerrando(null)}>Cancelar</button>
              </div>
            ) : (
              <button type="button" className="btn-sec mt-2 px-3 py-1 text-sm" onClick={() => { setEncerrando(v.id); setFim(r.hoje < v.de ? v.de : r.hoje); }}>Encerrar vínculo</button>
            ))}
          </li>
        ))}
      </ul>

      {aberto ? (
        <form className="mt-4 space-y-3 rounded-2xl bg-bg p-4" onSubmit={vincular}>
          <div>
            <label htmlFor={`v-prof-${t.id}`} className="font-bold">Professora</label>
            <select id={`v-prof-${t.id}`} className="campo mt-1" value={userId} onChange={(e) => setUserId(Number(e.target.value))}>
              {professoras.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <fieldset>
            <legend className="font-bold">Tipo de vínculo</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {(['TITULAR', 'SUBSTITUTA'] as const).map((x) => (
                <label key={x} className="opcao py-2"><input type="radio" name={`tipo-${t.id}`} checked={tipo === x} onChange={() => setTipo(x)} />{x === 'TITULAR' ? 'Titular' : 'Substituta'}</label>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">Só uma titular por vez. A substituta convive com a titular durante a vigência das duas.</p>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="font-bold">Início<input type="date" className="campo mt-1" value={de} onChange={(e) => setDe(e.target.value)} /></label>
            <label className="font-bold">Fim (opcional)<input type="date" className="campo mt-1" min={de} value={ate} onChange={(e) => setAte(e.target.value)} /></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn px-4 py-2" disabled={!userId || !de}>Criar vínculo</button>
            <button type="button" className="btn-sec px-4 py-2" onClick={() => setAberto(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-sec mt-4 px-4 py-2" onClick={() => { setAberto(true); setMsg(null); }}>+ Vincular professora</button>
      )}
      {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
    </article>
  );
}

// ------------------------------------------------------------------ contas

function AbaContas({ r, meuId }: { r: Resumo; meuId?: number }) {
  const enviar = useEnviar();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [papel, setPapel] = useState<'PROFESSOR' | 'COORDENACAO'>('PROFESSOR');
  const [msg, setMsg] = useState<{ tipo: 'erro' | 'ok'; texto: ReactNode } | null>(null);

  const mostrarSenha = (quem: string, senha: string) => setMsg({
    tipo: 'ok',
    texto: <>Senha temporária de <b>{quem}</b>: <code className="rounded bg-white px-2 py-0.5 text-lg font-extrabold text-ink">{senha}</code><br />
      <span className="text-sm">Anote e entregue à pessoa: ela <b>não aparece de novo</b>. O sistema guarda só uma versão embaralhada (hash).</span></>,
  });

  const criar = async (e: FormEvent) => {
    e.preventDefault();
    const res = await enviar<{ nome: string; senhaTemporaria: string }>('/gestao/contas', { nome, email, papel });
    if (res.ok) { mostrarSenha(res.dados.nome, res.dados.senhaTemporaria); setNome(''); setEmail(''); } else setMsg({ tipo: 'erro', texto: res.erro.message });
  };
  const alternar = async (u: Resumo['usuarios'][number]) => {
    if (u.ativo && !window.confirm(`Desativar a conta de ${u.nome}? Ela sai do sistema na hora. Nada do que registrou é apagado.`)) return;
    const res = await enviar(`/gestao/contas/${u.id}/${u.ativo ? 'desativar' : 'reativar'}`, {});
    setMsg(res.ok ? { tipo: 'ok', texto: `Conta de ${u.nome} ${u.ativo ? 'desativada' : 'reativada'}.` } : { tipo: 'erro', texto: res.erro.message });
  };
  const novaSenha = async (u: Resumo['usuarios'][number]) => {
    if (!window.confirm(`Gerar uma nova senha para ${u.nome}? A senha atual deixa de funcionar.`)) return;
    const res = await enviar<{ senhaTemporaria: string }>(`/gestao/contas/${u.id}/nova-senha`, {});
    if (res.ok) mostrarSenha(u.nome, res.dados.senhaTemporaria); else setMsg({ tipo: 'erro', texto: res.erro.message });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <article className="card h-fit">
        <h2 className="text-2xl font-extrabold">Nova conta</h2>
        <p className="mt-1 text-sm text-muted">Não há cadastro público: só a coordenação cria contas. Cada pessoa tem a sua.</p>
        <form className="mt-4 space-y-4" onSubmit={criar}>
          <label className="block font-bold">Nome<input className="campo mt-2" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} /></label>
          <label className="block font-bold">E-mail<input type="email" className="campo mt-2" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label className="block font-bold">Papel
            <select className="campo mt-2" value={papel} onChange={(e) => setPapel(e.target.value as 'PROFESSOR' | 'COORDENACAO')}>
              <option value="PROFESSOR">Professora</option>
              <option value="COORDENACAO">Coordenação</option>
            </select>
          </label>
          <button type="submit" className="btn w-full py-3" disabled={!nome.trim() || !email.trim()}>Criar conta</button>
        </form>
        {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}
      </article>

      <article className="card">
        <h2 className="text-2xl font-extrabold">Contas ({r.usuarios.length})</h2>
        <ul className="mt-3 divide-y divide-line">
          {r.usuarios.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{u.nome}{u.id === meuId && <span className="ml-2 text-sm text-muted">(você)</span>}</p>
                <p className="text-sm text-muted">{u.email} · {u.papel === 'COORDENACAO' ? 'Coordenação' : 'Professora'}</p>
              </div>
              <span className={`chip ${u.ativo ? 'chip-menta' : 'chip-cinza'}`}>{u.ativo ? 'Ativa' : 'Desativada'}</span>
              <button type="button" className="btn-sec px-3 py-1.5 text-sm" onClick={() => novaSenha(u)}>Nova senha</button>
              {u.id !== meuId && (
                <button type="button" className="btn-sec px-3 py-1.5 text-sm" onClick={() => alternar(u)}>{u.ativo ? 'Desativar' : 'Reativar'}</button>
              )}
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
