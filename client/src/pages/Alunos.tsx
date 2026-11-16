import { useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, PainelTurma, RespostaTurmas } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';
import { AvatarCrianca } from '../components/AvatarCrianca';
import { Progresso } from '../components/ui';
import { Selo } from './AlunosTurma';

type Situacao = 'TODAS' | 'ATENCAO' | 'SEM_AVALIACAO' | 'ANDAMENTO' | 'COMPLETA';
const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Todos os alunos visíveis no bimestre atual (professora: das suas turmas; coordenação: da escola),
 * em cartões. Os dados vêm do painel de cada turma — nada é calculado aqui.
 */
export default function Alunos() {
  const [busca, setBusca] = useState('');
  const [turma, setTurma] = useState<number | 'TODAS'>('TODAS');
  const [situacao, setSituacao] = useState<Situacao>('TODAS');

  const turmasQ = useQuery({ queryKey: ['turmas'], queryFn: () => api<RespostaTurmas>('/turmas') });
  const atual = turmasQ.data?.periodoAtual ?? null;
  const turmas = (turmasQ.data?.turmas ?? []).filter((t) => !atual || t.anoLetivo === atual.anoLetivo);
  const paineis = useQueries({
    queries: turmas.map((t) => ({
      queryKey: ['painel', 'turma', String(t.id), '', ''],
      queryFn: () => api<PainelTurma>(`/painel/turmas/${t.id}?bimestre=&comparar=`),
    })),
  });

  const carregando = turmasQ.isLoading || paineis.some((p) => p.isLoading);
  const erro = turmasQ.error ?? paineis.find((p) => p.error)?.error;
  const todos = paineis.flatMap((p, k) => (p.data?.alunos ?? []).map((a) => ({ ...a, turma: p.data!.turma, faixa: (k % 3) + 1, bimestre: p.data!.referencia.bimestre })));
  const ref = paineis.find((p) => p.data)?.data?.referencia;

  const lista = todos
    .filter((a) => turma === 'TODAS' || a.turma.id === turma)
    .filter((a) => !busca.trim() || semAcento(a.nome).includes(semAcento(busca.trim())))
    .filter((a) => {
      if (situacao === 'ATENCAO') return a.atencao.estado === 'EM_ATENCAO';
      if (situacao === 'SEM_AVALIACAO') return a.habilidadesAvaliadas === 0;
      if (situacao === 'COMPLETA') return a.habilidadesAvaliadas === a.habilidadesPrevistas && a.habilidadesPrevistas > 0;
      if (situacao === 'ANDAMENTO') return a.habilidadesAvaliadas > 0 && a.habilidadesAvaliadas < a.habilidadesPrevistas;
      return true;
    });

  return (
    <section>
      <h1 className="text-4xl font-extrabold sm:text-5xl">Alunos</h1>
      <p className="mt-2 text-lg text-muted">
        {todos.length} {todos.length === 1 ? 'aluno' : 'alunos'}{ref && ` · ${ref.bimestre}º bimestre · ${ref.anoLetivo}`}
      </p>

      <div className="card mt-6 grid gap-4 lg:grid-cols-[1.5fr_auto_1fr] lg:items-end">
        <div>
          <label htmlFor="busca-aluno" className="font-bold">Buscar aluno</label>
          <input id="busca-aluno" type="search" className="campo mt-2" placeholder="Nome do aluno" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div>
          <p id="rot-turma" className="font-bold">Turma</p>
          <div role="group" aria-labelledby="rot-turma" className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="pilula" aria-pressed={turma === 'TODAS'} onClick={() => setTurma('TODAS')}>Todas</button>
            {turmas.map((t) => (
              <button key={t.id} type="button" className="pilula" aria-pressed={turma === t.id} onClick={() => setTurma(t.id)}>{t.nome}</button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="situacao" className="font-bold">Situação</label>
          <select id="situacao" className="campo mt-2" value={situacao} onChange={(e) => setSituacao(e.target.value as Situacao)}>
            <option value="TODAS">Todas</option>
            <option value="ATENCAO">Em atenção</option>
            <option value="SEM_AVALIACAO">Sem avaliação</option>
            <option value="ANDAMENTO">Em andamento</option>
            <option value="COMPLETA">Completa</option>
          </select>
        </div>
      </div>

      {carregando && <div className="mt-6"><Carregando /></div>}
      {erro && <div className="mt-6"><ErroCaixa erro={erro} /></div>}
      {!carregando && !erro && turmas.length === 0 && (
        <p className="card mt-6">Você não tem turmas vinculadas hoje. Se isso estiver errado, procure a coordenação.</p>
      )}
      {!carregando && todos.length > 0 && lista.length === 0 && <p className="card mt-6 text-center text-muted">Nenhum aluno com esse filtro.</p>}

      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lista.map((a) => (
          <li key={a.id} className="card flex flex-col items-center overflow-hidden p-0 text-center">
            <div aria-hidden="true" className={`h-3 w-full faixa-${a.faixa}`} />
            <div className="flex w-full flex-1 flex-col items-center p-5 pt-6">
              <AvatarCrianca nome={a.nome} tamanho={112} />
              <h2 className="mt-4 text-2xl font-extrabold">{a.nome}</h2>
              <p className="text-muted">Turma {a.turma.nome}</p>
              <div className="mt-3"><Selo a={a} /></div>
              <div className="mt-4 w-full text-left">
                <div className="flex justify-between text-sm"><span className="text-muted">Habilidades</span><b>{a.habilidadesAvaliadas} de {a.habilidadesPrevistas}</b></div>
                <div className="mt-1.5"><Progresso n={a.habilidadesAvaliadas} d={a.habilidadesPrevistas} rotulo={`${a.nome}: ${a.habilidadesAvaliadas} de ${a.habilidadesPrevistas} habilidades avaliadas`} /></div>
              </div>
              <Link to={`/alunos/${a.id}`} className="btn-sec mt-5 w-full py-3 text-lg">Ver ficha<span className="sr-only"> de {a.nome}</span></Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
