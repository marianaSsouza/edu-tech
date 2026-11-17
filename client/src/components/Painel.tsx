import { Fracao, Indicadores, ReferenciaPainel, Situacao } from '../api';

const fmt = (f: Fracao) => (f.percentual === null ? 'Sem dados (0/0)' : `${f.percentual} (${f.n}/${f.d})`);
const largura = (n: number, d: number) => (d === 0 ? '0%' : `${(100 * n) / d}%`); // fração original, sem ajuste

export function textoReferencia(r: ReferenciaPainel) {
  const data = r.data.split('-').reverse().join('/');
  if (r.situacao === 'FUTURO') return `${r.bimestre}º bimestre de ${r.anoLetivo}: ainda não começou.`;
  return `${r.bimestre}º bimestre de ${r.anoLetivo} · matrícula em ${data}${r.situacao === 'ENCERRADO' ? ' (último dia do bimestre)' : ' (hoje)'}`;
}

/** Seletor de bimestre acessível (botões com aria-current); situação em texto, não só cor. */
export function SeletorBimestre({ periodos, atual, onEscolher }: {
  periodos: Array<{ bimestre: number; situacao: Situacao }>; atual: number; onEscolher: (b: number) => void;
}) {
  const rotulo: Record<Situacao, string> = { DISPONIVEL: 'aberto', FECHADO: 'fechado', FUTURO: 'ainda não' };
  return (
    <nav aria-label="Bimestre" className="flex flex-wrap gap-2">
      {periodos.map((p) => (
        <button key={p.bimestre} type="button" aria-current={p.bimestre === atual ? 'page' : undefined} onClick={() => onEscolher(p.bimestre)}
          className="aba">
          {p.bimestre}º bim. <span className="text-xs opacity-75">({rotulo[p.situacao]})</span>
        </button>
      ))}
    </nav>
  );
}

export function AgregadoOculto({ N, minimo }: { N: number; minimo: number }) {
  return (
    <p className="rounded-lg border border-dashed border-line bg-white px-3 py-2 text-sm" role="note">
      🔒 <b>Números ocultos: turma com menos de {minimo} alunos</b> ({N}). A ficha de cada aluno continua disponível.
    </p>
  );
}

/** Barra C/D/NC/U: larguras pelas frações originais; U em branco hachurado; legenda com contagens. */
export function BarraPares({ p }: { p: Indicadores['pares'] }) {
  const partes = [
    { k: 'C', n: p.C, rotulo: 'Consolidada', cls: 'bg-nivel2' },
    { k: 'D', n: p.D, rotulo: 'Em desenvolvimento', cls: 'bg-nivel1' },
    { k: 'NC', n: p.NC, rotulo: 'Não consolidada', cls: 'bg-nivel0' },
    { k: 'U', n: p.U, rotulo: 'Sem avaliação', cls: 'bg-white bg-[repeating-linear-gradient(45deg,#e4e0d6_0_4px,transparent_4px_8px)]' },
  ];
  return (
    <figure className="mt-2">
      <div className="flex h-5 overflow-hidden rounded-md border border-line" role="img"
        aria-label={partes.map((x) => `${x.rotulo}: ${x.n} de ${p.T}`).join('; ')}>
        {partes.map((x) => x.n > 0 && <div key={x.k} className={x.cls} style={{ width: largura(x.n, p.T) }} />)}
      </div>
      <figcaption className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {partes.map((x) => (
          <span key={x.k} className="flex items-center gap-1">
            <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm border border-line ${x.cls}`} /> {x.rotulo}: <b>{x.n}</b>
          </span>
        ))}
        <span className="text-muted">Total de pares aluno/habilidade: {p.T}</span>
      </figcaption>
    </figure>
  );
}

export function Cartoes({ i }: { i: Indicadores }) {
  const itens = [
    { t: 'Consolidação', v: fmt(i.consolidacao), d: 'pares consolidados / previstos' },
    { t: 'Cobertura de habilidades', v: fmt(i.coberturaHabilidades), d: 'pares com avaliação / previstos' },
    { t: 'Escrita alfabética', v: fmt(i.escritaAlfabetica), d: `${i.escritaAusente} sem escrita registrada` },
    { t: 'Cobertura de escrita', v: fmt(i.coberturaEscrita), d: 'alunos com escrita / N' },
    { t: 'Em atenção', v: fmt(i.emAtencao), d: 'crianças distintas (vários motivos contam 1)' },
    { t: 'Atenção não concluída', v: String(i.atencaoIncompleta), d: 'sem escrita e sem outro motivo' },
  ];
  return (
    <>
      {i.semAvaliacoes && <p className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn" role="note">⚠ Sem avaliações registradas neste bimestre. Os 0,0% indicam falta de registro, não desempenho.</p>}
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {itens.map((x) => (
          <div key={x.t} className="rounded-2xl border border-line bg-gradient-to-br from-white to-[#f2f7fb] p-4">
            <dt className="text-xs font-bold text-muted">{x.t}</dt>
            <dd className="text-xl font-extrabold">{x.v}</dd>
            <dd className="text-xs text-muted">{x.d}</dd>
          </div>
        ))}
      </dl>
      <BarraPares p={i.pares} />
    </>
  );
}
