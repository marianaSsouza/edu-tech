import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, Usuario } from '../api';
import { ErroCaixa } from '../components/Estado';
import { Titulo } from '../components/ui';

interface Regras {
  matrizEscrita: Record<string, [number, number, number, number]>;
  limiteLacunas: number; grupoMinimo: number; limiteObservacoes: number; limiteTextoAtencao: number;
  catalogo: { versao: string; total: number; porEtapa: Array<{ etapa: number; habilidades: number }> };
  catalogoDemonstrativo: { itens: number; ids: string[] };
}
type Tema = 'PERCENTUAL' | 'LACUNAS' | 'ATENCAO' | 'PAINEL' | 'ACESSO';
interface Caso {
  id: string; tema: Tema; descricao: string; entrada: string; esperado: string; obtido: string;
  status: 'APROVADO' | 'FALHOU' | 'FORA_DA_TELA'; evidencia?: string;
}
interface Execucao { executadoEm: string; total: number; aprovados: number; falhas: number; foraDaTela: number; casos: Caso[] }

const TEMAS: Array<{ tema: Tema; titulo: string; sub: string }> = [
  { tema: 'PERCENTUAL', titulo: 'Contas de porcentagem', sub: 'As porcentagens do painel saem sempre com uma casa decimal e sem erro de arredondamento.' },
  { tema: 'LACUNAS', titulo: 'Lacunas do ano anterior', sub: 'O que a criança não consolidou nos anos já encerrados continua visível até ser resolvido.' },
  { tema: 'ATENCAO', titulo: 'Quando uma criança fica "Em atenção"', sub: 'O sinal aparece por lacunas, por escrita abaixo do esperado ou por registro da professora.' },
  { tema: 'PAINEL', titulo: 'Painel da turma e da escola', sub: 'Como os números da turma são somados, inclusive quando falta registro.' },
  { tema: 'ACESSO', titulo: 'Quem pode ver e editar', sub: 'Permissões são conferidas no servidor, não nesta tela.' },
];

const ESCRITA = ['Pré-silábica', 'Silábica', 'Silábico-alfabética', 'Alfabética'];
const COR_ESCRITA = ['bg-[#eef1f4] text-muted', 'bg-amarelo-claro text-amarelo-texto', 'bg-lilas text-lilas-texto', 'bg-menta text-menta-texto'];

/** RF-14 / PRO-09 (só coordenação): regras em linguagem simples e exemplos conferidos na hora (CA-14.1 a 14.4). */
export default function Regras() {
  const [aba, setAba] = useState<'exemplos' | 'regras'>('exemplos');
  const usuario = useQueryClient().getQueryData<Usuario | null>(['me']);
  if (usuario && usuario.papel !== 'COORDENACAO') {
    return <ErroCaixa erro={{ status: 403, message: 'A tela de regras é exclusiva da coordenação.' }} />;
  }
  return (
    <section>
      <Titulo titulo="Regras do sistema"
        sub="Aqui a coordenação vê como o sistema decide cada número e cada sinal, e confere, na hora, que os cálculos estão certos." />

      <nav aria-label="Seções" className="mt-6 flex flex-wrap gap-2">
        <button type="button" className="aba" aria-current={aba === 'exemplos' ? 'page' : undefined} onClick={() => setAba('exemplos')}>✔ Conferir os cálculos</button>
        <button type="button" className="aba" aria-current={aba === 'regras' ? 'page' : undefined} onClick={() => setAba('regras')}>📖 Como o sistema decide</button>
      </nav>

      {aba === 'exemplos' ? <Exemplos /> : <ComoDecide />}
    </section>
  );
}

/* ------------------------------------------------------------------ exemplos */

function Exemplos() {
  const [simularFalha, setSimularFalha] = useState(false);
  const exec = useQuery({
    queryKey: ['regras', 'casos', simularFalha],
    queryFn: () => api<Execucao>(`/regras/casos${simularFalha ? '?falhaControlada=CR-01' : ''}`),
    staleTime: 0, gcTime: 0, // sempre executa de novo ao abrir: nada de resultado guardado
  });
  const executando = exec.isFetching;
  const d = exec.data;

  return (
    <div className="mt-6 space-y-6">
      <div className="card">
        <h2 className="text-xl font-extrabold">Como funciona</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            ['1', 'Os requisitos do projeto trazem 24 exemplos com a resposta certa já definida.'],
            ['2', 'Ao abrir esta tela, o sistema calcula cada exemplo com as mesmas regras da ficha e do painel.'],
            ['3', 'Comparamos as duas respostas. Nada é lido nem gravado nos dados da escola.'],
          ].map(([n, t]) => (
            <li key={n} className="flex gap-3 rounded-2xl bg-bg p-3 text-sm">
              <span className="degrade flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-extrabold text-white">{n}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* resultado geral */}
      <div className="card" aria-live="polite">
        {executando ? (
          <p className="text-lg font-bold" role="status">⏳ Conferindo os exemplos…</p>
        ) : exec.error ? (
          <ErroCaixa erro={exec.error} tentarDeNovo={() => exec.refetch()} />
        ) : d && (
          <Resumo d={d} />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-line pt-4">
          <button type="button" className="btn-sec" onClick={() => exec.refetch()} disabled={executando}>↻ Conferir de novo</button>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-teal" checked={simularFalha} onChange={(e) => setSimularFalha(e.target.checked)} />
            <span><b>Simular um erro</b> (para apresentação): troca de propósito a resposta certa do primeiro exemplo e mostra que a tela acusa a diferença.</span>
          </label>
        </div>
      </div>

      {/* exemplos por assunto: só aparecem depois da execução real (CA-14.4) */}
      {!executando && d && TEMAS.map((t) => {
        const casos = d.casos.filter((c) => c.tema === t.tema);
        if (casos.length === 0) return null;
        const ok = casos.filter((c) => c.status === 'APROVADO').length;
        const executados = casos.filter((c) => c.status !== 'FORA_DA_TELA').length;
        return (
          <section key={t.tema} className="card" aria-labelledby={`tema-${t.tema}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 id={`tema-${t.tema}`} className="text-xl font-extrabold">{t.titulo}</h2>
                <p className="text-sm text-muted">{t.sub}</p>
              </div>
              {executados > 0 && (
                <span className={`chip ${ok === executados ? 'chip-menta' : 'chip-alerta'}`}>{ok} de {executados} certos</span>
              )}
            </div>
            <ul className="mt-4 space-y-3">
              {casos.map((c) => <CartaoCaso key={c.id} c={c} />)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Resumo({ d }: { d: Execucao }) {
  const quando = new Date(d.executadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const erradas = d.casos.filter((c) => c.status === 'FALHOU');
  return (
    <div className="flex flex-wrap items-center gap-4">
      <span aria-hidden className={`flex h-14 w-14 items-center justify-center rounded-full text-3xl font-extrabold ${d.falhas === 0 ? 'bg-menta text-menta-texto' : 'bg-alerta-claro text-alerta'}`}>
        {d.falhas === 0 ? '✔' : '!'}
      </span>
      <div className="min-w-0 flex-1">
        {d.falhas === 0 ? (
          <p className="text-2xl font-extrabold">Todos os cálculos estão certos</p>
        ) : (
          <p className="text-2xl font-extrabold text-alerta">{d.falhas} {d.falhas === 1 ? 'exemplo deu diferente' : 'exemplos deram diferente'} do esperado</p>
        )}
        <p className="text-muted">
          {d.aprovados} de {d.total} exemplos conferidos agora, às {quando}.
          {d.foraDaTela > 0 && ` Mais ${d.foraDaTela} sobre permissões, testado direto no servidor.`}
        </p>
        {erradas.length > 0 && (
          <p className="mt-1 text-sm">Veja: {erradas.map((c) => <a key={c.id} href={`#${c.id}`} className="mr-2 font-bold">{c.id} · {c.descricao}</a>)}</p>
        )}
      </div>
    </div>
  );
}

function CartaoCaso({ c }: { c: Caso }) {
  const falhou = c.status === 'FALHOU';
  const fora = c.status === 'FORA_DA_TELA';
  return (
    <li id={c.id} className={`scroll-mt-6 rounded-2xl border-2 p-4 ${falhou ? 'border-alerta bg-alerta-claro' : 'border-line bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-extrabold">
          <span aria-hidden className={`mr-2 ${falhou ? 'text-alerta' : fora ? 'text-muted' : 'text-teal'}`}>{falhou ? '✘' : fora ? '↗' : '✔'}</span>
          {c.descricao}
        </h3>
        <span className="flex items-center gap-2">
          {c.status === 'APROVADO' && <span className="chip chip-menta">Certo</span>}
          {falhou && <span className="chip chip-alerta">Diferente</span>}
          {fora && <span className="chip chip-cinza">Testado no servidor</span>}
          <span className="text-xs font-bold text-muted" title="Número do caso nos requisitos">{c.id}</span>
        </span>
      </div>
      <p className="mt-1 text-sm"><span className="font-bold text-muted">Situação: </span>{c.entrada}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-bg px-3 py-2">
          <div className="text-xs font-bold uppercase tracking-wide text-muted">Resposta certa</div>
          <div className="font-bold">{c.esperado}</div>
        </div>
        <div className={`rounded-xl px-3 py-2 ${falhou ? 'bg-white' : 'bg-bg'}`}>
          <div className="text-xs font-bold uppercase tracking-wide text-muted">O sistema calculou</div>
          <div className={`font-bold ${falhou ? 'text-alerta' : ''}`}>{fora ? '—' : c.obtido}</div>
        </div>
      </div>
      {c.evidencia && <p className="mt-2 text-xs text-muted">{c.evidencia}</p>}
    </li>
  );
}

/* ------------------------------------------------------------------ regras */

function ComoDecide() {
  const regras = useQuery({ queryKey: ['regras'], queryFn: () => api<Regras>('/regras') });
  if (regras.error) return <div className="mt-6"><ErroCaixa erro={regras.error} tentarDeNovo={() => regras.refetch()} /></div>;
  if (!regras.data) return <p className="mt-6 text-muted" role="status">⏳ Carregando…</p>;
  const r = regras.data;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <article className="card">
        <h2 className="text-xl font-extrabold">🔔 Quando a criança fica "Em atenção"</h2>
        <p className="mt-2 text-sm">Basta <b>um</b> destes motivos:</p>
        <ul className="mt-2 space-y-2">
          <li className="rounded-2xl bg-lilas px-3 py-2 text-lilas-texto"><b>{r.limiteLacunas} ou mais lacunas</b> do ano anterior ainda não resolvidas;</li>
          <li className="rounded-2xl bg-lilas px-3 py-2 text-lilas-texto"><b>escrita abaixo do esperado</b> para o ano e o bimestre (veja a tabela de escrita);</li>
          <li className="rounded-2xl bg-lilas px-3 py-2 text-lilas-texto"><b>atenção registrada pela professora</b>, que só sai quando alguém a encerra.</li>
        </ul>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>Com vários motivos, todos aparecem, mas a criança conta <b>uma vez só</b>.</li>
          <li>Se a escrita não foi registrada e não há outro motivo, aparece <b>"Atenção não concluída"</b>, nunca "sem atenção".</li>
        </ul>
      </article>

      <article className="card">
        <h2 className="text-xl font-extrabold">✏️ Escrita esperada em cada bimestre</h2>
        <p className="mt-1 text-sm text-muted">Mínimo combinado neste projeto (não é uma tabela oficial da BNCC). Os níveis não são notas.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead><tr className="text-muted"><th className="py-1 pr-2">Ano</th>{[1, 2, 3, 4].map((b) => <th key={b} className="pr-1">{b}º bim.</th>)}</tr></thead>
            <tbody>
              {Object.entries(r.matrizEscrita).map(([etapa, linha]) => (
                <tr key={etapa}>
                  <td className="whitespace-nowrap py-1 pr-2 font-extrabold">{etapa}º ano</td>
                  {linha.map((v, i) => <td key={i} className="py-1 pr-1"><span className={`block rounded-lg px-2 py-1 text-xs font-bold ${COR_ESCRITA[v]}`}>{ESCRITA[v]}</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-muted">Sem escrita registrada no bimestre, o sistema não compara e não usa a de um bimestre anterior.</p>
      </article>

      <article className="card">
        <h2 className="text-xl font-extrabold">🧵 Lacunas do ano anterior</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li>Vêm das habilidades dos <b>anos já encerrados</b> pela coordenação. Reabrir o ano não apaga as lacunas.</li>
          <li>Vale a <b>última avaliação</b> da habilidade naquele ano.</li>
          <li>"Não consolidada" e "Em desenvolvimento" viram lacuna. Habilidade que <b>nunca foi avaliada</b> aparece como "Sem avaliação registrada", contada à parte.</li>
          <li>Consolidar ou reavaliar cria um registro novo: <b>o passado não é reescrito</b>.</li>
        </ul>
      </article>

      <article className="card">
        <h2 className="text-xl font-extrabold">📊 Números do painel</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
          <li><b>Consolidação</b>: das respostas previstas, quantas estão "Consolidada".</li>
          <li><b>Avaliadas</b>: das respostas previstas, quantas já têm registro.</li>
          <li>Falta de registro <b>conta no total</b>, aparece separada e nunca vira "Não consolidada".</li>
          <li>Porcentagem com uma casa, arredondando o meio para cima (ex.: 6,25% → 6,3%). Sem nada para contar: "Sem dados".</li>
          <li>Grupo com <b>menos de {r.grupoMinimo} crianças</b>: os totais ficam ocultos para proteger as crianças; a ficha individual continua aberta.</li>
          <li>Observações: até {r.limiteObservacoes.toLocaleString('pt-BR')} caracteres por aluno e bimestre, somando todas as professoras.</li>
        </ul>
      </article>

      <article className="card lg:col-span-2">
        <h2 className="text-xl font-extrabold">📚 Habilidades avaliadas</h2>
        <p className="mt-2 text-sm">
          Catálogo <b>{r.catalogo.versao}</b>, com {r.catalogo.total} habilidades no total.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {r.catalogo.porEtapa.map((e) => <span key={e.etapa} className="chip chip-cinza">{e.etapa}º ano: {e.habilidades}</span>)}
        </div>
        <p className="mt-3 text-sm text-muted">
          Cada turma fica presa à versão do catálogo em que começou: uma versão nova não muda textos nem totais de anos anteriores.
          Um catálogo de exemplo com {r.catalogoDemonstrativo.itens} habilidades é usado só na conferência dos cálculos e não entra nos dados da escola.
        </p>
      </article>
    </div>
  );
}
