import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** Iniciais para o avatar ("Ana Clara" → "AC", "Profª Beatriz" → "B"). */
export function iniciais(nome: string, max = 2): string {
  const partes = nome.replace(/^(Profª|Prof\.?|Profa\.?)\s+/i, '').split(/\s+/).filter(Boolean);
  if (partes.length === 1 && max > 1) return partes[0]!.slice(0, max).toUpperCase(); // 'Bernardo' → 'BE'
  return partes.slice(0, max).map((p) => p[0]!.toUpperCase()).join('');
}

export function Avatar({ nome, tamanho = 'md', cor = 'degrade' }: { nome: string; tamanho?: 'sm' | 'md' | 'lg'; cor?: 'degrade' | 'amarelo' }) {
  const t = tamanho === 'lg' ? 'h-16 w-16 text-xl' : tamanho === 'sm' ? 'h-9 w-9 text-sm' : 'h-12 w-12 text-base';
  const c = cor === 'amarelo' ? 'bg-amarelo text-ink' : 'degrade text-white';
  return (
    <span aria-hidden="true" className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold ${t} ${c}`}>
      {iniciais(nome, cor === 'amarelo' ? 1 : 2)}
    </span>
  );
}

export function Migalhas({ itens }: { itens: Array<{ rotulo: string; para?: string }> }) {
  return (
    <nav aria-label="Você está em" className="text-sm text-muted">
      {itens.map((i, k) => (
        <span key={k}>
          {k > 0 && <span className="mx-1">/</span>}
          {i.para ? <Link to={i.para} className="font-semibold underline">{i.rotulo}</Link> : <span aria-current="page">{i.rotulo}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Titulo({ sobre, titulo, sub, acoes, avatar }: { sobre?: ReactNode; titulo: ReactNode; sub?: ReactNode; acoes?: ReactNode; avatar?: string }) {
  return (
    <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        {avatar && <Avatar nome={avatar} tamanho="lg" />}
        <div>
          {sobre && <p className="text-sm text-muted">{sobre}</p>}
          <h1 className="text-3xl font-extrabold sm:text-4xl">{titulo}</h1>
          {sub && <p className="mt-1 text-muted sm:text-lg">{sub}</p>}
        </div>
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </div>
  );
}

/** Barra de progresso com texto acessível (o valor também aparece em texto ao lado). */
export function Progresso({ n, d, rotulo }: { n: number; d: number; rotulo: string }) {
  const pct = d === 0 ? 0 : (100 * n) / d;
  return (
    <div className="barra-trilho w-full" role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={d} aria-valuenow={n}>
      <div className="barra-cheia" style={{ width: `${pct}%` }} />
    </div>
  );
}
