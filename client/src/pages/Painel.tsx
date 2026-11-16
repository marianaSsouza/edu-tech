import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api, PainelTurma, RespostaTurmas } from '../api';
import { useUsuario } from '../App';
import { Carregando, ErroCaixa } from '../components/Estado';
import { IconeBusca } from '../components/Icones';
import { AgregadoOculto, textoReferencia } from '../components/Painel';
import { AvatarCrianca } from '../components/AvatarCrianca';
import PainelEscola from './PainelEscola';

type Aluno = PainelTurma['alunos'][number];
type Area = 'TODAS' | 'LP' | 'MAT';
const SIT = { DISPONIVEL: 'aberto', FECHADO: 'fechado', FUTURO: 'ainda não começou' } as const;
const ESCRITA = [
  { rotulo: 'Pré-silábico', cor: '#f08a24' },
  { rotulo: 'Silábico', cor: '#f6c344' },
  { rotulo: 'Silábico-alfabético', cor: '#5fc9a8' },
  { rotulo: 'Alfabético', cor: '#1f6fd6' },
];
const dm = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const razao = (n: number, d: number) => (d === 0 ? 0 : n / d);

/**
 * PRO-02 / PRO-07 — painel de desempenho de uma turma (professora: as suas; coordenação: todas + escola inteira).
 * Tudo vem do mesmo cálculo do servidor (domain/painel). Grupo com menos de 5 crianças: agregados ocultos,
 * só a lista individual aparece (D10).
 */
export default function Painel() {
  const { data: usuario } = useUsuario();
  const coord = usuario?.papel === 'COORDENACAO';
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState('');
  const [area, setArea] = useState<Area>('TODAS');

  const turmasQ = useQuery({ queryKey: ['turmas'], queryFn: () => api<RespostaTurmas>('/turmas') });
  const atual = turmasQ.data?.periodoAtual ?? null;
  const doAno = (turmasQ.data?.turmas ?? []).filter((t) => !atual || t.anoLetivo === atual.anoLetivo);
  const escolhida = params.get('turma') ?? (doAno[0] ? String(doAno[0].id) : coord ? 'escola' : '');
  const bimestre = params.get('bimestre') ?? '';
  const turmaInfo = turmasQ.data?.turmas.find((t) => String(t.id) === escolhida);

  const q = useQuery({
    queryKey: ['painel', 'turma', escolhida, bimestre, ''],
    queryFn: () => api<PainelTurma>(`/painel/turmas/${escolhida}?bimestre=${bimestre}&comparar=`),
    enabled: !!escolhida && escolhida !== 'escola',
  });
  const d = q.data;

  // consolidação de cada bimestre já iniciado (mesmo cálculo, um pedido por bimestre)
  const bims = (d?.periodos ?? []).filter((p) => p.situacao !== 'FUTURO').map((p) => p.bimestre);
  const porBim = useQueries({
    queries: bims.map((b) => ({
      queryKey: ['painel', 'turma', escolhida, String(b), ''],
      queryFn: () => api<PainelTurma>(`/painel/turmas/${escolhida}?bimestre=${b}&comparar=`),
      enabled: !!d && !d.oculto,
    })),
  });

  const mudar = (novo: Record<string, string>) => {
    const p = new URLSearchParams(params);
    Object.entries(novo).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p);
  };

  const situacaoSel = d?.periodos.find((p) => p.bimestre === d.referencia.bimestre)?.situacao;
  const professoras = turmaInfo?.professores?.map((p) => p.nome).join(' e ');

  return (
    <section>
      {usuario && <p className="text-muted">Olá, {usuario.nome}</p>}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Desempenho dos alunos</h1>
          {atual && (
            <p className="mt-2 text-lg text-muted">
              {atual.bimestre}º bimestre {atual.situacao === 'FECHADO' ? 'fechado' : `aberto até ${dm(atual.fim)}`} · ano letivo {atual.anoLetivo}
            </p>
          )}
        </div>
        {situacaoSel && (
          <span className={`chip px-4 py-2 text-base ${situacaoSel === 'DISPONIVEL' ? 'chip-menta' : 'chip-cinza'}`}>
            Período {SIT[situacaoSel]}
          </span>
        )}
      </div>

      {/* filtros */}
      <div className="card mt-6 grid gap-4 md:grid-cols-3 md:items-end xl:grid-cols-[1.2fr_0.8fr_1.1fr_auto]">
        <div>
          <label htmlFor="pesq" className="font-bold">Pesquisar</label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"><IconeBusca /></span>
            <input id="pesq" type="search" className="campo pl-11" placeholder="Aluno ou habilidade" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="turma" className="font-bold">Turma</label>
          <select id="turma" className="campo mt-2" value={escolhida} onChange={(e) => mudar({ turma: e.target.value })}>
            {coord && <option value="escola">Escola inteira</option>}
            {doAno.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </div>
        {escolhida !== 'escola' && <div>
          <label htmlFor="periodo" className="font-bold">Período</label>
          <select id="periodo" className="campo mt-2" value={d?.referencia.bimestre ?? bimestre} disabled={!d}
            onChange={(e) => mudar({ bimestre: e.target.value })}>
            {(d?.periodos ?? []).map((p) => <option key={p.bimestre} value={p.bimestre}>{p.bimestre}º bimestre ({SIT[p.situacao]})</option>)}
          </select>
        </div>}
        {escolhida !== 'escola' && <div role="group" aria-label="Área" className="flex flex-wrap gap-2 md:col-span-3 xl:col-span-1">
          {([['TODAS', 'Todas'], ['LP', 'Língua Portuguesa'], ['MAT', 'Matemática']] as const).map(([v, r]) => (
            <button key={v} type="button" className="pilula" aria-pressed={area === v} onClick={() => setArea(v)}>{r}</button>
          ))}
        </div>}
      </div>

      {turmasQ.isLoading && <Carregando />}
      {turmasQ.error && <ErroCaixa erro={turmasQ.error} tentarDeNovo={() => turmasQ.refetch()} />}
      {turmasQ.data && !escolhida && (
        <p className="card mt-6">Você não tem turmas vinculadas hoje. Se isso estiver errado, procure a coordenação.</p>
      )}

      {escolhida === 'escola' ? <div className="mt-6"><PainelEscola /></div> : (
        <>
          {q.isLoading && <div className="mt-6"><Carregando /></div>}
          {q.error && <div className="mt-6"><ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} /></div>}
          {d && <Conteudo d={d} busca={busca} area={area} professoras={professoras}
            serie={bims.map((b, i) => ({ b, dado: porBim[i]?.data, emCurso: d.periodos.find((p) => p.bimestre === b)?.situacao === 'DISPONIVEL' }))} />}
        </>
      )}
    </section>
  );
}

function Conteudo({ d, busca, area, professoras, serie }: {
  d: PainelTurma; busca: string; area: Area; professoras?: string;
  serie: Array<{ b: number; dado?: PainelTurma; emCurso: boolean }>;
}) {
  const termo = semAcento(busca.trim());
  if (d.referencia.situacao === 'FUTURO') return <p className="card mt-6">Este bimestre ainda não começou.</p>;
  if (d.N === 0) return <p className="card mt-6">Esta turma não tem alunos matriculados na data de referência.</p>;

  const i = d.indicadores;
  const nomeHab = new Map(d.habilidades.map((h) => [h.id, h]));
  const semAvaliacao = d.alunos.filter((a) => a.habilidadesAvaliadas === 0);
  const emAtencao = d.alunos.filter((a) => a.atencao.estado === 'EM_ATENCAO');
  const motivo = (m: 'LACUNAS' | 'ESCRITA' | 'MANUAL') => emAtencao.filter((a) => a.atencao.motivos.includes(m)).length;
  const textoMotivos = [
    motivo('LACUNAS') && `${motivo('LACUNAS')} por lacunas herdadas`,
    motivo('ESCRITA') && `${motivo('ESCRITA')} pela escrita`,
    motivo('MANUAL') && `${motivo('MANUAL')} com atenção manual`,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <p className="mt-3 text-sm text-muted">Referência: {textoReferencia(d.referencia)}</p>

      {/* números principais */}
      {d.oculto || !i ? (
        <div className="mt-4"><AgregadoOculto N={d.N} minimo={d.grupoMinimo} /></div>
      ) : (
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Numero titulo="Alunos acompanhados" valor={String(d.N)} sub={`${d.turma.nome}${professoras ? ` · ${professoras}` : ''}`} />
          <Numero titulo="Avaliações registradas" valor={String(i.pares.T - i.pares.U)} de={i.pares.T}
            sub={i.semAvaliacoes ? 'Nenhuma avaliação neste bimestre ainda' : undefined} barra={razao(i.pares.T - i.pares.U, i.pares.T)} />
          <Numero titulo="Em atenção" valor={String(i.emAtencao.n)} destaque sub={textoMotivos || 'Nenhuma criança em atenção'} />
          <Numero titulo="Sem avaliação" valor={String(semAvaliacao.length)}
            sub={semAvaliacao.length === 0 ? 'Todos têm algum registro' : `${semAvaliacao.slice(0, 3).map((a) => a.nome).join(', ')}${semAvaliacao.length > 3 ? '…' : ''} ainda sem registros`} />
        </dl>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* habilidades */}
        {!d.oculto && i && (
          <Habilidades porHabilidade={i.porHabilidade} nomeHab={nomeHab} area={area} termo={termo} />
        )}
        {/* alunos para acompanhar (individual: aparece mesmo com grupo pequeno) */}
        <Acompanhar alunos={d.alunos} turma={d.turma} termo={termo} />
      </div>

      {!d.oculto && i && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <PorBimestre serie={serie} turma={d.turma.nome} />
          <Escrita alunos={d.alunos} grupoMinimo={d.grupoMinimo} />
        </div>
      )}
    </>
  );
}

function Numero({ titulo, valor, de, sub, barra, destaque }: { titulo: string; valor: string; de?: number; sub?: string; barra?: number; destaque?: boolean }) {
  return (
    <div className="card">
      <dt className="font-bold text-muted">{titulo}</dt>
      <dd className={`mt-1 text-5xl font-extrabold ${destaque ? 'text-amarelo-texto' : ''}`}>
        {valor}{de !== undefined && <span className="text-2xl text-muted"> / {de}</span>}
      </dd>
      {barra !== undefined && (
        <dd className="barra-trilho mt-3" aria-hidden="true"><div className="barra-cheia" style={{ width: `${barra * 100}%` }} /></dd>
      )}
      {sub && <dd className="mt-2 text-sm text-muted">{sub}</dd>}
    </div>
  );
}

function Habilidades({ porHabilidade, nomeHab, area, termo }: {
  porHabilidade: NonNullable<PainelTurma['indicadores']>['porHabilidade'];
  nomeHab: Map<string, { id: string; area: string; texto: string }>; area: Area; termo: string;
}) {
  const [todas, setTodas] = useState(false);
  const lista = porHabilidade
    .map((h) => ({ ...h, info: nomeHab.get(h.skillId) }))
    .filter((h) => area === 'TODAS' || h.info?.area === area)
    .filter((h) => !termo || semAcento(`${h.skillId} ${h.info?.texto ?? ''}`).includes(termo))
    .sort((a, b) => razao(a.consolidacao.n, a.consolidacao.d) - razao(b.consolidacao.n, b.consolidacao.d) || a.skillId.localeCompare(b.skillId));
  const visiveis = todas ? lista : lista.slice(0, 6);

  return (
    <article className="card">
      <h2 className="text-2xl font-extrabold">Habilidades com menos consolidação</h2>
      <p className="text-sm text-muted">% de alunos com "Consolidada" neste bimestre. "Sem avaliação" conta no total e não vira nota baixa.</p>
      {lista.length === 0 && <p className="mt-4 text-muted">Nenhuma habilidade com esse filtro.</p>}
      <ul className="mt-3 divide-y divide-line">
        {visiveis.map((h) => {
          const r = razao(h.consolidacao.n, h.consolidacao.d);
          return (
            <li key={h.skillId} className="py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0">
                  <span className={`chip mr-2 px-2 py-0.5 text-xs ${h.info?.area === 'MAT' ? 'chip-amarelo' : 'chip-lilas'}`}>{h.info?.area ?? '—'}</span>
                  <b>{h.info?.texto ?? h.skillId}</b> <span className="text-sm text-muted">{h.skillId}</span>
                </p>
                <span className="shrink-0 text-lg font-extrabold">{h.consolidacao.percentual ?? 'Sem dados'}</span>
              </div>
              <div className="barra-trilho mt-2" role="img" aria-label={`${h.consolidacao.n} de ${h.consolidacao.d} consolidadas; ${h.U} sem avaliação`}>
                <div className={r < 0.5 ? 'barra-baixa' : 'barra-cheia'} style={{ width: `${r * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{h.C} consolidadas · {h.D} em desenvolvimento · {h.NC} não consolidadas · {h.U} sem avaliação</p>
            </li>
          );
        })}
      </ul>
      {lista.length > 6 && (
        <button type="button" className="mt-2 font-bold text-azul-escuro underline" onClick={() => setTodas((v) => !v)}>
          {todas ? 'Mostrar só as 6 primeiras' : `Ver todas as ${lista.length}`}
        </button>
      )}
    </article>
  );
}

function Acompanhar({ alunos, turma, termo }: { alunos: Aluno[]; turma: PainelTurma['turma']; termo: string }) {
  const [mais, setMais] = useState(false);
  const lista = alunos
    .filter((a) => a.atencao.estado === 'EM_ATENCAO' || a.habilidadesAvaliadas === 0)
    .filter((a) => !termo || semAcento(a.nome).includes(termo))
    .sort((a, b) => Number(b.atencao.estado === 'EM_ATENCAO') - Number(a.atencao.estado === 'EM_ATENCAO') || a.nome.localeCompare(b.nome, 'pt-BR'));

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-2xl font-extrabold">Alunos para acompanhar</h2>
        <Link to={`/turmas/${turma.id}?ano=${turma.anoLetivo}`} className="font-bold">Ver todos</Link>
      </div>
      <p className="text-sm text-muted">Em atenção ou ainda sem nenhuma avaliação no bimestre (são coisas diferentes).</p>
      {lista.length === 0 && <p className="mt-4 text-muted">Ninguém em atenção ou sem avaliação{termo ? ' com esse nome' : ''}. 🎉</p>}
      <ul className="mt-3 divide-y divide-line">
        {(mais ? lista : lista.slice(0, 6)).map((a) => (
          <li key={a.id} className="flex items-center gap-4 py-3">
            <AvatarCrianca nome={a.nome} tamanho={64} />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold">{a.nome}</p>
              <p className="text-sm text-muted">{turma.nome} · {a.habilidadesAvaliadas} de {a.habilidadesPrevistas} habilidades</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {a.atencao.motivos.includes('LACUNAS') && <span className="chip chip-amarelo px-2.5 py-0.5">Lacunas herdadas: {a.lacunas.total}</span>}
                {a.atencao.motivos.includes('ESCRITA') && <span className="chip chip-amarelo px-2.5 py-0.5">Escrita abaixo do esperado</span>}
                {a.atencao.motivos.includes('MANUAL') && <span className="chip chip-amarelo px-2.5 py-0.5">Atenção manual</span>}
                {a.habilidadesAvaliadas === 0 && <span className="chip chip-lilas px-2.5 py-0.5">Sem avaliação</span>}
              </div>
            </div>
            <Link to={`/alunos/${a.id}`} className="btn-sec px-5">Abrir<span className="sr-only"> a ficha de {a.nome}</span></Link>
          </li>
        ))}
      </ul>
      {lista.length > 6 && (
        <button type="button" className="mt-2 font-bold text-azul-escuro underline" onClick={() => setMais((v) => !v)}>
          {mais ? 'Mostrar menos' : `Ver mais ${lista.length - 6}`}
        </button>
      )}
    </article>
  );
}

function PorBimestre({ serie, turma }: { serie: Array<{ b: number; dado?: PainelTurma; emCurso: boolean }>; turma: string }) {
  const n = serie[0]?.dado?.habilidades.length;
  return (
    <article className="card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-2xl font-extrabold">Consolidação por bimestre</h2>
        <span className="text-sm text-muted">{turma}{n ? ` · ${n} habilidades` : ''}</span>
      </div>
      <div className="mt-6 flex h-60 items-end gap-4 border-b-2 border-line px-2 sm:gap-8" role="list">
        {serie.map(({ b, dado, emCurso }) => {
          const i = dado?.indicadores;
          const vazio = !!i && i.pares.U === i.pares.T; // nenhum registro: não é 0% de desempenho
          const f = vazio ? undefined : i?.consolidacao;
          const r = f ? razao(f.n, f.d) : 0;
          return (
            <div key={b} role="listitem" className="flex h-full flex-1 flex-col items-center justify-end"
              aria-label={`${b}º bimestre: ${vazio ? 'sem registros' : f ? (f.percentual ?? 'sem dados') : dado?.oculto ? 'oculto' : 'carregando'}`}>
              <span className={`mb-1 text-center ${vazio ? 'text-sm text-muted' : 'font-extrabold'}`}>{vazio ? 'Sem registros' : f ? (f.percentual ?? 'Sem dados') : dado?.oculto ? '🔒' : '…'}</span>
              <div className="w-full max-w-24 rounded-t-2xl"
                style={{
                  height: `${Math.max(r * 100, f ? 2 : 0)}%`,
                  backgroundImage: emCurso
                    ? 'repeating-linear-gradient(135deg, #1f6fd6 0 10px, #5b95e6 10px 18px)'
                    : 'linear-gradient(180deg, #1f6fd6, #17a589)',
                }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-4 px-2 sm:gap-8">
        {serie.map(({ b, emCurso }) => (
          <span key={b} className="flex-1 text-center text-sm font-bold text-muted">{b}º bim.{emCurso && <span className="block font-normal">(em curso)</span>}</span>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">Respostas "Consolidada" sobre todas as previstas no bimestre. Bimestre em curso aparece listrado: ainda pode mudar. "Sem registros" não é 0%: ninguém avaliou ainda.</p>
    </article>
  );
}

function Escrita({ alunos, grupoMinimo }: { alunos: Aluno[]; grupoMinimo: number }) {
  const cont = ESCRITA.map((_, nivel) => alunos.filter((a) => a.escrita === nivel).length);
  const semRegistro = alunos.filter((a) => a.escrita === null).length;
  const total = alunos.length;
  return (
    <article className="card">
      <h2 className="text-2xl font-extrabold">Escrita · níveis da turma</h2>
      <div className="mt-5 flex h-4 gap-1 overflow-hidden rounded-full" role="img"
        aria-label={ESCRITA.map((e, k) => `${e.rotulo}: ${cont[k]}`).join('; ') + `; sem registro: ${semRegistro}`}>
        {cont.map((c, k) => c > 0 && <div key={k} style={{ width: `${(100 * c) / total}%`, background: ESCRITA[k].cor }} className="rounded-full" />)}
        {semRegistro > 0 && <div style={{ width: `${(100 * semRegistro) / total}%` }} className="rounded-full bg-[repeating-linear-gradient(45deg,#e4e0d6_0_4px,#f5f3ee_4px_8px)]" />}
      </div>
      <ul className="mt-4 space-y-2">
        {ESCRITA.map((e, k) => (
          <li key={e.rotulo} className="flex items-center justify-between">
            <span className="flex items-center gap-3"><span aria-hidden="true" className="h-4 w-4 rounded" style={{ background: e.cor }} />{e.rotulo}</span>
            <b>{cont[k]} {cont[k] === 1 ? 'aluno' : 'alunos'}</b>
          </li>
        ))}
        <li className="flex items-center justify-between text-muted">
          <span className="flex items-center gap-3"><span aria-hidden="true" className="h-4 w-4 rounded border border-line bg-[repeating-linear-gradient(45deg,#e4e0d6_0_3px,#fff_3px_6px)]" />Sem registro no bimestre</span>
          <b>{semRegistro} {semRegistro === 1 ? 'aluno' : 'alunos'}</b>
        </li>
      </ul>
      <p className="mt-4 text-sm text-muted">Turmas com menos de {grupoMinimo} alunos têm os agregados ocultos.</p>
    </article>
  );
}
