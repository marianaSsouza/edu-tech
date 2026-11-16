import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { api, PainelTurma } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';
import { AgregadoOculto, Cartoes, SeletorBimestre, textoReferencia } from '../components/Painel';

const ESCRITA = ['Pré-silábico', 'Silábico', 'Silábico-alfabético', 'Alfabético'];
const MOTIVO = { LACUNAS: 'lacunas', ESCRITA: 'escrita', MANUAL: 'manual' };

/** PRO-02: painel da turma — indicadores do bimestre (ou oculto) e lista alfabética sem ranking. */
export default function AlunosTurma() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const bimestre = params.get('bimestre') ?? '';
  const q = useQuery({
    queryKey: ['painel', 'turma', id, bimestre],
    queryFn: () => api<PainelTurma>(`/painel/turmas/${id}?bimestre=${bimestre}`),
  });
  const d = q.data;
  const voltar = `/?ano=${d?.turma.anoLetivo ?? ''}&bimestre=${d?.referencia.bimestre ?? ''}`;

  return (
    <section>
      <Link to={voltar} className="text-sm">← Turmas</Link>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {d && (
        <>
          <h1 className="mt-2 text-2xl font-extrabold">
            {d.turma.nome} <span className="text-base font-semibold text-muted">· {d.turma.etapa}º ano · ano letivo {d.turma.anoLetivo} · {d.N} {d.N === 1 ? 'criança' : 'crianças'}</span>
          </h1>
          <div className="mt-3">
            <SeletorBimestre periodos={d.periodos} atual={d.referencia.bimestre}
              onEscolher={(b) => setParams({ ano: String(d.turma.anoLetivo), bimestre: String(b) })} />
          </div>
          <p className="mt-2 text-sm text-muted">Referência: {textoReferencia(d.referencia)}</p>

          {d.referencia.situacao !== 'FUTURO' && d.N > 0 && (
            <div className="card mt-4">
              <h2 className="text-lg font-extrabold">Indicadores do bimestre</h2>
              {d.oculto || !d.indicadores ? <div className="mt-2"><AgregadoOculto N={d.N} minimo={d.grupoMinimo} /></div> : (
                <>
                  <Cartoes i={d.indicadores} />
                  <details className="mt-4">
                    <summary className="cursor-pointer font-bold">Lacunas herdadas por habilidade ({d.indicadores.lacunasPorHabilidade.length})</summary>
                    {d.indicadores.lacunasPorHabilidade.length === 0 ? <p className="mt-1 text-sm text-muted">Nenhuma lacuna herdada pendente.</p> : (
                      <table className="mt-2 w-full text-left text-sm">
                        <thead><tr className="border-b border-line text-muted"><th className="py-1">Habilidade</th><th>Crianças</th><th>Por ausência de avaliação</th></tr></thead>
                        <tbody>
                          {d.indicadores.lacunasPorHabilidade.map((l) => (
                            <tr key={l.skillId} className="border-b border-line">
                              <td className="py-1 font-bold">{l.skillId}</td><td>{l.fracao.n} de {l.fracao.d} ({l.fracao.percentual})</td><td>{l.porAusencia}</td>
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
                            <td className="py-1 font-bold">{h.skillId}</td>
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

          <h2 className="mt-6 text-lg font-extrabold">Alunos (ordem alfabética)</h2>
          {d.referencia.situacao === 'FUTURO' ? <p className="card mt-2">Este bimestre ainda não começou.</p>
            : d.alunos.length === 0 ? <p className="card mt-2">Esta turma não tem alunos matriculados na data de referência.</p> : (
            <ul className="card mt-2 divide-y divide-line p-0">
              {d.alunos.map((a) => (
                <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
                  <div>
                    <Link to={`/alunos/${a.id}`} state={{ voltar: location.pathname + location.search }} className="font-bold">{a.nome}</Link>
                    <p className="text-xs text-muted">
                      Escrita: {a.escrita === null ? 'sem avaliação' : ESCRITA[a.escrita]} · habilidades avaliadas: {a.habilidadesAvaliadas} de {a.habilidadesPrevistas}
                      {' · '}lacunas herdadas: {a.lacunas.total}{a.lacunas.semAvaliacao > 0 && ` (${a.lacunas.semAvaliacao} sem avaliação)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={a.atencao.estado === 'EM_ATENCAO' ? 'font-bold text-warn' : 'text-muted'}>
                      {a.atencao.estado === 'EM_ATENCAO' ? `⚑ Em atenção: ${a.atencao.motivos.map((m) => MOTIVO[m]).join(', ')}`
                        : a.atencao.estado === 'INCOMPLETA' ? '… Atenção não concluída' : '✓ Sem sinal'}
                    </span>
                    <Link to={`/alunos/${a.id}/avaliacao?ano=${d.turma.anoLetivo}&bimestre=${d.referencia.bimestre}`} className="font-semibold">Avaliação →</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
