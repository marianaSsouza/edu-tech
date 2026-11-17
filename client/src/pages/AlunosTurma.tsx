import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api, PainelTurma } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';
import { AgregadoOculto, Cartoes, textoReferencia } from '../components/Painel';
import { Migalhas, Progresso, Titulo } from '../components/ui';
import { AvatarCrianca } from '../components/AvatarCrianca';

type Aluno = PainelTurma['alunos'][number];
type Filtro = 'TODOS' | 'ATENCAO' | 'SEM_AVALIACAO';
const SIT = { DISPONIVEL: 'aberto', FECHADO: 'fechado', FUTURO: 'ainda não começou' };
const NOMES_BIM = ['1º', '2º', '3º', '4º'];

/** Um selo por aluno: atenção tem prioridade; senão, a situação do preenchimento no bimestre. */
export function Selo({ a }: { a: Aluno }) {
  if (a.atencao.estado === 'EM_ATENCAO') {
    const m = a.atencao.motivos;
    const texto = m.length > 1 ? `Em atenção: ${m.length} motivos`
      : m[0] === 'LACUNAS' ? `Lacunas herdadas: ${a.lacunas.total}`
      : m[0] === 'ESCRITA' ? 'Escrita abaixo do esperado' : 'Atenção manual';
    return <span className="chip chip-amarelo">⚑ {texto}</span>;
  }
  if (a.habilidadesAvaliadas === 0) return <span className="chip chip-amarelo">Sem avaliação</span>;
  if (a.habilidadesAvaliadas === a.habilidadesPrevistas) return <span className="chip chip-menta">✓ Completa</span>;
  return <span className="chip chip-lilas">Em andamento</span>;
}

/** PRO-02: turma — busca, filtro de bimestre e situação, lista alfabética e, abaixo, os indicadores do bimestre. */
export default function AlunosTurma() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const bimestre = params.get('bimestre') ?? '';
  const comparar = params.get('comparar') ?? '';
  const q = useQuery({
    queryKey: ['painel', 'turma', id, bimestre, comparar],
    queryFn: () => api<PainelTurma>(`/painel/turmas/${id}?bimestre=${bimestre}&comparar=${comparar}`),
  });
  const d = q.data;
  const nomeHab = (id: string) => d?.habilidades.find((h) => h.id === id)?.texto ?? id;

  const alunos = (d?.alunos ?? []).filter((a) => {
    if (busca.trim() && !a.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))) return false;
    if (filtro === 'ATENCAO') return a.atencao.estado === 'EM_ATENCAO';
    if (filtro === 'SEM_AVALIACAO') return a.habilidadesAvaliadas === 0;
    return true;
  });

  return (
    <section>
      <Migalhas itens={[{ rotulo: 'Turmas', para: '/' }, { rotulo: d?.turma.nome ?? '…' }]} />
      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {d && (
        <>
          <Titulo titulo={d.turma.nome} sub={`${d.N} ${d.N === 1 ? 'aluno' : 'alunos'} · ${d.turma.etapa}º ano · ${d.turma.anoLetivo}`} />

          {/* filtros */}
          <div className="card mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
            <div>
              <label htmlFor="busca" className="font-bold">Buscar aluno</label>
              <input id="busca" type="search" className="campo mt-2" placeholder="Nome do aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div>
              <label htmlFor="bim" className="font-bold">Bimestre</label>
              <select id="bim" className="campo mt-2" value={d.referencia.bimestre}
                onChange={(e) => setParams({ ano: String(d.turma.anoLetivo), bimestre: e.target.value })}>
                {d.periodos.map((p) => <option key={p.bimestre} value={p.bimestre}>{NOMES_BIM[p.bimestre - 1]} bimestre ({SIT[p.situacao]})</option>)}
              </select>
            </div>
            <div role="group" aria-label="Mostrar" className="flex flex-wrap gap-2">
              {([['TODOS', 'Todos'], ['ATENCAO', 'Em atenção'], ['SEM_AVALIACAO', 'Sem avaliação']] as const).map(([v, r]) => (
                <button key={v} type="button" aria-pressed={filtro === v} onClick={() => setFiltro(v)}
                  className={filtro === v ? 'btn rounded-full px-5' : 'rounded-full border-2 border-line bg-white px-5 py-2 font-bold hover:border-azul/60'}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted">Referência: {textoReferencia(d.referencia)}</p>

          {/* lista */}
          {d.referencia.situacao === 'FUTURO' ? <p className="card mt-4">Este bimestre ainda não começou.</p>
            : d.alunos.length === 0 ? <p className="card mt-4">Esta turma não tem alunos matriculados na data de referência.</p>
            : (
              <ul className="card mt-4 divide-y divide-line py-2" aria-label="Alunos em ordem alfabética">
                {alunos.length === 0 && <li className="py-6 text-center text-muted">Nenhum aluno com esse filtro.</li>}
                {alunos.map((a) => (
                  <li key={a.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 py-4 md:grid-cols-[auto_minmax(0,1.2fr)_minmax(0,1fr)_15rem_auto]">
                    <AvatarCrianca nome={a.nome} tamanho={52} />
                    <div className="min-w-0">
                      <Link to={`/alunos/${a.id}`} state={{ voltar: location.pathname + location.search }} className="text-lg font-bold text-ink no-underline hover:underline">
                        {a.nome}
                      </Link>
                      <p className="text-sm text-muted">{a.habilidadesAvaliadas} de {a.habilidadesPrevistas} habilidades</p>
                    </div>
                    <div className="col-span-3 md:col-span-1">
                      <Progresso n={a.habilidadesAvaliadas} d={a.habilidadesPrevistas} rotulo={`${a.nome}: ${a.habilidadesAvaliadas} de ${a.habilidadesPrevistas} habilidades avaliadas`} />
                    </div>
                    <div className="col-span-2 md:col-span-1"><Selo a={a} /></div>
                    <Link to={`/alunos/${a.id}/avaliacao?ano=${d.turma.anoLetivo}&bimestre=${d.referencia.bimestre}`} className="btn-sec justify-self-end px-5">
                      Abrir<span className="sr-only"> a avaliação de {a.nome}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          <p className="mt-2 text-xs text-muted">Clique no nome para ver a ficha (histórico, lacunas e atenção). "Abrir" leva à avaliação do bimestre.</p>

          {/* indicadores */}
          {d.referencia.situacao !== 'FUTURO' && d.N > 0 && (
            <div className="card mt-6">
              <h2 className="text-2xl font-extrabold">Indicadores do {d.referencia.bimestre}º bimestre</h2>
              {d.oculto || !d.indicadores ? <div className="mt-3"><AgregadoOculto N={d.N} minimo={d.grupoMinimo} /></div> : (
                <>
                  <Cartoes i={d.indicadores} />
                  {d.evolucao && <EvolucaoEscrita ev={d.evolucao} onComparar={(c) => setParams({ ano: String(d.turma.anoLetivo), bimestre: String(d.referencia.bimestre), comparar: String(c) })} />}
                  <details className="mt-4">
                    <summary className="cursor-pointer font-bold">Lacunas herdadas por habilidade ({d.indicadores.lacunasPorHabilidade.length})</summary>
                    {d.indicadores.lacunasPorHabilidade.length === 0 ? <p className="mt-1 text-sm text-muted">Nenhuma lacuna herdada pendente.</p> : (
                      <table className="mt-2 w-full text-left text-sm">
                        <thead><tr className="border-b border-line text-muted"><th className="py-1">Habilidade</th><th>Crianças</th><th>Por ausência de avaliação</th></tr></thead>
                        <tbody>
                          {d.indicadores.lacunasPorHabilidade.map((l) => (
                            <tr key={l.skillId} className="border-b border-line">
                              <td className="py-1 font-bold">{nomeHab(l.skillId)}</td><td>{l.fracao.n} de {l.fracao.d} ({l.fracao.percentual})</td><td>{l.porAusencia}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </details>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-bold">Consolidação por habilidade</summary>
                    <table className="mt-2 w-full text-left text-sm">
                      <thead><tr className="border-b border-line text-muted"><th className="py-1">Habilidade</th><th>Consolidada</th><th>Em desenv.</th><th>Não consol.</th><th>Sem avaliação</th></tr></thead>
                      <tbody>
                        {d.indicadores.porHabilidade.map((h) => (
                          <tr key={h.skillId} className="border-b border-line">
                            <td className="py-1 font-bold">{nomeHab(h.skillId)}</td>
                            <td>{h.C} ({h.consolidacao.percentual ?? 'Sem dados'})</td><td>{h.D}</td><td>{h.NC}</td><td>{h.U}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

/** Tarefa 8.2: E de V avaliáveis e N − V sem comparação; ausência nunca vira zero (CR-11, CR-20). */
function EvolucaoEscrita({ ev, onComparar }: { ev: NonNullable<PainelTurma['evolucao']>; onComparar: (a: number) => void }) {
  return (
    <div className="mt-5 rounded-2xl border border-line p-4">
      <h3 className="font-extrabold">Evolução da escrita</h3>
      {ev.mensagem ? <p className="mt-1 text-sm text-muted">{ev.mensagem}</p> : (
        <>
          <label className="mt-1 block text-sm">
            Comparar o {NOMES_BIM[ev.b - 1]} bimestre com o{' '}
            <select className="rounded-xl border-2 border-line px-2 py-1" value={ev.a} onChange={(e) => onComparar(Number(e.target.value))}>
              {Array.from({ length: ev.b - 1 }, (_, i) => i + 1).map((x) => <option key={x} value={x}>{NOMES_BIM[x - 1]} bimestre</option>)}
            </select>
          </label>
          <p className="mt-2 text-lg font-extrabold">
            {ev.E} de {ev.V} avaliáveis avançaram {ev.fracao?.percentual ? `(${ev.fracao.percentual})` : '(Sem dados)'}
          </p>
          <p className="text-xs text-muted">
            {ev.semComparacao} sem comparação (sem escrita em um dos dois bimestres). Nível igual ou menor não conta como avanço; ausência não vira zero.
          </p>
        </>
      )}
    </div>
  );
}
