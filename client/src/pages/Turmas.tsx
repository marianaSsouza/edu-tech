import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, PainelGeral, Turma } from '../api';
import { useUsuario } from '../App';
import { Carregando, ErroCaixa } from '../components/Estado';
import { Titulo } from '../components/ui';

interface Resposta {
  turmas: Turma[];
  periodoAtual: { anoLetivo: number; bimestre: number; inicio: string; fim: string; situacao: 'DISPONIVEL' | 'FECHADO' | 'FUTURO' } | null;
}

const GRUPO_MINIMO = 5;
const dm = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);

/** Tela inicial: cartões das turmas (coordenação: todas; professora: as suas). */
export default function Turmas() {
  const { data: usuario } = useUsuario();
  const q = useQuery({ queryKey: ['turmas'], queryFn: () => api<Resposta>('/turmas') });
  // quantas crianças em atenção por turma (só quando o grupo permite mostrar agregados)
  const geral = useQuery({ queryKey: ['painel', 'geral', '', ''], queryFn: () => api<PainelGeral>('/painel?ano=&bimestre=') });
  const atencaoDa = (id: number) => geral.data?.turmas.find((x) => x.turma.id === id)?.indicadores?.emAtencao.n;
  const coord = usuario?.papel === 'COORDENACAO';
  const p = q.data?.periodoAtual;

  return (
    <section>
      <Titulo
        sobre={p ? `Ano letivo ${p.anoLetivo}` : undefined}
        titulo={coord ? 'Turmas da escola' : 'Minhas turmas'}
        sub={
          <>
            {p && `${p.bimestre}º bimestre ${p.situacao === 'FECHADO' ? 'fechado' : `aberto até ${dm(p.fim)}`}.`}
            {coord && ' A coordenação consulta, mas não edita conteúdo pedagógico.'}
          </>
        }
      />
      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {q.data && q.data.turmas.length === 0 && (
        <p className="card mt-6">Você não tem turmas vinculadas hoje. Se isso estiver errado, procure a coordenação.</p>
      )}
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {q.data?.turmas.map((t, i) => {
          const titular = t.professores?.filter((x) => x.tipo === 'TITULAR').map((x) => x.nome).join(', ');
          const substituta = t.professores?.filter((x) => x.tipo === 'SUBSTITUTA').map((x) => x.nome).join(', ');
          const passado = p ? t.anoLetivo < p.anoLetivo : false;
          return (
            <li key={t.id} className="card flex flex-col overflow-hidden p-0">
              <div aria-hidden="true" className={`h-4 faixa-${(i % 3) + 1}`} />
              <div className="flex flex-1 flex-col p-6 pt-5">
                <h2 className="text-3xl font-extrabold">{t.nome}</h2>
                <p className="mt-1 text-lg text-muted">{t.etapa}º ano · {t.anoLetivo}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="chip chip-lilas">{t.alunos} {t.alunos === 1 ? 'aluno' : 'alunos'}</span>
                  {(atencaoDa(t.id) ?? 0) > 0 && <span className="chip chip-amarelo">{atencaoDa(t.id)} em atenção</span>}
                  {t.anoEncerrado && <span className="chip chip-cinza">Ano encerrado</span>}
                  {!t.anoEncerrado && t.alunos > 0 && t.alunos < GRUPO_MINIMO && <span className="chip chip-amarelo">Agregado oculto: grupo menor que {GRUPO_MINIMO}</span>}
                  {t.meuVinculo && <span className="chip chip-menta">Você é {t.meuVinculo === 'TITULAR' ? 'titular' : 'substituta'}</span>}
                </div>
                <p className="mt-4 text-muted">
                  {titular && <>{passado ? `Titular em ${t.anoLetivo}` : 'Titular'}: {titular}</>}
                  {substituta && <> · Substituta: {substituta}</>}
                </p>
                <div className="mt-auto pt-5">
                  <Link to={`/turmas/${t.id}?ano=${t.anoLetivo}`} className="btn-sec w-full py-3 text-lg">Abrir turma</Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
