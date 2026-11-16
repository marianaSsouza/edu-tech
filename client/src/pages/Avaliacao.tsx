import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useBlocker, useParams, useSearchParams } from 'react-router-dom';
import { api, AvaliacaoDto, ErroApi, Observacao, Situacao } from '../api';
import { useUsuario } from '../App';
import { Carregando, ErroCaixa } from '../components/Estado';

const NIVEIS_HAB = [
  { v: 0, rotulo: 'Não consolidada', simbolo: '○' },
  { v: 1, rotulo: 'Em desenvolvimento', simbolo: '◐' },
  { v: 2, rotulo: 'Consolidada', simbolo: '●' },
];
const NIVEIS_ESCRITA = ['Pré-silábico', 'Silábico', 'Silábico-alfabético', 'Alfabético'].map((rotulo, v) => ({ v, rotulo, simbolo: `${v + 1}` }));
const SITUACAO: Record<Situacao, string> = { DISPONIVEL: 'Aberto', FECHADO: 'Fechado', FUTURO: 'Ainda não começou' };
const ESCRITA = '__escrita';
const caracteres = (t: string) => Array.from(t).length;

interface Pendente { nivel: number; justificativa: string }
interface Falha { rotulo: string; mensagem: string; status: number }

export default function Avaliacao() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const ano = params.get('ano') ?? '';
  const bimestre = params.get('bimestre') ?? '';
  const q = useQuery({
    queryKey: ['avaliacao', id, ano, bimestre],
    queryFn: () => api<AvaliacaoDto>(`/alunos/${id}/avaliacao?ano=${ano}&bimestre=${bimestre}`),
  });

  return (
    <section>
      <Link to={q.data?.contexto.turma ? `/turmas/${q.data.contexto.turma.id}` : '/'} className="text-sm">← Alunos da turma</Link>
      {q.isLoading && <Carregando texto="Carregando a avaliação…" />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {q.data && (
        <Formulario
          // remonta (zera alterações locais) ao trocar de aluno, ano ou bimestre
          key={`${id}-${q.data.contexto.anoLetivo}-${q.data.periodo.bimestre}`}
          dados={q.data}
          recarregar={() => q.refetch()}
          irPara={(a, b) => setParams({ ano: String(a), bimestre: String(b) })}
        />
      )}
    </section>
  );
}

function Formulario({ dados, recarregar, irPara }: {
  dados: AvaliacaoDto; recarregar: () => Promise<unknown>; irPara: (ano: number, bim: number) => void;
}) {
  const { data: usuario } = useUsuario();
  const qc = useQueryClient();
  const [pendentes, setPendentes] = useState<Record<string, Pendente>>({});
  const [novaObs, setNovaObs] = useState('');
  const [edicoes, setEdicoes] = useState<Record<number, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: 'salvo' | 'erro'; texto: string; falhas?: Falha[] } | null>(null);

  const { contexto, periodo, permissao } = dados;
  const pode = permissao.podeEditar;
  const coord = usuario?.papel === 'COORDENACAO';
  const sujo = Object.keys(pendentes).length > 0 || novaObs.trim() !== '' || Object.keys(edicoes).length > 0;

  // ---- aviso ao sair com alterações não salvas (navegação interna e fechar/recarregar a aba) ----
  const blocker = useBlocker(({ currentLocation, nextLocation }) => sujo && currentLocation.search + currentLocation.pathname !== nextLocation.search + nextLocation.pathname);
  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    if (window.confirm('Há alterações não salvas nesta avaliação. Sair mesmo assim e perder as alterações?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
  useEffect(() => {
    if (!sujo) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [sujo]);

  const respostaDe = (chave: string) => (chave === ESCRITA ? dados.escrita : dados.habilidades.find((h) => h.id === chave)?.resposta ?? null);

  const escolher = (chave: string, nivel: number) => {
    setAviso(null);
    setPendentes((p) => {
      const atual = respostaDe(chave);
      const novo = { ...p };
      if (atual && atual.nivel === nivel) delete novo[chave]; // voltou ao valor salvo: não há alteração
      else novo[chave] = { nivel, justificativa: p[chave]?.justificativa ?? '' };
      return novo;
    });
  };

  // ---- completude e limite de observações ----
  const respondidas = dados.habilidades.filter((h) => (pendentes[h.id]?.nivel ?? h.resposta?.nivel) !== undefined).length;
  const usadoObs = useMemo(() => {
    const vigentes = dados.observacoes.reduce((s, o) => s + caracteres(edicoes[o.id] ?? o.texto), 0);
    return vigentes + caracteres(novaObs.trim());
  }, [dados.observacoes, edicoes, novaObs]);
  const max = dados.limiteObservacoes.max;

  // ---- salvar: só confirma quando TODAS as chamadas persistirem ----
  const salvar = async () => {
    const semJustificativa = Object.entries(pendentes).filter(([chave, p]) => respostaDe(chave) && !p.justificativa.trim());
    if (semJustificativa.length) {
      setAviso({ tipo: 'erro', texto: 'Para corrigir uma resposta já salva, preencha a justificativa da correção.' });
      return;
    }
    if (usadoObs > max) {
      setAviso({ tipo: 'erro', texto: `As observações somam ${usadoObs} caracteres; o limite é ${max}. Encurte o texto.` });
      return;
    }
    setSalvando(true);
    setAviso(null);
    const falhas: Falha[] = [];
    const restantes = { ...pendentes };
    const restEdicoes = { ...edicoes };
    let restNova = novaObs;
    const tentar = async (rotulo: string, fn: () => Promise<unknown>, ok: () => void) => {
      try { await fn(); ok(); } catch (e) {
        const err = e as ErroApi;
        falhas.push({ rotulo, mensagem: err.message, status: err.status });
      }
    };

    for (const [chave, p] of Object.entries(pendentes)) {
      const atual = respostaDe(chave);
      const body = {
        bimestre: periodo.bimestre, nivel: p.nivel,
        ...(atual ? { version: atual.version, justificativa: p.justificativa.trim() } : {}),
      };
      const rotulo = chave === ESCRITA ? 'Escrita' : chave;
      const caminho = chave === ESCRITA ? `/contextos/${contexto.id}/escrita` : `/contextos/${contexto.id}/habilidades/${chave}`;
      await tentar(rotulo, () => api(caminho, { method: 'PUT', body }), () => delete restantes[chave]);
    }
    for (const [obsId, texto] of Object.entries(edicoes)) {
      const o = dados.observacoes.find((x) => x.id === Number(obsId))!;
      await tentar('Observação corrigida', () => api(`/observacoes/${obsId}`, { method: 'PUT', body: { texto, version: o.version } }),
        () => delete restEdicoes[Number(obsId)]);
    }
    if (novaObs.trim()) {
      await tentar('Nova observação', () => api(`/contextos/${contexto.id}/observacoes`, {
        method: 'POST', body: { bimestre: periodo.bimestre, texto: novaObs },
      }), () => { restNova = ''; });
    }

    // Mantém só o que falhou e relê do servidor (D09: reconsultar após mutação).
    setPendentes(restantes);
    setEdicoes(restEdicoes);
    setNovaObs(restNova);
    await recarregar();
    qc.invalidateQueries({ queryKey: ['turma'] });
    setSalvando(false);
    if (!falhas.length) {
      setAviso({ tipo: 'salvo', texto: 'Tudo salvo. Os registros foram gravados.' });
    } else {
      const conflito = falhas.some((f) => f.status === 409);
      setAviso({
        tipo: 'erro',
        texto: conflito
          ? 'Alguém alterou esta avaliação enquanto você editava. A tela foi atualizada; confira e salve de novo o que ficou pendente.'
          : 'Algumas alterações não foram salvas. Elas continuam marcadas na tela.',
        falhas,
      });
    }
  };

  return (
    <div className="mt-2 pb-24">
      {/* ---- cabeçalho: distingue etapa escolar de ano letivo (spec "Troca de bimestre") ---- */}
      <h1 className="text-2xl font-extrabold">{dados.aluno.nome}</h1>
      <p className="text-muted">
        {contexto.etapa}º ano (etapa escolar) · ano letivo {contexto.anoLetivo}
        {contexto.turma && ` · turma ${contexto.turma.nome}`} · catálogo {contexto.catalogo}
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm font-bold">
          Ano letivo
          <select className="campo mt-1 block w-auto" value={contexto.anoLetivo}
            onChange={(e) => {
              const c = dados.contextosDisponiveis.find((x) => x.anoLetivo === Number(e.target.value))!;
              irPara(c.anoLetivo, 1);
            }}>
            {dados.contextosDisponiveis.map((c) => (
              <option key={c.id} value={c.anoLetivo}>{c.anoLetivo} · {c.etapa}º ano</option>
            ))}
          </select>
        </label>
        <nav aria-label="Bimestres" className="flex flex-wrap gap-2">
          {dados.periodos.map((p) => {
            const atual = p.bimestre === periodo.bimestre;
            return (
              <button key={p.bimestre} type="button" aria-current={atual ? 'page' : undefined}
                onClick={() => irPara(contexto.anoLetivo, p.bimestre)}
                className={`rounded-xl border px-3 py-1.5 text-left text-sm ${atual ? 'border-brand bg-brand-soft font-extrabold' : 'border-line bg-white'}`}>
                {atual && '▸ '}{p.bimestre}º bimestre
                <span className="block text-xs text-muted">{p.situacao === 'FECHADO' ? '🔒 ' : ''}{SITUACAO[p.situacao]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ---- estado do período / permissão ---- */}
      {!pode && (
        <p className="mt-4 rounded-lg border border-line bg-white px-3 py-2" role="note">
          {coord ? '👁 Modo consulta: a coordenação vê os registros, mas não edita conteúdo pedagógico.'
            : periodo.situacao === 'FECHADO' ? '🔒 Este bimestre está fechado. Somente consulta.'
            : periodo.situacao === 'FUTURO' ? '⏳ Este bimestre ainda não começou; não aceita registros.'
            : `ℹ ${permissao.motivo ?? 'Somente consulta.'}`}
        </p>
      )}

      <p className="mt-4 font-bold" aria-live="polite">
        Completude: {respondidas} de {dados.habilidades.length} habilidades avaliadas
        {' · '}escrita: {(pendentes[ESCRITA]?.nivel ?? dados.escrita?.nivel) !== undefined ? 'avaliada' : 'sem avaliação'}
      </p>

      {/* ---- habilidades ---- */}
      <h2 className="mt-6 text-lg font-extrabold">Habilidades</h2>
      <div className="mt-2 space-y-3">
        {dados.habilidades.map((h) => (
          <CampoNivel key={h.id} nome={`hab-${h.id}`} titulo={<><b>{h.id}</b> · {h.texto}</>} dica={h.exemplo}
            opcoes={NIVEIS_HAB} resposta={h.resposta} pendente={pendentes[h.id]} usuarioId={usuario?.id}
            podeEditar={pode && !salvando}
            onEscolher={(n) => escolher(h.id, n)}
            onJustificar={(t) => setPendentes((p) => ({ ...p, [h.id]: { ...p[h.id], justificativa: t } }))} />
        ))}
      </div>

      {/* ---- escrita ---- */}
      <h2 className="mt-6 text-lg font-extrabold">Escrita</h2>
      <div className="mt-2">
        <CampoNivel nome="escrita" titulo={<b>Nível de escrita</b>} opcoes={NIVEIS_ESCRITA}
          resposta={dados.escrita} pendente={pendentes[ESCRITA]} usuarioId={usuario?.id} podeEditar={pode && !salvando}
          onEscolher={(n) => escolher(ESCRITA, n)}
          onJustificar={(t) => setPendentes((p) => ({ ...p, [ESCRITA]: { ...p[ESCRITA], justificativa: t } }))} />
      </div>

      {/* ---- observações ---- */}
      <h2 className="mt-6 text-lg font-extrabold">Observações</h2>
      <p className="text-sm text-muted">
        Cada professora tem a sua observação. Limite somado do bimestre: <b className={usadoObs > max ? 'text-warn' : ''}>{usadoObs}</b> de {max} caracteres
        {usadoObs > max && ' — acima do limite'}.
      </p>
      <div className="mt-2 space-y-3">
        {dados.observacoes.length === 0 && !pode && <p className="card text-muted">Nenhuma observação neste bimestre.</p>}
        {dados.observacoes.map((o) => (
          <ObservacaoItem key={o.id} o={o} podeEditar={pode && o.minha && !salvando} edicao={edicoes[o.id]}
            onEditar={(t) => setEdicoes((e) => {
              const n = { ...e };
              if (t === undefined || t === o.texto) delete n[o.id]; else n[o.id] = t;
              return n;
            })} />
        ))}
        {pode && (
          <div className="card">
            <label htmlFor="nova-obs" className="font-bold">Nova observação (opcional)</label>
            <textarea id="nova-obs" rows={3} className="campo mt-1" value={novaObs} disabled={salvando}
              onChange={(e) => { setAviso(null); setNovaObs(e.target.value); }} />
          </div>
        )}
      </div>

      {/* ---- barra de salvar ---- */}
      {pode && (
        <div className="fixed inset-x-0 bottom-0 border-t border-line bg-white">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-3 px-4 py-3">
            <button type="button" className="btn" onClick={salvar} disabled={!sujo || salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
            <span className="text-sm text-muted">{sujo ? '✎ Há alterações não salvas' : 'Nenhuma alteração pendente'}</span>
          </div>
        </div>
      )}
      <div aria-live="assertive" className="mt-4">
        {aviso?.tipo === 'salvo' && <p className="rounded-lg bg-brand-soft px-3 py-2 font-bold text-brand">✔ {aviso.texto}</p>}
        {aviso?.tipo === 'erro' && (
          <div role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-warn">
            <p className="font-bold">⚠ {aviso.texto}</p>
            {aviso.falhas && (
              <ul className="mt-1 list-disc pl-5 text-sm">
                {aviso.falhas.map((f, i) => <li key={i}><b>{f.rotulo}:</b> {f.mensagem}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Um campo de nível: fieldset + legend + rádios (teclado nativo); estado também em texto, não só cor. */
function CampoNivel({ nome, titulo, dica, opcoes, resposta, pendente, usuarioId, podeEditar, onEscolher, onJustificar }: {
  nome: string; titulo: React.ReactNode; dica?: string;
  opcoes: Array<{ v: number; rotulo: string; simbolo: string }>;
  resposta: AvaliacaoDto['escrita']; pendente?: Pendente; usuarioId?: number; podeEditar: boolean;
  onEscolher: (n: number) => void; onJustificar: (t: string) => void;
}) {
  const alheia = !!resposta && resposta.autorId !== usuarioId;
  const desabilitado = !podeEditar || alheia;
  const valor = pendente?.nivel ?? resposta?.nivel ?? null;
  const estado = pendente
    ? '✎ Alteração não salva'
    : valor === null ? '— Sem avaliação'
    : alheia ? `Registrado por ${resposta!.autorNome}` : 'Registrado por você';

  return (
    <fieldset className={`card ${pendente ? 'border-brand' : ''}`}>
      <legend className="float-left w-full">{titulo}</legend>
      {dica && <p className="clear-left text-sm text-muted">Ex.: {dica}</p>}
      <div className="clear-left mt-2 flex flex-wrap gap-2">
        {opcoes.map((o) => (
          <label key={o.v}
            className={`flex items-center gap-2 rounded-xl border border-line px-3 py-1.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:font-extrabold ${desabilitado ? 'opacity-70' : 'cursor-pointer'}`}>
            <input type="radio" name={nome} checked={valor === o.v} disabled={desabilitado}
              onChange={() => onEscolher(o.v)} />
            <span aria-hidden="true">{o.simbolo}</span> {o.rotulo}
          </label>
        ))}
      </div>
      <p className="mt-1 text-xs font-bold text-muted">{estado}</p>
      {alheia && podeEditar && (
        <p className="text-xs text-muted">Só a autora corrige esta resposta. Se discordar, registre uma observação própria.</p>
      )}
      {pendente && resposta && !alheia && (
        <div className="mt-2">
          <label className="text-sm font-bold" htmlFor={`just-${nome}`}>Justificativa da correção (obrigatória)</label>
          <input id={`just-${nome}`} className="campo mt-1" value={pendente.justificativa} required
            onChange={(e) => onJustificar(e.target.value)} />
        </div>
      )}
    </fieldset>
  );
}

function ObservacaoItem({ o, podeEditar, edicao, onEditar }: {
  o: Observacao; podeEditar: boolean; edicao?: string; onEditar: (t: string | undefined) => void;
}) {
  const [abrir, setAbrir] = useState(false);
  return (
    <div className="card">
      <p className="text-sm font-bold text-muted">{o.minha ? 'Sua observação' : o.autorNome}</p>
      {abrir && podeEditar ? (
        <>
          <label className="sr-only" htmlFor={`obs-${o.id}`}>Corrigir sua observação</label>
          <textarea id={`obs-${o.id}`} rows={3} className="campo mt-1" value={edicao ?? o.texto}
            onChange={(e) => onEditar(e.target.value)} />
          <button type="button" className="btn-sec mt-2 text-sm" onClick={() => { onEditar(undefined); setAbrir(false); }}>
            Desfazer correção
          </button>
        </>
      ) : (
        <>
          <p className="mt-1 whitespace-pre-wrap">{o.texto}</p>
          {podeEditar && <button type="button" className="btn-sec mt-2 text-sm" onClick={() => setAbrir(true)}>Corrigir</button>}
        </>
      )}
    </div>
  );
}
