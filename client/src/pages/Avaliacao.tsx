import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useBlocker, useParams, useSearchParams } from 'react-router-dom';
import { api, AvaliacaoDto, ErroApi, Observacao, Situacao } from '../api';
import { useUsuario } from '../App';
import { Carregando, ErroCaixa } from '../components/Estado';
import { Migalhas, Titulo } from '../components/ui';

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
    qc.invalidateQueries({ queryKey: ['painel'] });
    qc.invalidateQueries({ queryKey: ['ficha'] }); // CA-08.6: atenção e histórico refletem o que foi salvo
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

  const nAlteracoes = Object.keys(pendentes).length + (novaObs.trim() ? 1 : 0) + Object.keys(edicoes).length;
  const escritaValor = pendentes[ESCRITA]?.nivel ?? dados.escrita?.nivel;
  const situacaoChip =
    periodo.situacao === 'FECHADO' ? <span className="chip chip-cinza">🔒 Período fechado</span>
    : periodo.situacao === 'FUTURO' ? <span className="chip chip-cinza">Ainda não começou</span>
    : <span className="chip chip-menta">Período aberto</span>;

  return (
    <div className="pb-6">
      <Migalhas itens={[
        { rotulo: 'Turmas', para: '/' },
        ...(contexto.turma ? [{ rotulo: contexto.turma.nome, para: `/turmas/${contexto.turma.id}?ano=${contexto.anoLetivo}&bimestre=${periodo.bimestre}` }] : []),
        { rotulo: dados.aluno.nome },
      ]} />

      {/* cabeçalho: distingue etapa escolar de ano letivo (spec "Troca de bimestre") */}
      <Titulo avatar={dados.aluno.nome} titulo={dados.aluno.nome}
        sub={`${contexto.etapa}º ano${contexto.turma ? ` · ${contexto.turma.nome}` : ''} · ${contexto.anoLetivo} · catálogo ${contexto.catalogo}`}
        acoes={<>
          {situacaoChip}
          <Link to={`/alunos/${dados.aluno.id}`} className="btn-sec">Ficha e histórico</Link>
        </>} />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {dados.contextosDisponiveis.length > 1 && (
          <label className="flex items-center gap-2 font-bold">
            <span className="sr-only">Ano letivo</span>
            <select className="campo w-auto py-2" value={contexto.anoLetivo} aria-label="Ano letivo"
              onChange={(e) => irPara(Number(e.target.value), 1)}>
              {dados.contextosDisponiveis.map((c) => <option key={c.id} value={c.anoLetivo}>{c.anoLetivo} · {c.etapa}º ano</option>)}
            </select>
          </label>
        )}
        <nav aria-label="Bimestres" className="flex flex-wrap gap-2">
          {dados.periodos.map((p) => (
            <button key={p.bimestre} type="button" className="aba" aria-current={p.bimestre === periodo.bimestre ? 'page' : undefined}
              onClick={() => irPara(contexto.anoLetivo, p.bimestre)}>
              {p.bimestre}º · {SITUACAO[p.situacao]}
            </button>
          ))}
        </nav>
      </div>

      {!pode && (
        <p className="mt-4 rounded-2xl border border-line bg-white/80 px-4 py-3" role="note">
          {coord ? '👁 Modo consulta: a coordenação vê os registros, mas não edita conteúdo pedagógico.'
            : periodo.situacao === 'FECHADO' ? '🔒 Este bimestre está fechado. Somente consulta.'
            : periodo.situacao === 'FUTURO' ? '⏳ Este bimestre ainda não começou; não aceita registros.'
            : `ℹ ${permissao.motivo ?? 'Somente consulta.'}`}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ---- habilidades ---- */}
        <section className="card" aria-labelledby="t-hab">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <h2 id="t-hab" className="text-2xl font-extrabold">Habilidades</h2>
            <span className="chip chip-amarelo" aria-live="polite">{respondidas} de {dados.habilidades.length} avaliadas</span>
          </div>
          <div className="divide-y divide-line">
            {dados.habilidades.map((h) => (
              <CampoNivel key={h.id} nome={`hab-${h.id}`}
                titulo={<><span className={`chip mr-2 align-middle ${h.area === 'MAT' ? 'chip-amarelo' : 'chip-lilas'}`}>{h.area}</span>
                  <span className="align-middle text-lg font-bold">{h.texto}</span> <span className="align-middle text-sm text-muted">{h.id}</span></>}
                dica={h.exemplo} opcoes={NIVEIS_HAB} resposta={h.resposta} pendente={pendentes[h.id]} usuarioId={usuario?.id}
                podeEditar={pode && !salvando}
                onEscolher={(n) => escolher(h.id, n)}
                onJustificar={(t) => setPendentes((p) => ({ ...p, [h.id]: { ...p[h.id], justificativa: t } }))} />
            ))}
          </div>
        </section>

        <div className="space-y-6">
          {/* ---- escrita ---- */}
          <section className="card" aria-labelledby="t-esc">
            <h2 id="t-esc" className="text-2xl font-extrabold">Escrita</h2>
            <CampoNivel nome="escrita" vertical
              titulo={<span className="font-bold text-muted">Nível neste bimestre · {escritaValor === undefined ? 'Sem avaliação' : NIVEIS_ESCRITA[escritaValor].rotulo}</span>}
              opcoes={NIVEIS_ESCRITA} resposta={dados.escrita} pendente={pendentes[ESCRITA]} usuarioId={usuario?.id} podeEditar={pode && !salvando}
              onEscolher={(n) => escolher(ESCRITA, n)}
              onJustificar={(t) => setPendentes((p) => ({ ...p, [ESCRITA]: { ...p[ESCRITA], justificativa: t } }))} />
          </section>

          {/* ---- observações ---- */}
          <section className="card" aria-labelledby="t-obs">
            <h2 id="t-obs" className="text-2xl font-extrabold">Observações</h2>
            <div className="mt-3 space-y-3">
              {dados.observacoes.length === 0 && !pode && <p className="text-muted">Nenhuma observação neste bimestre.</p>}
              {dados.observacoes.map((o) => (
                <ObservacaoItem key={o.id} o={o} podeEditar={pode && o.minha && !salvando} edicao={edicoes[o.id]}
                  onEditar={(t) => setEdicoes((e) => {
                    const n = { ...e };
                    if (t === undefined || t === o.texto) delete n[o.id]; else n[o.id] = t;
                    return n;
                  })} />
              ))}
              {pode && (
                <div>
                  <label htmlFor="nova-obs" className="font-bold">{dados.observacoes.some((o) => o.minha) ? 'Nova observação' : 'Sua observação'}</label>
                  <textarea id="nova-obs" rows={4} className="campo mt-2" placeholder="Opcional" value={novaObs} disabled={salvando}
                    onChange={(e) => { setAviso(null); setNovaObs(e.target.value); }} />
                </div>
              )}
              <p className={`text-sm ${usadoObs > max ? 'font-bold text-alerta' : 'text-muted'}`}>
                {usadoObs.toLocaleString('pt-BR')} de {max.toLocaleString('pt-BR')} caracteres, somados entre as autoras{usadoObs > max && ' — acima do limite'}
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ---- barra de salvar ---- */}
      {pode && (
        <div className="card sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 py-4">
          <div aria-live="polite">
            {sujo ? <span className="chip chip-amarelo">{nAlteracoes} {nAlteracoes === 1 ? 'alteração não salva' : 'alterações não salvas'}</span>
              : aviso?.tipo === 'salvo' ? <span className="chip chip-menta">✔ {aviso.texto}</span>
              : <span className="text-sm text-muted">Nenhuma alteração pendente</span>}
          </div>
          <button type="button" className="btn px-8 py-3 text-lg" onClick={salvar} disabled={!sujo || salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      )}
      {aviso?.tipo === 'erro' && (
        <div role="alert" className="mt-4 rounded-2xl bg-alerta-claro px-4 py-3 text-alerta">
          <p className="font-bold">⚠ {aviso.texto}</p>
          {aviso.falhas && (
            <ul className="mt-1 list-disc pl-5 text-sm">
              {aviso.falhas.map((f, i) => <li key={i}><b>{f.rotulo}:</b> {f.mensagem}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** Um campo de nível: fieldset + legend + rádios (teclado nativo); estado também em texto, não só cor. */
function CampoNivel({ nome, titulo, dica, opcoes, resposta, pendente, usuarioId, podeEditar, onEscolher, onJustificar, vertical }: {
  nome: string; titulo: React.ReactNode; dica?: string;
  opcoes: Array<{ v: number; rotulo: string; simbolo: string }>;
  resposta: AvaliacaoDto['escrita']; pendente?: Pendente; usuarioId?: number; podeEditar: boolean;
  onEscolher: (n: number) => void; onJustificar: (t: string) => void; vertical?: boolean;
}) {
  const alheia = !!resposta && resposta.autorId !== usuarioId;
  const desabilitado = !podeEditar || alheia;
  const valor = pendente?.nivel ?? resposta?.nivel ?? null;
  const estado = pendente
    ? '✎ Alteração não salva'
    : valor === null ? 'Sem avaliação'
    : alheia ? `Registrado por ${resposta!.autorNome} · só ela pode corrigir.${podeEditar ? ' Você pode acrescentar uma observação.' : ''}`
    : `Registrado por ${resposta!.autorNome}${podeEditar ? ' · corrigir exige justificativa' : ''}`;

  return (
    <fieldset className="py-5 first:pt-4 last:pb-1">
      <legend className="float-left w-full">{titulo}</legend>
      {dica && <p className="clear-left mt-1 text-sm text-muted">Ex.: {dica}</p>}
      <div className={`clear-left mt-3 ${vertical ? 'grid gap-3' : 'flex flex-wrap gap-3'}`}>
        {opcoes.map((o) => (
          <label key={o.v} className="opcao">
            <input type="radio" name={nome} checked={valor === o.v} disabled={desabilitado} onChange={() => onEscolher(o.v)} />
            {o.rotulo}
          </label>
        ))}
      </div>
      {!(vertical && valor === null && !pendente) && (
        <p className={`mt-2 text-sm ${pendente ? 'font-bold text-azul-escuro' : 'text-muted'}`}>{estado}</p>
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
    <div className="rounded-2xl border border-line p-3">
      {abrir && podeEditar ? (
        <>
          <label className="font-bold" htmlFor={`obs-${o.id}`}>Corrigir a sua observação</label>
          <textarea id={`obs-${o.id}`} rows={3} className="campo mt-2" value={edicao ?? o.texto}
            onChange={(e) => onEditar(e.target.value)} />
          <button type="button" className="btn-sec mt-2 text-sm" onClick={() => { onEditar(undefined); setAbrir(false); }}>
            Desfazer correção
          </button>
        </>
      ) : (
        <>
          <p><b className="text-muted">{o.minha ? 'Você' : o.autorNome}:</b> <span className="whitespace-pre-wrap">{o.texto}</span></p>
          {podeEditar && <button type="button" className="mt-2 text-sm font-bold text-azul-escuro underline" onClick={() => setAbrir(true)}>Corrigir</button>}
        </>
      )}
    </div>
  );
}
