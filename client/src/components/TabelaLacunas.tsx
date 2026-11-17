import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, ErroApi, FichaDto, SituacaoLacuna } from '../api';
import { Disciplina } from './ui';

const SITUACAO: Record<SituacaoLacuna, string> = {
  NAO_CONSOLIDADA: '○ Não consolidada',
  EM_DESENVOLVIMENTO: '◐ Em desenvolvimento',
  SEM_AVALIACAO: '— Sem avaliação',
  CONSOLIDADA: '● Consolidada',
};

type Item = FichaDto['lacunas']['itens'][number];

/** PRO-05: lacunas em lista (uma por cartão): disciplina, habilidade, situação, última avaliação e ações (tarefa 4.3). */
export function TabelaLacunas({ alunoId, itens, podeRegistrar }: { alunoId: number; itens: Item[]; podeRegistrar: boolean }) {
  const [aberto, setAberto] = useState<{ skillId: string; tipo: 'CONSOLIDACAO' | 'REAVALIACAO' } | null>(null);
  return (
    <ul className="mt-3 space-y-3">
      {itens.map((i) => (
        <li key={i.skillId} className="rounded-2xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Disciplina area={i.skillId} />
                <span className={`chip px-2.5 py-0.5 text-xs ${i.situacao === 'CONSOLIDADA' ? 'chip-menta' : i.situacao === 'SEM_AVALIACAO' ? 'chip-cinza' : 'chip-amarelo'}`}>{SITUACAO[i.situacao]}</span>
              </div>
              <p className="mt-1.5 text-base font-bold">{i.texto}</p>
              <p className="mt-0.5 text-sm text-muted">
                Do {i.origem.etapa}º ano ({i.origem.anoLetivo})
                {i.ultima && <> · última avaliação: {i.ultima.bimestre}º bim. {i.ultima.anoLetivo}, {i.ultima.autorNome}</>}
              </p>
              {i.ultima?.evidencia && (
                <details className="mt-1 text-sm">
                  <summary className="cursor-pointer font-bold text-azul-escuro">Ver evidência</summary>
                  <p className="mt-1 whitespace-pre-wrap">{i.ultima.evidencia}</p>
                </details>
              )}
            </div>
            {podeRegistrar && (
              <div className="flex shrink-0 gap-2">
                {i.pendente && <button type="button" className="btn-sec px-3 py-1.5 text-sm" onClick={() => setAberto({ skillId: i.skillId, tipo: 'CONSOLIDACAO' })}>Consolidar</button>}
                <button type="button" className="btn-sec px-3 py-1.5 text-sm" onClick={() => setAberto({ skillId: i.skillId, tipo: 'REAVALIACAO' })}>Reavaliar</button>
              </div>
            )}
          </div>
          {aberto?.skillId === i.skillId && (
            <div className="mt-3 rounded-2xl bg-bg p-3">
              <FormEvento alunoId={alunoId} skillId={i.skillId} texto={i.texto} tipo={aberto.tipo} fechar={() => setAberto(null)} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function FormEvento({ alunoId, skillId, texto: nomeHab, tipo, fechar }: { alunoId: number; skillId: string; texto: string; tipo: 'CONSOLIDACAO' | 'REAVALIACAO'; fechar: () => void }) {
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
        {tipo === 'CONSOLIDACAO' ? 'Consolidar' : 'Reavaliar'}: {nomeHab}
      </p>
      <p className="text-xs text-muted">Fica registrado neste bimestre; o ano de origem não muda.</p>
      {tipo === 'REAVALIACAO' && (
        <fieldset className="mt-2">
          <legend className="font-bold">Nível agora</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {[{ v: 0, r: '○ Não consolidada' }, { v: 1, r: '◐ Em desenvolvimento' }].map((o) => (
              <label key={o.v} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-1 has-[:checked]:border-brand has-[:checked]:font-extrabold">
                <input type="radio" name={`nivel-${skillId}`} checked={nivel === o.v} onChange={() => setNivel(o.v)} /> {o.r}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label htmlFor={`ev-${skillId}`} className="mt-2 block font-bold">O que você observou?</label>
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
