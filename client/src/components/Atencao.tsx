import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, AtencaoManual, ErroApi, FichaDto } from '../api';

const ESCRITA = ['Pré-silábico', 'Silábico', 'Silábico-alfabético', 'Alfabético'];
const TIPO = { COMENTARIO: 'Comentário', ENCERRAMENTO: 'Encerrada', REABERTURA: 'Reaberta', CORRECAO: 'Texto anterior' };
const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

/** PRO-03 / PRO-06: motivos de atenção e o ciclo da atenção manual (RN08, RN09), em poucas palavras. */
export function CartaoAtencao({ alunoId, a }: { alunoId: number; a: FichaDto['atencao'] }) {
  const ativas = a.manuais.filter((m) => m.situacao === 'ABERTA');
  const emAtencao = a.estado === 'EM_ATENCAO';
  const titulo = emAtencao ? '⚑ Em atenção' : a.estado === 'INCOMPLETA' ? '… Falta avaliar a escrita' : '✓ Nada a acompanhar agora';

  return (
    <div className={`card mt-6 ${emAtencao ? 'border-2 border-amarelo' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-extrabold">Atenção</h2>
        <span className={`chip px-4 py-1.5 text-base ${emAtencao ? 'chip-amarelo' : a.estado === 'INCOMPLETA' ? 'chip-lilas' : 'chip-menta'}`}>{titulo}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{a.referencia.bimestre}º bimestre de {a.referencia.anoLetivo}</p>

      {(emAtencao || a.escritaAusente) && (
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          {a.motivos.includes('LACUNAS') && <li className="chip chip-amarelo">{a.lacunasPendentes} lacunas pendentes</li>}
          {a.motivos.includes('ESCRITA') && a.escrita !== null && (
            <li className="chip chip-amarelo">Escrita: {ESCRITA[a.escrita]} (esperado: {ESCRITA[a.minimoEscrita]})</li>
          )}
          {a.motivos.includes('MANUAL') && <li className="chip chip-amarelo">{ativas.length} atenção manual{ativas.length > 1 ? 's' : ''}</li>}
          {a.escritaAusente && <li className="chip chip-lilas">Escrita sem avaliação neste bimestre</li>}
        </ul>
      )}
      <details className="mt-2 text-sm text-muted">
        <summary className="cursor-pointer">Quando aparece?</summary>
        <p className="mt-1">Com {a.limiteLacunas} ou mais lacunas, escrita abaixo de {ESCRITA[a.minimoEscrita]} neste bimestre, ou atenção aberta por uma professora.</p>
      </details>

      <h3 className="mt-4 font-extrabold">Atenções manuais</h3>
      {a.manuais.length === 0 && <p className="text-sm text-muted">Nenhuma.</p>}
      <ul className="mt-1 space-y-2">
        {a.manuais.map((m) => <ItemManual key={m.id} m={m} podeAgir={a.podeAgir} />)}
      </ul>
      {a.podeAgir ? <NovaAtencao alunoId={alunoId} /> : (
        <p className="mt-2 text-xs text-muted">Só a professora da turma pode alterar.</p>
      )}
    </div>
  );
}

function useAcao() {
  const qc = useQueryClient();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const executar = async (fn: () => Promise<unknown>) => {
    setErro(null);
    setEnviando(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ['ficha'] });
      qc.invalidateQueries({ queryKey: ['painel'] });
      return true;
    } catch (e) {
      setErro((e as ErroApi).message);
      return false;
    } finally {
      setEnviando(false);
    }
  };
  return { erro, enviando, executar };
}

function ItemManual({ m, podeAgir }: { m: AtencaoManual; podeAgir: boolean }) {
  const [acao, setAcao] = useState<keyof typeof TIPO | null>(null);
  const [texto, setTexto] = useState('');
  const { erro, enviando, executar } = useAcao();
  const enviar = async () => {
    const pedido = acao === 'CORRECAO'
      ? api(`/atencoes/${m.id}/correcao`, { method: 'POST', body: { texto } })
      : api(`/atencoes/${m.id}/eventos`, { method: 'POST', body: { tipo: acao, texto } });
    if (await executar(() => pedido)) {
      setAcao(null);
      setTexto('');
    }
  };

  return (
    <li className="rounded-lg border border-line p-3 text-sm">
      <p>
        <b>{m.situacao === 'ABERTA' ? '● Ativa' : '○ Encerrada'}</b> <span className="text-muted">· {m.autorNome}, {data(m.em)}</span>
      </p>
      <p className="mt-1">{m.justificativa}</p>
      {m.eventos.length > 0 && (
        <ul className="mt-2 space-y-1 border-l-2 border-line pl-3">
          {m.eventos.map((e) => (
            <li key={e.id}><span className="text-muted">{TIPO[e.tipo]} · {e.autorNome} · {data(e.em)}:</span> {e.texto}</li>
          ))}
        </ul>
      )}
      {podeAgir && !acao && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="btn-sec text-sm" onClick={() => setAcao('COMENTARIO')}>Comentar</button>
          {m.situacao === 'ABERTA'
            ? <button type="button" className="btn-sec text-sm" onClick={() => setAcao('ENCERRAMENTO')}>Encerrar</button>
            : <button type="button" className="btn-sec text-sm" onClick={() => setAcao('REABERTURA')}>Reabrir</button>}
          {m.minha && <button type="button" className="btn-sec text-sm" onClick={() => { setAcao('CORRECAO'); setTexto(m.justificativa); }}>Corrigir texto</button>}
        </div>
      )}
      {acao && (
        <div className="mt-2">
          <label htmlFor={`acao-${m.id}`} className="font-bold">
            {acao === 'COMENTARIO' ? 'Comentário' : acao === 'ENCERRAMENTO' ? 'Por que encerrar?'
              : acao === 'CORRECAO' ? 'Texto corrigido' : 'Motivo da reabertura'}
          </label>
          <textarea id={`acao-${m.id}`} autoFocus rows={2} maxLength={2000} className="campo mt-1" value={texto} onChange={(e) => setTexto(e.target.value)} />
          {erro && <p role="alert" className="mt-1 text-warn">⚠ {erro}</p>}
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn text-sm" disabled={enviando || !texto.trim()} onClick={enviar}>{enviando ? 'Salvando…' : 'Salvar'}</button>
            <button type="button" className="btn-sec text-sm" onClick={() => { setAcao(null); setTexto(''); }}>Cancelar</button>
          </div>
        </div>
      )}
    </li>
  );
}

function NovaAtencao({ alunoId }: { alunoId: number }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState('');
  const { erro, enviando, executar } = useAcao();
  if (!aberto) return <button type="button" className="btn-sec mt-3 text-sm" onClick={() => setAberto(true)}>+ Nova atenção</button>;
  const enviar = async () => {
    if (await executar(() => api(`/alunos/${alunoId}/atencoes`, { method: 'POST', body: { justificativa: texto } }))) {
      setAberto(false);
      setTexto('');
    }
  };
  return (
    <div className="mt-3">
      <label htmlFor="nova-atencao" className="font-bold">Por que acompanhar?</label>
      <textarea id="nova-atencao" autoFocus rows={3} maxLength={2000} className="campo mt-1" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {erro && <p role="alert" className="mt-1 text-warn">⚠ {erro}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn text-sm" disabled={enviando || !texto.trim()} onClick={enviar}>{enviando ? 'Salvando…' : 'Abrir atenção'}</button>
        <button type="button" className="btn-sec text-sm" onClick={() => { setAberto(false); setTexto(''); }}>Cancelar</button>
      </div>
    </div>
  );
}
