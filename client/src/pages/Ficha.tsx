import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api, Celula, FichaDto, SituacaoLacuna } from '../api';
import { Carregando, ErroCaixa } from '../components/Estado';
import { CartaoAtencao } from '../components/Atencao';

const HAB = ['Não consolidada', 'Em desenvolvimento', 'Consolidada'];
const SIMB = ['○', '◐', '●'];
const ESCRITA = ['Pré-silábico', 'Silábico', 'Silábico-alfabético', 'Alfabético'];
const SITUACAO: Record<SituacaoLacuna, string> = {
  NAO_CONSOLIDADA: '○ Não consolidada',
  EM_DESENVOLVIMENTO: '◐ Em desenvolvimento',
  SEM_AVALIACAO: '— Sem avaliação registrada',
  CONSOLIDADA: '● Consolidada depois',
};
const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

/** PRO-03 / PRO-05: ficha do aluno com lacunas herdadas e linha do tempo (somente leitura). */
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
      {turmaAtual && <Link to={`/turmas/${turmaAtual.id}`} className="text-sm">← {turmaAtual.nome}</Link>}
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{f.aluno.nome}</h1>
          <p className="text-muted">
            Hoje: {atual.contexto.etapa}º ano · ano letivo {atual.contexto.anoLetivo}{turmaAtual && ` · turma ${turmaAtual.nome}`}
          </p>
        </div>
        <Link to={`/alunos/${f.aluno.id}/avaliacao?ano=${atual.contexto.anoLetivo}`} className="btn no-underline">Avaliação por bimestre</Link>
      </div>

      {f.historicoAnteriorIndisponivel && (
        <p className="card mt-4" role="note">ℹ Histórico anterior indisponível: não há registros de anos anteriores a {f.linhaDoTempo[0].contexto.anoLetivo}. Nenhuma lacuna foi inventada para esse período.</p>
      )}

      <CartaoAtencao alunoId={f.aluno.id} a={f.atencao} />
      <Lacunas f={f} />

      <h2 className="mt-8 text-xl font-extrabold">Linha do tempo</h2>
      {[...f.linhaDoTempo].reverse().map((ano) => <Ano key={ano.contexto.id} ano={ano} />)}
    </section>
  );
}

function Lacunas({ f }: { f: FichaDto }) {
  const { decomposicao: d, itens, referencia, eventos } = f.lacunas;
  const pendentes = itens.filter((i) => i.pendente);
  const consolidadas = itens.filter((i) => !i.pendente);
  if (!itens.length) {
    return (
      <div className="card mt-4">
        <h2 className="text-lg font-extrabold">Lacunas herdadas</h2>
        <p className="mt-1 text-muted">Não há ano anterior encerrado nesta escola para herdar habilidades.</p>
      </div>
    );
  }
  const partes = [
    d.naoConsolidada && `${d.naoConsolidada} não consolidada${d.naoConsolidada > 1 ? 's' : ''}`,
    d.emDesenvolvimento && `${d.emDesenvolvimento} em desenvolvimento`,
    d.semAvaliacao && `${d.semAvaliacao} sem avaliação registrada`,
  ].filter(Boolean);

  return (
    <div className="card mt-4">
      <h2 className="text-lg font-extrabold">Lacunas herdadas</h2>
      <p className="mt-1 font-bold">
        {d.total === 0 ? 'Nenhuma pendência herdada.' : `${d.total} ${d.total === 1 ? 'pendência' : 'pendências'}: ${partes.join(' + ')}`}
      </p>
      <p className="text-sm text-muted">
        Situação até o {referencia.bimestre}º bimestre de {referencia.anoLetivo}. Habilidades dos anos anteriores encerrados; a última marcação vale, e ausência não é nível.
      </p>
      {pendentes.length > 0 && <TabelaLacunas itens={pendentes} />}
      {consolidadas.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Herdadas já consolidadas ({consolidadas.length})</summary>
          <TabelaLacunas itens={consolidadas} />
        </details>
      )}
      {eventos.length > 0 && (
        <>
          <h3 className="mt-4 font-extrabold">Consolidações e reavaliações registradas</h3>
          <ul className="mt-1 space-y-2 text-sm">
            {eventos.map((e) => (
              <li key={e.id} className="rounded-lg border border-line p-2">
                <b>{e.tipo === 'CONSOLIDACAO' ? 'Consolidação' : 'Reavaliação'}</b> de <b>{e.skillId}</b> ({e.texto}) —{' '}
                {SIMB[e.nivel]} {HAB[e.nivel]} no {e.bimestre}º bimestre de {e.anoLetivo}
                {e.origemAnoLetivo && `, lacuna de ${e.origemAnoLetivo}`}. Por {e.autorNome} em {data(e.em)}.
                <span className="block text-muted">Evidência: {e.justificativa}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TabelaLacunas({ itens }: { itens: FichaDto['lacunas']['itens'] }) {
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-1 pr-2">Habilidade</th><th className="pr-2">Origem</th><th className="pr-2">Situação</th><th>Última marcação</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.skillId} className="border-b border-line align-top">
              <td className="py-1.5 pr-2"><b>{i.skillId}</b> · {i.texto}</td>
              <td className="pr-2">{i.origem.etapa}º ano ({i.origem.anoLetivo})</td>
              <td className="pr-2 font-bold">{SITUACAO[i.situacao]}</td>
              <td>{i.ultima ? `${i.ultima.bimestre}º bim. ${i.ultima.anoLetivo} · ${i.ultima.autorNome}` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CelulaNivel({ c, escrita }: { c: Celula | null; escrita?: boolean }) {
  if (!c) return <span className="text-muted" title="Sem avaliação">—<span className="sr-only"> Sem avaliação</span></span>;
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
    ...ano.habilidades.flatMap((h) => h.porBimestre.map((c, i) => ({ c, rotulo: h.id, bim: i + 1, nomes: HAB }))),
    ...ano.escrita.map((c, i) => ({ c, rotulo: 'Escrita', bim: i + 1, nomes: ESCRITA })),
  ].filter((x) => x.c && x.c.revisoes.length);

  return (
    <article className="card mt-4">
      <h3 className="text-lg font-extrabold">
        {contexto.anoLetivo} · {contexto.etapa}º ano {ano.anoEncerrado && <span className="text-sm font-semibold text-muted">· ano encerrado</span>}
      </h3>
      <p className="text-sm text-muted">
        Turma {ano.turmas.map((t) => t.nome).join(' → ')} · {ano.professoras.map((p) => `${p.nome} (${p.tipo === 'TITULAR' ? 'titular' : 'substituta'})`).join(', ')} · catálogo {contexto.catalogo}
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
              <th className="pl-2 text-center">Resumo anual</th>
            </tr>
          </thead>
          <tbody>
            {ano.habilidades.map((h) => (
              <tr key={h.id} className="border-b border-line">
                <td className="py-1 pr-2"><b>{h.id}</b> <span className="text-muted">{h.texto}</span></td>
                {h.porBimestre.map((c, i) => <td key={i} className="px-1 text-center text-base"><CelulaNivel c={c} /></td>)}
                <td className="pl-2 text-center font-bold">
                  {h.resumoAnual ? <>{SIMB[h.resumoAnual.nivel]} <span className="sr-only">{HAB[h.resumoAnual.nivel]}</span><span className="text-xs text-muted">({h.resumoAnual.bimestre}º)</span></> : '—'}
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
      <p className="mt-2 text-xs text-muted">○ Não consolidada · ◐ Em desenvolvimento · ● Consolidada · — Sem avaliação · ✎ corrigida. O resumo anual usa a última marcação do ano; não é o 4º bimestre.</p>

      {correcoes.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer font-bold">Correções neste ano ({correcoes.length})</summary>
          <ul className="mt-1 space-y-1 text-sm">
            {correcoes.flatMap((x) => x.c!.revisoes.map((r, k) => (
              <li key={`${x.rotulo}-${x.bim}-${k}`}>
                <b>{x.rotulo}</b>, {x.bim}º bimestre: de <i>{r.nivelAnterior === null ? 'sem avaliação' : x.nomes[r.nivelAnterior]}</i> para{' '}
                <i>{r.nivelNovo === null ? 'sem avaliação' : x.nomes[r.nivelNovo]}</i>, por {r.autorNome} em {data(r.em)}. Justificativa: {r.justificativa}
              </li>
            )))}
          </ul>
        </details>
      )}

      <h4 className="mt-4 font-extrabold">Observações</h4>
      {ano.ultimaObservacao ? (
        <p className="mt-1 text-sm">
          <span className="text-muted">Última ({ano.ultimaObservacao.bimestre}º bim., {ano.ultimaObservacao.autorNome}):</span> {ano.ultimaObservacao.texto}
        </p>
      ) : <p className="mt-1 text-sm text-muted">Nenhuma observação neste ano.</p>}
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
