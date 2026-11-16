import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, Turma } from '../api';
import { useUsuario } from '../App';
import { Carregando, ErroCaixa } from '../components/Estado';

export default function Turmas() {
  const { data: usuario } = useUsuario();
  const q = useQuery({ queryKey: ['turmas'], queryFn: () => api<{ turmas: Turma[] }>('/turmas') });
  const coord = usuario?.papel === 'COORDENACAO';

  return (
    <section>
      <h1 className="text-2xl font-extrabold">{coord ? 'Turmas da escola' : 'Minhas turmas'}</h1>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {q.data && q.data.turmas.length === 0 && (
        <p className="card mt-4">Você não tem turmas vinculadas hoje. Se isso estiver errado, procure a coordenação.</p>
      )}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {q.data?.turmas.map((t) => (
          <li key={t.id}>
            <Link to={`/turmas/${t.id}`} className="card block no-underline hover:border-brand">
              <span className="text-lg font-extrabold text-ink">{t.nome}</span>
              <span className="ml-2 text-muted">ano letivo {t.anoLetivo}</span>
              <span className="mt-1 block text-sm text-muted">
                {t.etapa}º ano · {t.alunos} {t.alunos === 1 ? 'aluno' : 'alunos'}
                {t.meuVinculo && ` · você é ${t.meuVinculo === 'TITULAR' ? 'titular' : 'substituta'}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
