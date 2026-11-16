import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ErroApi, Situacao } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';
import { IconeCalendario, IconeSeta } from '../components/Icones';

type Periodo = { bimestre: number; inicio: string; fim: string; estado: 'ABERTO' | 'FECHADO' | 'REABERTO'; situacao: Situacao; justificativa: string | null };
interface Visao {
  anos: Array<{
    anoLetivo: number; anoFechado: boolean; jaEncerradoAlgumaVez: boolean;
    periodos: Periodo[];
    trilha: Array<{ id: number; tipo: string; bimestre: number | null; justificativa: string; autorNome: string; em: string }>;
  }>;
}
interface Ausencias { turmas: Array<{ turma: { id: number; nome: string }; alunos: number; paresPrevistos: number; paresSemAvaliacao: number; alunosSemEscrita: number }> }

const br = (d: string) => d.split('-').reverse().join('/');
const dm = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7);
const TIPO: Record<string, string> = { FECHAR_BIMESTRE: 'Fechou bimestre', REABRIR_BIMESTRE: 'Reabriu bimestre', FECHAR_ANO: 'Fechou o ano', REABRIR_ANO: 'Reabriu o ano' };
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const hojeIso = () => iso(new Date());
const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const estadoTexto = (p: Periodo) => (p.situacao === 'FUTURO' ? 'Ainda não começou' : p.estado === 'FECHADO' ? 'Fechado' : p.estado === 'REABERTO' ? 'Reaberto' : 'Aberto');
const aberto = (p: Periodo) => p.situacao !== 'FUTURO' && p.estado !== 'FECHADO';

type Acao = { tipo: 'fechar' | 'reabrir'; ano: number; bimestre: number | null };

/**
 * Tarefa 7.3 — calendário letivo da escola (coordenação): bimestres em grade mensal, fechar/reabrir bimestre e ano
 * com justificativa e trilha. A grade mostra só o que existe no sistema (bimestres, prazos e hoje): não há
 * cadastro de feriados ou reuniões.
 */
export default function Calendario() {
  const q = useQuery({ queryKey: ['calendario'], queryFn: () => api<Visao>('/calendario') });
  const hoje = hojeIso();
  const [anoSel, setAnoSel] = useState<number | null>(null);
  const [mes, setMes] = useState<{ ano: number; mes: number }>(() => ({ ano: Number(hoje.slice(0, 4)), mes: Number(hoje.slice(5, 7)) - 1 }));
  const [acao, setAcao] = useState<Acao | null>(null);

  const anos = q.data?.anos ?? [];
  const a = anos.find((x) => x.anoLetivo === anoSel) ?? anos.find((x) => x.anoLetivo === Number(hoje.slice(0, 4))) ?? anos[0];
  const atual = a?.periodos.find((p) => p.inicio <= hoje && hoje <= p.fim);
  const bimDoMes = a?.periodos.find((p) => {
    const m = `${mes.ano}-${String(mes.mes + 1).padStart(2, '0')}`;
    return p.inicio.slice(0, 7) <= m && m <= p.fim.slice(0, 7);
  });

  const irPara = (data: string) => setMes({ ano: Number(data.slice(0, 4)), mes: Number(data.slice(5, 7)) - 1 });
  const andar = (delta: number) => setMes((m) => {
    const t = m.mes + delta;
    return { ano: m.ano + Math.floor(t / 12), mes: ((t % 12) + 12) % 12 };
  });

  const prazos = (a?.periodos ?? [])
    .flatMap((p) => [
      { data: p.inicio, titulo: `Início do ${p.bimestre}º bimestre`, sub: 'Registros do bimestre passam a valer' },
      { data: p.fim, titulo: `Fim do ${p.bimestre}º bimestre`, sub: 'Depois a coordenação fecha: avaliações ficam só para leitura' },
    ])
    .filter((x) => x.data >= hoje)
    .slice(0, 3);

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="degrade flex h-16 w-16 items-center justify-center rounded-full text-white" aria-hidden="true"><IconeCalendario /></span>
          <div>
            <h1 className="text-4xl font-extrabold sm:text-5xl">Calendário letivo</h1>
            {a && <p className="mt-1 text-lg text-muted">{a.anoLetivo} · {a.periodos.length} bimestres · escola inteira</p>}
          </div>
        </div>
        {atual && <span className={`chip px-4 py-2 text-base ${aberto(atual) ? 'chip-menta' : 'chip-cinza'}`}>Período {aberto(atual) ? 'aberto' : 'fechado'}</span>}
      </div>
      <p className="mt-3 text-muted">Um calendário para a escola toda. Fechar um bimestre bloqueia avaliações, observações e eventos de lacunas daquele período, para todas as turmas.</p>

      {q.isLoading && <Carregando />}
      {q.error && <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />}
      {a && (
        <>
          {anos.length > 1 && (
            <div role="group" aria-label="Ano letivo" className="mt-5 flex flex-wrap gap-2">
              {anos.map((x) => (
                <button key={x.anoLetivo} type="button" className="pilula" aria-pressed={x.anoLetivo === a.anoLetivo}
                  onClick={() => { setAnoSel(x.anoLetivo); irPara(x.periodos.find((p) => p.inicio <= hoje && hoje <= p.fim)?.inicio ?? x.periodos[0].inicio); }}>
                  {x.anoLetivo}{x.anoFechado ? ' · ano fechado' : ''}
                </button>
              ))}
            </div>
          )}

          {/* atalhos dos bimestres */}
          <nav aria-label="Bimestres" className="mt-4 flex flex-wrap gap-3">
            {a.periodos.map((p) => (
              <button key={p.bimestre} type="button" className="aba px-5 py-3 text-lg" aria-current={bimDoMes?.bimestre === p.bimestre ? 'true' : undefined}
                onClick={() => irPara(p.inicio <= hoje && hoje <= p.fim ? hoje : p.inicio)}>
                {p.bimestre}º · {estadoTexto(p)}
              </button>
            ))}
          </nav>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Mes ano={mes.ano} mes={mes.mes} hoje={hoje} periodos={a.periodos} bim={bimDoMes} andar={andar} />

            <div className="space-y-6">
              <article className="card">
                <h2 className="text-2xl font-extrabold">Bimestres</h2>
                <p className="text-muted">Datas de abertura e fechamento</p>
                <ul className="mt-4 space-y-3">
                  {a.periodos.map((p) => {
                    const corrente = p === atual;
                    return (
                      <li key={p.bimestre} className={`rounded-2xl border-2 p-4 ${corrente ? 'border-teal-claro bg-menta/40' : 'border-line'}`}>
                        <div className="flex items-start gap-3">
                          <span aria-hidden="true" className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${aberto(p) ? 'bg-teal-claro' : 'bg-[#9aa5ab]'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-lg font-extrabold">{p.bimestre}º bimestre{corrente && <span className="ml-2 text-sm font-bold text-teal">(agora)</span>}</p>
                            <p className="text-muted">{dm(p.inicio)} a {dm(p.fim)}</p>
                          </div>
                          <span className={`chip ${aberto(p) ? 'chip-menta' : 'chip-cinza'}`}>{estadoTexto(p)}</span>
                        </div>
                        {p.situacao !== 'FUTURO' && (
                          <button type="button" className="btn-sec mt-3 px-3 py-1 text-sm"
                            onClick={() => setAcao({ tipo: p.estado === 'FECHADO' ? 'reabrir' : 'fechar', ano: a.anoLetivo, bimestre: p.bimestre })}>
                            {p.estado === 'FECHADO' ? 'Reabrir' : 'Fechar'} o {p.bimestre}º bimestre
                          </button>
                        )}
                        {acao?.ano === a.anoLetivo && acao.bimestre === p.bimestre && <FormAcao acao={acao} fechar={() => setAcao(null)} />}
                      </li>
                    );
                  })}
                </ul>
              </article>

              <article className="card">
                <h2 className="text-2xl font-extrabold">Próximos prazos</h2>
                {prazos.length === 0 && <p className="mt-2 text-muted">Nenhum prazo daqui para frente neste ano.</p>}
                <ul className="mt-4 space-y-4">
                  {prazos.map((x) => (
                    <li key={x.titulo} className="flex items-center gap-4">
                      <span className="flex w-16 shrink-0 flex-col items-center rounded-2xl bg-menta py-2 text-menta-texto">
                        <b className="text-2xl leading-none">{x.data.slice(8, 10)}</b>
                        <span className="text-xs font-bold">{MESES_CURTOS[Number(x.data.slice(5, 7)) - 1]}</span>
                      </span>
                      <span><b className="block text-lg">{x.titulo}</b><span className="text-sm text-muted">{x.sub}</span></span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>

          {/* rodapé: contagem, ano e trilha */}
          <div className="card mt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {atual && aberto(atual) && atual.fim >= hoje ? (
                <span className="chip chip-amarelo px-5 py-2.5 text-lg">
                  {atual.bimestre}º bimestre termina {diasEntre(hoje, atual.fim) === 0 ? 'hoje' : `em ${diasEntre(hoje, atual.fim)} ${diasEntre(hoje, atual.fim) === 1 ? 'dia' : 'dias'}`}
                </span>
              ) : <span className="text-muted">{a.anoFechado ? `Ano ${a.anoLetivo} fechado.` : 'Nenhum bimestre aberto hoje.'}</span>}
              <button type="button" className="btn px-6 py-3" onClick={() => setAcao({ tipo: a.anoFechado ? 'reabrir' : 'fechar', ano: a.anoLetivo, bimestre: null })}>
                {a.anoFechado ? 'Reabrir' : 'Fechar'} o ano {a.anoLetivo}
              </button>
            </div>
            {acao?.ano === a.anoLetivo && acao.bimestre === null && <FormAcao acao={acao} fechar={() => setAcao(null)} />}
            {a.trilha.length > 0 && (
              <details className="mt-4 text-sm">
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
          </div>
        </>
      )}
    </section>
  );
}

/** Grade do mês: domingo a sábado; marca hoje, fins de semana e início/fim de cada bimestre. */
function Mes({ ano, mes, hoje, periodos, bim, andar }: {
  ano: number; mes: number; hoje: string; periodos: Periodo[]; bim?: Periodo; andar: (d: number) => void;
}) {
  const primeiro = new Date(ano, mes, 1);
  const inicioGrade = new Date(ano, mes, 1 - primeiro.getDay());
  const semanas = Math.ceil((primeiro.getDay() + new Date(ano, mes + 1, 0).getDate()) / 7);
  const dias = Array.from({ length: semanas * 7 }, (_, k) => new Date(inicioGrade.getFullYear(), inicioGrade.getMonth(), inicioGrade.getDate() + k));

  return (
    <article className="card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <h2 className="text-3xl font-extrabold" aria-live="polite">{MESES[mes]} {ano}</h2>
        <div className="flex items-center gap-2">
          {bim && <span className="chip chip-amarelo">{bim.bimestre}º bimestre</span>}
          <button type="button" className="btn-sec h-12 w-12 p-0" onClick={() => andar(-1)}><IconeSeta para="esq" /><span className="sr-only">Mês anterior</span></button>
          <button type="button" className="btn-sec h-12 w-12 p-0" onClick={() => andar(1)}><IconeSeta para="dir" /><span className="sr-only">Próximo mês</span></button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[540px] table-fixed border-separate border-spacing-1.5">
          <thead><tr>{SEMANA.map((s) => <th key={s} className="pb-1 text-sm font-bold text-muted">{s}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: semanas }, (_, w) => (
              <tr key={w}>
                {dias.slice(w * 7, w * 7 + 7).map((d) => {
                  const dIso = iso(d);
                  const doMes = d.getMonth() === mes;
                  const fimDeSemana = d.getDay() === 0 || d.getDay() === 6;
                  const eHoje = dIso === hoje;
                  const marcas = periodos.flatMap((p) => [
                    ...(p.inicio === dIso ? [`Início ${p.bimestre}º bim.`] : []),
                    ...(p.fim === dIso ? [`Fim ${p.bimestre}º bim.`] : []),
                  ]);
                  const dentro = periodos.some((p) => p.inicio <= dIso && dIso <= p.fim);
                  return (
                    <td key={dIso} aria-current={eHoje ? 'date' : undefined}
                      className={`h-24 rounded-2xl p-2 align-top ${!doMes ? 'text-muted/50' : eHoje ? 'border-2 border-azul bg-[#eaf2ff]' : fimDeSemana ? 'bg-[#fdf3dc]' : dentro ? 'bg-[#f2f6f8]' : 'bg-white'}`}>
                      {doMes && (
                        <>
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full font-extrabold ${eHoje ? 'bg-azul text-white' : ''}`}>{d.getDate()}</span>
                          {eHoje && <span className="sr-only"> (hoje)</span>}
                          {marcas.map((m) => <span key={m} className="mt-1 block rounded-lg bg-menta px-1.5 py-0.5 text-xs font-bold leading-tight text-menta-texto">{m}</span>)}
                        </>
                      )}
                      {!doMes && <span className="font-bold">{d.getDate()}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <span className="flex items-center gap-2"><span className="chip chip-menta px-2 py-0.5 text-xs">Prazo</span> início ou fim de bimestre</span>
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 rounded bg-[#fdf3dc]" /> fim de semana</span>
        <span className="flex items-center gap-2"><span aria-hidden="true" className="h-4 w-4 rounded-full bg-azul" /> hoje</span>
      </p>
    </article>
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
    <div className="mt-3 rounded-2xl border-2 border-azul/40 bg-lilas/40 p-4 text-sm">
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
