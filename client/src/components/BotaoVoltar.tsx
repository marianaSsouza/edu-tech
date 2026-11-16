import { useLocation, useNavigate } from 'react-router-dom';
import { IconeSeta } from './Icones';

/** Para onde "Voltar" leva quando a pessoa abriu a página direto (sem tela anterior no histórico). */
function telaDeCima(pathname: string): string {
  const avaliacao = pathname.match(/^\/alunos\/(\d+)\/avaliacao/);
  if (avaliacao) return `/alunos/${avaliacao[1]}`;
  if (/^\/alunos\/\d+/.test(pathname)) return '/alunos';
  return '/';
}

/**
 * Botão "Voltar" de todas as telas internas: volta para a tela anterior, como o botão do navegador.
 * A tela de avaliação continua avisando se houver alterações não salvas (o bloqueio dela vale aqui também).
 */
export function BotaoVoltar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const temAnterior = ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0;

  return (
    <button type="button" className="btn-sec mb-4 gap-1.5 py-2 pl-3 pr-5"
      onClick={() => (temAnterior ? navigate(-1) : navigate(telaDeCima(pathname)))}>
      <IconeSeta para="esq" /> Voltar
    </button>
  );
}
