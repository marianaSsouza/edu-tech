import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ErroApi, FichaDto, SituacaoLacuna } from '../api';

const SITUACAO: Record<SituacaoLacuna, string> = {
  NAO_CONSOLIDADA: '○ Não consolidada',
  EM_DESENVOLVIMENTO: '◐ Em desenvolvimento',
  SEM_AVALIACAO: '— Sem avaliação registrada',
  CONSOLIDADA: '● Consolidada depois',
};

type Item = FichaDto['lacunas']['itens'][number];

/** PRO-05: lacunas com origem, situação e última marcação; ação de consolidar/reavaliar (tarefa 4.3). */
export function TabelaLacunas({ alunoId, itens, podeRegistrar }: { alunoId: number; itens: Item[]; podeRegistrar: boolean }) {
  const [aberto, setAberto] = useState<{ skillId: string; tipo: 'CONSOLIDACAO' | 'REAVALIACAO' } | null>(null);
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-1 pr-2">Habilidade</th><th className="pr-2">Origem</th><th className="pr-2">Situação</th><th className="pr-2">Última marcação</th>
            {podeRegistrar && <th>Ação</th>}
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <FragmentoLinha key={i.skillId} i={i} alunoId={alunoId} podeRegistrar={podeRegistrar}
              aberto={aberto?.skillId === i.skillId ? aberto.tipo : null}
              abrir={(tipo) => setAberto(tipo ? { skillId: i.skillId, tipo } : null)} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FragmentoLinha({ i, alunoId, podeRegistrar, aberto, abrir }: {
  i: Item; alunoId: number; podeRegistrar: boolean;
  aberto: 'CONSOLIDACAO' | 'REAVALIACAO' | null; abrir: (t: 'CONSOLIDACAO' | 'REAVALIACAO' | null) => void;
}) {
  return (
    <>
      <tr className="border-b border-line align-top">
        <td className="py-1.5 pr-2"><b>{i.skillId}</b> · {i.texto}</td>
        <td className="pr-2">{i.origem.etapa}º ano ({i.origem.anoLetivo})</td>
        <td className="pr-2 font-bold">{SITUACAO[i.situacao]}</td>
        <td className="pr-2">
          {i.ultima ? `${i.ultima.bimestre}º bim. ${i.ultima.anoLetivo} · ${i.ultima.autorNome}${i.ultima.tipo !== 'AVALIACAO' ? (i.ultima.tipo === 'CONSOLIDACAO' ? ' (consolidação)' : ' (reavaliação)') : ''}` : '—'}
          {i.ultima?.evidencia && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs font-bold text-brand">ver evidência</summary>
              <p className="mt-1 whitespace-pre-wrap text-xs">{i.ultima.evidencia}</p>
            </details>
          )}
        </td>
        {podeRegistrar && (
          <td className="whitespace-nowrap py-1">
            {i.pendente && <button type="button" className="btn-sec mr-1 text-xs" onClick={() => abrir('CONSOLIDACAO')}>Consolidar</button>}
            <button type="button" className="btn-sec text-xs" onClick={() => abrir('REAVALIACAO')}>Reavaliar</button>
          </td>
        )}
      </tr>
      {aberto && (
        <tr className="border-b border-line bg-brand-soft/40">
          <td colSpan={5} className="p-2">
            <FormEvento alunoId={alunoId} skillId={i.skillId} tipo={aberto} fechar={() => abrir(null)} />
          </td>
        </tr>
      )}
    </>
  );
}

function FormEvento({ alunoId, skillId, tipo, fechar }: { alunoId: number; skillId: string; tipo: 'CONSOLIDACAO' | 'REAVALIACAO'; fechar: () => void }) {
  const qc = useQueryClient();
  const [nivel, setNivel] = useState<number | null>(tipo === 'CONSOLIDACAO' ? 2 : null);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setErro(null);
    setEnviando(true);
    try {
      await api(`/alunos/${alunoId}/lacunas/${skillId}/eventos`, { method: 'POST', body: { tipo, nivel, justificativa: texto } });
      await qc.invalidateQueries({ queryKey: ['ficha'] });
      qc.invalidateQueries({ queryKey: ['painel'] });
      fechar();
    } catch (e) {
      setErro((e as ErroApi).message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="text-sm">
      <p className="font-bold">
        {tipo === 'CONSOLIDACAO' ? `Consolidar ${skillId} no bimestre atual` : `Reavaliar ${skillId} no bimestre atual`}
      </p>
      <p className="text-xs text-muted">É um registro novo, seu, no bimestre em andamento. A avaliação do ano de origem não muda.</p>
      {tipo === 'REAVALIACAO' && (
        <fieldset className="mt-2">
          <legend className="font-bold">Nível observado agora</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {[{ v: 0, r: '○ Não consolidada' }, { v: 1, r: '◐ Em desenvolvimento' }].map((o) => (
              <label key={o.v} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-1 has-[:checked]:border-brand has-[:checked]:font-extrabold">
                <input type="radio" name={`nivel-${skillId}`} checked={nivel === o.v} onChange={() => setNivel(o.v)} /> {o.r}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Se a criança consolidou, use "Consolidar".</p>
        </fieldset>
      )}
      <label htmlFor={`ev-${skillId}`} className="mt-2 block font-bold">Evidência / justificativa (obrigatória)</label>
      <textarea id={`ev-${skillId}`} rows={2} maxLength={2000} className="campo mt-1" value={texto} onChange={(e) => setTexto(e.target.value)} />
      {erro && <p role="alert" className="mt-1 text-warn">⚠ {erro}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" className="btn text-sm" disabled={enviando || !texto.trim() || nivel === null} onClick={enviar}>
          {enviando ? 'Salvando…' : 'Registrar'}
        </button>
        <button type="button" className="btn-sec text-sm" onClick={fechar}>Cancelar</button>
      </div>
    </div>
  );
}
