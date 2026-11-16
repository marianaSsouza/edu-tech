import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, AtencaoManual, ErroApi, FichaDto } from '../api';

const ESCRITA = ['Pré-silábico', 'Silábico', 'Silábico-alfabético', 'Alfabético'];
const TIPO = { COMENTARIO: 'Comentário', ENCERRAMENTO: 'Encerramento', REABERTURA: 'Reabertura' };
const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

/** PRO-03 / PRO-06: todos os motivos de atenção e o ciclo da atenção manual (RN08, RN09). */
export function CartaoAtencao({ alunoId, a }: { alunoId: number; a: FichaDto['atencao'] }) {
  const ref = `${a.referencia.etapa}º ano, ${a.referencia.bimestre}º bimestre de ${a.referencia.anoLetivo}`;
  const ativas = a.manuais.filter((m) => m.situacao === 'ABERTA');
  const titulo =
    a.estado === 'EM_ATENCAO' ? '⚑ Em atenção'
    : a.estado === 'INCOMPLETA' ? '… Atenção automática não concluída: escrita sem avaliação'
    : '✓ Sem sinal de atenção nos dados disponíveis';

  return (
    <div className={`card mt-6 ${a.estado === 'EM_ATENCAO' ? 'border-2 border-amarelo' : ''}`}>
      <h2 className="text-2xl font-extrabold">Atenção pedagógica</h2>
      <p className={`mt-1 font-extrabold ${a.estado === 'EM_ATENCAO' ? 'text-warn' : ''}`}>{titulo}</p>
      <p className="text-sm text-muted">Referência: {ref}.</p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
        {a.motivos.includes('LACUNAS') && <li><b>Lacunas herdadas:</b> {a.lacunasPendentes} pendências (sinaliza a partir de {a.limiteLacunas}).</li>}
        {a.motivos.includes('ESCRITA') && a.escrita !== null && (
          <li><b>Escrita:</b> {ESCRITA[a.escrita]}, abaixo do mínimo esperado ({ESCRITA[a.minimoEscrita]}).</li>
        )}
        {a.motivos.includes('MANUAL') && <li><b>Atenção manual:</b> {ativas.length} {ativas.length === 1 ? 'ativa' : 'ativas'}.</li>}
        {a.escritaAusente && <li><b>Sem avaliação de escrita</b> neste bimestre: a comparação com o mínimo ({ESCRITA[a.minimoEscrita]}) está indeterminada.</li>}
        {!a.motivos.includes('LACUNAS') && <li className="text-muted">Lacunas herdadas pendentes: {a.lacunasPendentes} (sinaliza a partir de {a.limiteLacunas}).</li>}
        {!a.escritaAusente && !a.motivos.includes('ESCRITA') && a.escrita !== null && (
          <li className="text-muted">Escrita: {ESCRITA[a.escrita]} (mínimo {ESCRITA[a.minimoEscrita]}).</li>
        )}
      </ul>

      <h3 className="mt-4 font-extrabold">Atenções manuais</h3>
      {a.manuais.length === 0 && <p className="text-sm text-muted">Nenhuma atenção manual registrada.</p>}
      <ul className="mt-1 space-y-2">
        {a.manuais.map((m) => <ItemManual key={m.id} m={m} podeAgir={a.podeAgir} />)}
      </ul>
      {a.podeAgir ? <NovaAtencao alunoId={alunoId} /> : (
        <p className="mt-2 text-xs text-muted">Somente consulta. Abrir, comentar, encerrar e reabrir cabem à professora com vínculo atual.</p>
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
    if (await executar(() => api(`/atencoes/${m.id}/eventos`, { method: 'POST', body: { tipo: acao, texto } }))) {
      setAcao(null);
      setTexto('');
    }
  };

  return (
    <li className="rounded-lg border border-line p-3 text-sm">
      <p>
        <b>{m.situacao === 'ABERTA' ? '● Ativa' : '○ Encerrada'}</b> · aberta por {m.autorNome} em {data(m.em)} ({m.bimestre}º bim. {m.anoLetivo})
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
        </div>
      )}
      {acao && (
        <div className="mt-2">
          <label htmlFor={`acao-${m.id}`} className="font-bold">
            {acao === 'COMENTARIO' ? 'Comentário' : acao === 'ENCERRAMENTO' ? 'Justificativa do encerramento' : 'Motivo da reabertura'}
          </label>
          <textarea id={`acao-${m.id}`} rows={2} maxLength={2000} className="campo mt-1" value={texto} onChange={(e) => setTexto(e.target.value)} />
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
  if (!aberto) return <button type="button" className="btn-sec mt-3 text-sm" onClick={() => setAberto(true)}>+ Abrir atenção manual</button>;
  const enviar = async () => {
    if (await executar(() => api(`/alunos/${alunoId}/atencoes`, { method: 'POST', body: { justificativa: texto } }))) {
      setAberto(false);
      setTexto('');
    }
  };
  return (
    <div className="mt-3">
      <label htmlFor="nova-atencao" className="font-bold">Justificativa da nova atenção (1 a 2.000 caracteres)</label>
      <textarea id="nova-atencao" rows={3} maxLength={2000} className="campo mt-1" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {erro && <p role="alert" className="mt-1 text-warn">⚠ {erro}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn text-sm" disabled={enviando || !texto.trim()} onClick={enviar}>{enviando ? 'Salvando…' : 'Abrir atenção'}</button>
        <button type="button" className="btn-sec text-sm" onClick={() => { setAberto(false); setTexto(''); }}>Cancelar</button>
      </div>
    </div>
  );
}
