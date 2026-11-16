/** Datas civis 'AAAA-MM-DD' (D06). Comparação textual funciona porque o formato é ordenável. */
export function estaVigente(de: string, ate: string | null, data: string): boolean {
  return de <= data && (ate === null || ate >= data);
}

const formatador = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Data de hoje no fuso America/Sao_Paulo, como 'AAAA-MM-DD'. */
export function hojeEmSaoPaulo(): string {
  return formatador.format(new Date());
}
