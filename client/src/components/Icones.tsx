/** Ícones de traço simples (desenho próprio), herdam a cor do texto. Decorativos: aria-hidden. */
const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const IconePainel = () => (
  <svg {...base}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>
);
export const IconeTurmas = () => (
  <svg {...base}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.5s5.9 2 6.5 5.5" /><path d="M16 4.8a3.3 3.3 0 0 1 0 6.4" /><path d="M18 14.8c2 .7 3.2 2.4 3.5 5.2" /></svg>
);
export const IconeAluno = () => (
  <svg {...base}><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4 3.6-6.5 7.5-6.5s6.8 2.5 7.5 6.5" /></svg>
);
export const IconeCalendario = () => (
  <svg {...base}><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
);
export const IconeRegras = () => (
  <svg {...base}><path d="M5 3.5h10l4 4V20.5H5z" /><path d="M14.5 3.5v4.5h4.5M8.5 12.5h7M8.5 16h7" /></svg>
);
export const IconeBusca = () => (
  <svg {...base} width={20} height={20}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const IconeMenu = () => (
  <svg {...base}><path d="M4 6.5h16M4 12h16M4 17.5h16" /></svg>
);
export const IconeSeta = ({ para }: { para: 'esq' | 'dir' }) => (
  <svg {...base} width={20} height={20}><path d={para === 'esq' ? 'm14.5 5-7 7 7 7' : 'm9.5 5 7 7-7 7'} /></svg>
);

/** Marca: o "fio" amarelo. */
export function Marca({ tamanho = 56 }: { tamanho?: number }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center rounded-full bg-amarelo text-ink" style={{ width: tamanho, height: tamanho }}>
      <svg width={tamanho * 0.5} height={tamanho * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M3 15c2.5-4 4.5-4 6 0s3.5 4 6 0 4.2-4.5 6-2" />
      </svg>
    </span>
  );
}
export const IconeGestao = () => (
  <svg {...base}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" /></svg>
);
