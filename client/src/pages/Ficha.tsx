import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api, Celula, FichaDto } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';
import { CartaoAtencao } from '../components/Atencao';
import { TabelaLacunas } from '../components/TabelaLacunas';
import { Disciplina, Titulo } from '../components/ui';

const HAB = ['Não consolidada', 'Em desenvolvimento', 'Consolidada'];
const SIMB = ['○', '◐', '●'];
const ESCRITA = ['Pré-silábico', 'Silábico', 'Silábico-alfabético', 'Alfabético'];
const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

/** PRO-03 / PRO-05: ficha do aluno — atenção, lacunas herdadas e histórico por ano (somente leitura). */
export default function Ficha() {
  const { id } = useParams();
  const q = useQuery({ queryKey: ['ficha', id], queryFn: () => api<FichaDto>(`/alunos/${id}/ficha`) });

  if (q.isLoading) return <Carregando texto="Carregando a ficha…" />;
  if (q.error) return <ErroCaixa erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const f = q.data!;
  const atual = f.linhaDoTempo[f.linhaDoTempo.length - 1];
  const turmaAtual = atual.turmas[atual.turmas.length - 1];

  return (
    <section>
      <Titulo avatar={f.aluno.nome} titulo={f.aluno.nome}
        sub={`${atual.contexto.etapa}º ano${turmaAtual ? ` · Turma ${turmaAtual.nome}` : ''} · ${atual.contexto.anoLetivo}`}
        acoes={<Link to={`/alunos/${f.aluno.id}/avaliacao?ano=${atual.contexto.anoLetivo}`} className="btn">Avaliar bimestre</Link>} />
      <nav aria-label="Seções da ficha" className="mt-5 flex flex-wrap gap-2">
        <a href="#atencao" className="chip chip-amarelo no-underline">Atenção</a>
        <a href="#lacunas" className="chip chip-lilas no-underline">Lacunas</a>
        <a href="#historico" className="chip chip-menta no-underline">Histórico</a>
      </nav>

      {f.historicoAnteriorIndisponivel && (
        <p className="card mt-6" role="note">ℹ Sem histórico antes de {f.linhaDoTempo[0].contexto.anoLetivo}.</p>
      )}

      <div id="atencao" className="scroll-mt-4"><CartaoAtencao alunoId={f.aluno.id} a={f.atencao} /></div>
      <div id="lacunas" className="scroll-mt-4"><Lacunas f={f} /></div>

      <h2 id="historico" className="mt-10 scroll-mt-4 text-2xl font-extrabold">Histórico</h2>
      <p className="mt-1 text-sm text-muted">○ Não consolidada · ◐ Em desenvolvimento · ● Consolidada · — Sem avaliação · ✎ Corrigida</p>
      {[...f.linhaDoTempo].reverse().map((ano) => <Ano key={ano.contexto.id} ano={ano} />)}
    </section>
  );
}

function Lacunas({ f }: { f: FichaDto }) {
  const { decomposicao: d, itens, eventos } = f.lacunas;
  const pendentes = itens.filter((i) => i.pendente);
  const consolidadas = itens.filter((i) => !i.pendente);

  return (
    <div className="card mt-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-extrabold">Lacunas dos anos anteriores</h2>
        {itens.length > 0 && (
          <span className={`chip px-4 py-1.5 text-base ${d.total === 0 ? 'chip-menta' : 'chip-amarelo'}`}>
            {d.total === 0 ? 'Nenhuma pendente' : `${d.total} ${d.total === 1 ? 'pendente' : 'pendentes'}`}
          </span>
        )}
      </div>
      {!itens.length && <p className="mt-1 text-muted">Nenhum ano anterior para herdar.</p>}
      {d.total > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {d.naoConsolidada > 0 && <span className="chip chip-cinza">○ {d.naoConsolidada} não consolidada{d.naoConsolidada > 1 ? 's' : ''}</span>}
          {d.emDesenvolvimento > 0 && <span className="chip chip-cinza">◐ {d.emDesenvolvimento} em desenvolvimento</span>}
          {d.semAvaliacao > 0 && <span className="chip chip-cinza">— {d.semAvaliacao} sem avaliação</span>}
        </div>
      )}
      {pendentes.length > 0 && <TabelaLacunas alunoId={f.aluno.id} itens={pendentes} podeRegistrar={f.lacunas.podeRegistrar} />}
      {consolidadas.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Já consolidadas ({consolidadas.length})</summary>
          <TabelaLacunas alunoId={f.aluno.id} itens={consolidadas} podeRegistrar={f.lacunas.podeRegistrar} />
        </details>
      )}
      {eventos.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Consolidações e reavaliações ({eventos.length})</summary>
          <ul className="mt-2 space-y-2 text-sm">
            {eventos.map((e) => (
              <li key={e.id} className="rounded-xl border border-line p-2">
                <b>{e.tipo === 'CONSOLIDACAO' ? 'Consolidada' : `Reavaliada: ${HAB[e.nivel]}`}</b> · {e.texto}
                <span className="block text-muted">{e.bimestre}º bim. {e.anoLetivo} · {e.autorNome}</span>
                <span className="block text-muted">{e.justificativa}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      {itens.length > 0 && (
        <details className="mt-3 text-sm text-muted">
          <summary className="cursor-pointer">Como funciona?</summary>
          <p className="mt-1">Habilidades dos anos já encerrados que não chegaram a "Consolidada". Vale a última avaliação. "Sem avaliação" conta como pendência, mas não é nota.</p>
        </details>
      )}
    </div>
  );
}

function CelulaNivel({ c, escrita }: { c: Celula | null; escrita?: boolean }) {
  if (!c) return <span className="text-muted" title="Sem avaliação">—<span className="sr-only"> Sem avaliação</span></span>;
  if (c.nivel === null) {
    // tarefa 3.4: resposta limpa — hoje é "Sem avaliação", mas a versão anterior fica em "Correções"
    return <span className="text-muted" title="Sem avaliação (resposta limpa)">— ✎<span className="sr-only"> Sem avaliação, resposta limpa</span></span>;
  }
  const rotulo = escrita ? ESCRITA[c.nivel] : HAB[c.nivel];
  return (
    <span title={`${rotulo} · ${c.autorNome}`}>
      {escrita ? <span className="text-xs">{rotulo}</span> : <><span aria-hidden="true">{SIMB[c.nivel]}</span><span className="sr-only">{rotulo}</span></>}
      {c.revisoes.length > 0 && <span title="Corrigida" aria-label="corrigida"> ✎</span>}
    </span>
  );
}

function Ano({ ano }: { ano: FichaDto['linhaDoTempo'][number] }) {
  const { contexto } = ano;
  const correcoes = [
    ...ano.habilidades.flatMap((h) => h.porBimestre.map((c, i) => ({ c, rotulo: h.texto, bim: i + 1, nomes: HAB }))),
    ...ano.escrita.map((c, i) => ({ c, rotulo: 'Escrita', bim: i + 1, nomes: ESCRITA })),
  ].filter((x) => x.c && x.c.revisoes.length);
  const titular = ano.professoras.filter((p) => p.tipo === 'TITULAR').map((p) => p.nome);
  const subst = ano.professoras.filter((p) => p.tipo === 'SUBSTITUTA').map((p) => p.nome);

  return (
    <article className="card mt-4">
      <h3 className="text-lg font-extrabold">
        {contexto.anoLetivo} · {contexto.etapa}º ano {ano.anoEncerrado && <span className="chip chip-cinza ml-1 text-xs">encerrado</span>}
      </h3>
      <p className="text-sm text-muted">
        Turma {ano.turmas.map((t) => t.nome).join(' → ')}{titular.length > 0 && ` · ${titular.join(', ')}`}{subst.length > 0 && ` · substituta: ${subst.join(', ')}`}
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Avaliações de {contexto.anoLetivo} por bimestre</caption>
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-1 pr-2">Habilidade</th>
              {ano.periodos.map((p) => (
                <th key={p.bimestre} className="px-1 text-center">{p.bimestre}º{p.situacao === 'FUTURO' && <span className="block text-xs">ainda não</span>}</th>
              ))}
              <th className="pl-2 text-center" title="Última avaliação do ano">Final</th>
            </tr>
          </thead>
          <tbody>
            {ano.habilidades.map((h) => (
              <tr key={h.id} className="border-b border-line">
                <td className="py-1.5 pr-2"><span className="flex items-center gap-2"><Disciplina area={h.area} /><span>{h.texto}</span></span></td>
                {h.porBimestre.map((c, i) => <td key={i} className="px-1 text-center text-base"><CelulaNivel c={c} /></td>)}
                <td className="pl-2 text-center font-bold">
                  {h.resumoAnual ? <>{SIMB[h.resumoAnual.nivel]}<span className="sr-only">{HAB[h.resumoAnual.nivel]}</span></> : '—'}
                </td>
              </tr>
            ))}
            <tr>
              <td className="py-1 pr-2 font-bold">Escrita</td>
              {ano.escrita.map((c, i) => <td key={i} className="px-1 text-center"><CelulaNivel c={c} escrita /></td>)}
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {correcoes.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Correções ({correcoes.length})</summary>
          <ul className="mt-1 space-y-1 text-sm">
            {correcoes.flatMap((x) => x.c!.revisoes.map((r, k) => (
              <li key={`${x.rotulo}-${x.bim}-${k}`}>
                <b>{x.rotulo}</b> · {x.bim}º bim.: {r.nivelAnterior === null ? 'sem avaliação' : x.nomes[r.nivelAnterior]} → {r.nivelNovo === null ? 'sem avaliação' : x.nomes[r.nivelNovo]}
                <span className="text-muted"> · {r.autorNome}, {data(r.em)} · “{r.justificativa}”</span>
              </li>
            )))}
          </ul>
        </details>
      )}

      {ano.ultimaObservacao ? (
        <p className="mt-3 text-sm">
          <b>Observação</b> <span className="text-muted">({ano.ultimaObservacao.bimestre}º bim., {ano.ultimaObservacao.autorNome}):</span> {ano.ultimaObservacao.texto}
        </p>
      ) : <p className="mt-3 text-sm text-muted">Sem observações.</p>}
      {ano.observacoes.length > 1 && (
        <details className="mt-1 text-sm">
          <summary className="cursor-pointer">Todas as observações ({ano.observacoes.length})</summary>
          <ul className="mt-1 space-y-1">
            {ano.observacoes.map((o) => <li key={o.id}><span className="text-muted">{o.bimestre}º bim., {o.autorNome}:</span> {o.texto}</li>)}
          </ul>
        </details>
      )}
    </article>
  );
}
