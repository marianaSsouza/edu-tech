import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api, PainelGeral } from '../api';
import { useUsuario } from '../App';
import { Carregando, ErroCaixa } from '../components/Estado';
import { SeletorBimestre } from '../components/Painel';

/** PRO-02 / PRO-07: turmas com indicadores essenciais; filtros de ano e bimestre preservados na URL. */
export default function PainelEscola() {
  const { data: usuario } = useUsuario();
  const [params, setParams] = useSearchParams();
  const ano = params.get('ano') ?? '';
  const bimestre = params.get('bimestre') ?? '';
  const q = useQuery({
    queryKey: ['painel', 'geral', ano, bimestre],
    queryFn: () => api<PainelGeral>(`/painel?ano=${ano}&bimestre=${bimestre}`),
  });
  const coord = usuario?.papel === 'COORDENACAO';
  const d = q.data;

  return (
    <section>
      <h2 className="text-2xl font-extrabold">Escola inteira</h2>
      <p className="text-muted">Resumo do bimestre por turma.</p>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {d && (
        <>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {d.anosDisponiveis.length > 1 && (
              <label className="text-sm font-bold">
                Ano letivo
                <select className="campo mt-1 block w-auto" value={d.referencia.anoLetivo}
                  onChange={(e) => setParams({ turma: 'escola', ano: e.target.value })}>
                  {d.anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
            )}
            <SeletorBimestre periodos={d.periodos} atual={d.referencia.bimestre}
              onEscolher={(b) => setParams({ turma: 'escola', ano: String(d.referencia.anoLetivo), bimestre: String(b) })} />
          </div>

          {d.turmas.length === 0 && (
            <p className="card mt-6">{coord ? 'Não há turmas neste ano letivo.' : 'Você não tem turmas vinculadas hoje. Se isso estiver errado, procure a coordenação.'}</p>
          )}
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {d.turmas.map(({ turma: t, N, oculto, indicadores: i }) => (
              <li key={t.id}>
                <Link to={`/turmas/${t.id}?ano=${t.anoLetivo}&bimestre=${d.referencia.bimestre}`} className="card block text-ink no-underline hover:border-brand">
                  <span className="text-lg font-extrabold">{t.nome}</span>
                  <span className="ml-2 text-sm text-muted">{t.etapa}º ano · {N} {N === 1 ? 'criança' : 'crianças'}</span>
                  {d.referencia.situacao === 'FUTURO' ? (
                    <span className="mt-2 block text-sm text-muted">Bimestre ainda não começou.</span>
                  ) : N === 0 ? (
                    <span className="mt-2 block text-sm text-muted">Sem alunos neste bimestre.</span>
                  ) : oculto ? (
                    <span className="mt-2 block text-sm">🔒 Números ocultos: menos de {d.grupoMinimo} alunos</span>
                  ) : i && (
                    <span className="mt-2 block space-y-0.5 text-sm">
                      <span className="block">⚑ Em atenção: <b>{i.emAtencao.n}</b> de {i.N}</span>
                      <span className="block">Escrita alfabética: <b>{i.escritaAlfabetica.percentual}</b> ({i.escritaAlfabetica.n}/{i.escritaAlfabetica.d})</span>
                      <span className="block">Consolidação: <b>{i.consolidacao.percentual ?? 'Sem dados'}</b></span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {d.turmas.some((t) => t.oculto) && (
            <p className="mt-3 text-xs text-muted">Turmas com menos de {d.grupoMinimo} crianças não mostram agregados; a lista de alunos e a ficha individual continuam disponíveis ao abrir a turma.</p>
          )}
        </>
      )}
    </section>
  );
}
