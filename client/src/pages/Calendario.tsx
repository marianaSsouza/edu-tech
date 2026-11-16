import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ErroApi, Situacao } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';

interface Visao {
  anos: Array<{
    anoLetivo: number; anoFechado: boolean; jaEncerradoAlgumaVez: boolean;
    periodos: Array<{ bimestre: number; inicio: string; fim: string; estado: 'ABERTO' | 'FECHADO' | 'REABERTO'; situacao: Situacao; justificativa: string | null }>;
    trilha: Array<{ id: number; tipo: string; bimestre: number | null; justificativa: string; autorNome: string; em: string }>;
  }>;
}
interface Ausencias { turmas: Array<{ turma: { id: number; nome: string }; alunos: number; paresPrevistos: number; paresSemAvaliacao: number; alunosSemEscrita: number }> }

const br = (d: string) => d.split('-').reverse().join('/');
const ESTADO = { ABERTO: 'Aberto', FECHADO: '🔒 Fechado', REABERTO: 'Reaberto' };
const TIPO: Record<string, string> = { FECHAR_BIMESTRE: 'Fechou bimestre', REABRIR_BIMESTRE: 'Reabriu bimestre', FECHAR_ANO: 'Fechou o ano', REABRIR_ANO: 'Reabriu o ano' };

type Acao = { tipo: 'fechar' | 'reabrir'; ano: number; bimestre: number | null };

/** Tarefa 7.3 — calendário escolar: fechar/reabrir bimestre e ano, com justificativa e trilha (coordenação). */
export default function Calendario() {
  const q = useQuery({ queryKey: ['calendario'], queryFn: () => api<Visao>('/calendario') });
  const [acao, setAcao] = useState<Acao | null>(null);

  return (
    <section>
      <h1 className="text-2xl font-extrabold">Calendário escolar</h1>
      <p className="text-sm text-muted">Um calendário para a escola toda. Fechar um bimestre bloqueia avaliações, observações e eventos de lacunas daquele período, para todas as turmas.</p>
      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {q.data?.anos.map((a) => (
        <article key={a.anoLetivo} className="card mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">
              {a.anoLetivo} <span className="text-sm font-semibold text-muted">· {a.anoFechado ? '🔒 ano fechado' : a.jaEncerradoAlgumaVez ? 'ano reaberto (continua valendo para herança)' : 'ano em curso'}</span>
            </h2>
            <button type="button" className="btn-sec text-sm" onClick={() => setAcao({ tipo: a.anoFechado ? 'reabrir' : 'fechar', ano: a.anoLetivo, bimestre: null })}>
              {a.anoFechado ? 'Reabrir o ano' : 'Fechar o ano'}
            </button>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead><tr className="border-b border-line text-muted"><th className="py-1">Bimestre</th><th>Datas</th><th>Estado</th><th>Ação</th></tr></thead>
              <tbody>
                {a.periodos.map((p) => (
                  <tr key={p.bimestre} className="border-b border-line">
                    <td className="py-1.5 font-bold">{p.bimestre}º</td>
                    <td>{br(p.inicio)} a {br(p.fim)}</td>
                    <td>{p.situacao === 'FUTURO' ? 'Ainda não começou' : ESTADO[p.estado]}</td>
                    <td>
                      {p.situacao !== 'FUTURO' && (
                        <button type="button" className="btn-sec text-xs" onClick={() => setAcao({ tipo: p.estado === 'FECHADO' ? 'reabrir' : 'fechar', ano: a.anoLetivo, bimestre: p.bimestre })}>
                          {p.estado === 'FECHADO' ? 'Reabrir' : 'Fechar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {acao?.ano === a.anoLetivo && <FormAcao acao={acao} fechar={() => setAcao(null)} />}
          {a.trilha.length > 0 && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-bold">Trilha de fechamento e reabertura ({a.trilha.length})</summary>
              <ul className="mt-1 space-y-1">
                {a.trilha.map((e) => (
                  <li key={e.id}>
                    <span className="text-muted">{new Date(e.em).toLocaleString('pt-BR')} · {e.autorNome}:</span>{' '}
                    {TIPO[e.tipo]}{e.bimestre ? ` (${e.bimestre}º)` : ''} — {e.justificativa}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </article>
      ))}
    </section>
  );
}

function FormAcao({ acao, fechar }: { acao: Acao; fechar: () => void }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const fechandoBimestre = acao.tipo === 'fechar' && acao.bimestre !== null;
  const aus = useQuery({
    queryKey: ['ausencias', acao.ano, acao.bimestre],
    queryFn: () => api<Ausencias>(`/calendario/${acao.ano}/bimestres/${acao.bimestre}/ausencias`),
    enabled: fechandoBimestre,
  });
  const alvo = acao.bimestre ? `o ${acao.bimestre}º bimestre de ${acao.ano}` : `o ano letivo ${acao.ano}`;
  const caminho = acao.bimestre ? `/calendario/${acao.ano}/bimestres/${acao.bimestre}/${acao.tipo}` : `/calendario/${acao.ano}/${acao.tipo}`;

  const enviar = async () => {
    setErro(null);
    setEnviando(true);
    try {
      await api(caminho, { method: 'POST', body: { justificativa: texto } });
      qc.invalidateQueries(); // períodos mudam permissões e indicadores em todas as telas
      fechar();
    } catch (e) {
      setErro((e as ErroApi).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-brand bg-brand-soft/40 p-3 text-sm">
      <p className="font-extrabold">{acao.tipo === 'fechar' ? 'Fechar' : 'Reabrir'} {alvo}</p>
      {fechandoBimestre && (
        <div className="mt-2">
          <p className="font-bold">Ausências que ficarão registradas como "Sem avaliação":</p>
          {aus.isLoading && <p className="text-muted">Calculando…</p>}
          {aus.data && (
            <ul className="mt-1 list-disc pl-5">
              {aus.data.turmas.map((t) => (
                <li key={t.turma.id}>
                  {t.turma.nome}: {t.paresSemAvaliacao} de {t.paresPrevistos} habilidades sem avaliação · {t.alunosSemEscrita} de {t.alunos} alunos sem escrita
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1 text-xs text-muted">Fechar não cria avaliações: o que está ausente continua ausente.</p>
        </div>
      )}
      <label htmlFor="just-cal" className="mt-2 block font-bold">Justificativa (obrigatória)</label>
      <textarea id="just-cal" rows={2} maxLength={2000} className="campo mt-1" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {erro && <p role="alert" className="mt-1 text-warn">⚠ {erro}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn text-sm" disabled={enviando || !texto.trim()} onClick={enviar}>
          {enviando ? 'Salvando…' : acao.tipo === 'fechar' ? 'Confirmar fechamento' : 'Confirmar reabertura'}
        </button>
        <button type="button" className="btn-sec text-sm" onClick={fechar}>Cancelar</button>
      </div>
    </div>
  );
}
