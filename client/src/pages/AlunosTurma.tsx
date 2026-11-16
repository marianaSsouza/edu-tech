import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { AlunoDaTurma, api, Turma } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';

export default function AlunosTurma() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ['turma', id],
    queryFn: () => api<{ turma: Turma; alunos: AlunoDaTurma[] }>(`/turmas/${id}/alunos`),
  });

  return (
    <section>
      <Link to="/" className="text-sm">← Turmas</Link>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {q.data && (
        <>
          <h1 className="mt-2 text-2xl font-extrabold">
            {q.data.turma.nome} <span className="text-base font-semibold text-muted">· {q.data.turma.etapa}º ano · ano letivo {q.data.turma.anoLetivo}</span>
          </h1>
          {q.data.alunos.length === 0 ? (
            <p className="card mt-4">Esta turma não tem alunos matriculados.</p>
          ) : (
            <ul className="card mt-4 divide-y divide-line p-0">
              {q.data.alunos.map((a) => (
                <li key={a.id}>
                  <Link
                    to={`/alunos/${a.id}/avaliacao?ano=${q.data.turma.anoLetivo}`}
                    className="flex items-center justify-between px-4 py-3 font-bold text-ink no-underline hover:bg-brand-soft"
                  >
                    {a.nome}
                    <span className="text-sm font-semibold text-brand">Avaliação →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
