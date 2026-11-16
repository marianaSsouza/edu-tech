import { ErroApi } from '../api';

/** Estados distintos de carregando / erro / acesso negado (RNF-04, PRO-04). Não dependem só de cor. */
export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return <p className="text-muted" role="status">⏳ {texto}</p>;
}

export function ErroCaixa({ erro, tentarDeNovo }: { erro: unknown; tentarDeNovo?: () => void }) {
  const e = erro as ErroApi;
  const titulo =
    e?.status === 403 ? 'Acesso negado' : e?.status === 404 ? 'Não encontrado' : e?.status === 0 ? 'Sem conexão' : 'Algo deu errado';
  return (
    <div className="card border-warn" role="alert">
      <h2 className="text-lg font-extrabold">⚠ {titulo}</h2>
      <p className="mt-1">{e?.message ?? String(erro)}</p>
      {tentarDeNovo && e?.status !== 403 && (
        <button type="button" className="btn-sec mt-3" onClick={tentarDeNovo}>Tentar de novo</button>
      )}
    </div>
  );
}
