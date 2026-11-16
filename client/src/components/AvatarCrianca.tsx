/**
 * Ilustração fictícia de uma criança de 5 a 7 anos (desenho próprio em SVG, sem fotos nem imagens externas).
 * A aparência sai do nome por uma conta fixa: a mesma criança tem sempre o mesmo desenho.
 * É só decoração — o nome aparece sempre em texto ao lado (aria-hidden).
 */

const FUNDOS = ['#fde9a8', '#d6e8ff', '#e3e6ff', '#cdf3ea', '#fde0dc', '#e6e1ff', '#fff1c9'];
const PELES = ['#f9d4b4', '#f1c09a', '#e0a77c', '#c98a5e', '#a86b43', '#7d4b2a'];
const CABELOS = ['#2b1a12', '#4a2c1a', '#6b3f22', '#a0632b', '#d9a441', '#1d1d1d'];
const ROUPAS = ['#f08a6a', '#4f8fe8', '#a77ce8', '#1fa982', '#f6b23d', '#ef6f9c', '#6fc56a'];
const LACOS = ['#ef5d7a', '#f6b23d', '#7c5cf0', '#1fa982'];

/**
 * Penteado de menino ou de menina para os nomes da escola fictícia (pedido da usuária: o desenho deve
 * combinar com o nome). Nomes fora da lista recebem qualquer penteado.
 */
const MENINOS = new Set(['Bernardo', 'Davi', 'Felipe', 'Heitor', 'João', 'Mateus']);
const MENINAS = new Set(['Ana', 'Cecília', 'Elisa', 'Giovana', 'Isadora', 'Lara']);

function semente(nome: string) {
  let h = 2166136261;
  for (const c of nome) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}

export function AvatarCrianca({ nome, tamanho = 112 }: { nome: string; tamanho?: number }) {
  const h = semente(nome);
  const pega = <T,>(lista: T[], desloc: number) => lista[(h >>> desloc) % lista.length];
  const fundo = pega(FUNDOS, 0);
  const pele = pega(PELES, 3);
  const cabelo = pega(CABELOS, 7);
  const roupa = pega(ROUPAS, 11);
  const laco = pega(LACOS, 15);
  // 0 curto · 1 liso comprido · 2 cacheado curto · 3 dois coquinhos · 4 franja com laço
  const primeiro = nome.trim().split(/\s+/)[0] ?? '';
  const opcoes = MENINOS.has(primeiro) ? [0, 2] : MENINAS.has(primeiro) ? [1, 3, 4] : [0, 1, 2, 3, 4];
  const estilo = opcoes[(h >>> 19) % opcoes.length];
  const sombraPele = 'rgba(0,0,0,0.08)';

  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 120 120" aria-hidden="true" className="shrink-0">
      <defs>
        <clipPath id={`c-${h}`}><circle cx="60" cy="60" r="60" /></clipPath>
      </defs>
      <g clipPath={`url(#c-${h})`}>
        <circle cx="60" cy="60" r="60" fill={fundo} />

        {/* cabelo de trás (comprido) */}
        {estilo === 1 && <path d="M30 52c0-20 13-31 30-31s30 11 30 31v40H30z" fill={cabelo} />}
        {estilo === 4 && <path d="M33 54c0-18 12-28 27-28s27 10 27 28v22c-4 4-8 6-12 6H45c-4 0-8-2-12-6z" fill={cabelo} />}

        {/* corpo e pescoço */}
        <path d="M22 120c2-20 17-32 38-32s36 12 38 32z" fill={roupa} />
        <path d="M50 96c3 4 7 6 10 6s7-2 10-6" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
        <rect x="52" y="76" width="16" height="16" rx="6" fill={pele} />
        <rect x="52" y="80" width="16" height="5" fill={sombraPele} />

        {/* orelhas e cabeça */}
        <circle cx="35" cy="58" r="6" fill={pele} />
        <circle cx="85" cy="58" r="6" fill={pele} />
        <circle cx="60" cy="56" r="25" fill={pele} />

        {/* cabelo da frente */}
        {estilo === 0 && <path d="M35 52c0-16 11-26 25-26s25 10 25 26c-6-7-14-10-25-10-7 0-14 2-20 5l-5 5z" fill={cabelo} />}
        {estilo === 1 && <path d="M35 54c1-16 12-26 25-26s24 10 25 26c-9-1-17-6-22-13-5 7-15 12-28 13z" fill={cabelo} />}
        {estilo === 2 && (
          <g fill={cabelo}>
            {[[38, 44, 9], [47, 35, 10], [60, 31, 11], [73, 35, 10], [82, 44, 9], [34, 54, 6], [86, 54, 6]].map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)}
          </g>
        )}
        {estilo === 3 && (
          <g fill={cabelo}>
            <circle cx="35" cy="34" r="11" />
            <circle cx="85" cy="34" r="11" />
            <path d="M35 52c0-16 11-26 25-26s25 10 25 26c-6-6-15-9-25-9s-19 3-25 9z" />
          </g>
        )}
        {estilo === 4 && (
          <g>
            <path d="M35 53c0-16 11-26 25-26s25 10 25 26c-4-5-9-8-15-9-3 4-9 6-15 6-8 0-14-2-20 3z" fill={cabelo} />
            <path d="M70 30l9-7v14zM70 30l-9-7v14z" fill={laco} />
            <circle cx="70" cy="30" r="3" fill={laco} />
          </g>
        )}

        {/* rosto */}
        <ellipse cx="51" cy="58" rx="3" ry="3.6" fill="#2b1a12" />
        <ellipse cx="69" cy="58" rx="3" ry="3.6" fill="#2b1a12" />
        <circle cx="52" cy="56.8" r="1" fill="#fff" />
        <circle cx="70" cy="56.8" r="1" fill="#fff" />
        <circle cx="45" cy="66" r="4" fill="#f38b8b" opacity="0.45" />
        <circle cx="75" cy="66" r="4" fill="#f38b8b" opacity="0.45" />
        <path d="M53 67c2 3.5 4.5 5 7 5s5-1.5 7-5" fill="none" stroke="#7a3b2a" strokeWidth="2.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}
