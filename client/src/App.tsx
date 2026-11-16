import { useQuery } from '@tanstack/react-query';

interface Saude {
  status: string;
  catalogo: string;
  habilidades: number;
  baseDemonstracao: boolean;
}

async function buscarSaude(): Promise<Saude> {
  const r = await fetch('/api/health');
  if (!r.ok) throw new Error(`Servidor respondeu ${r.status}`);
  return r.json();
}

export default function App() {
  const { data, error, isLoading } = useQuery({ queryKey: ['saude'], queryFn: buscarSaude });

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white px-5 py-3">
        <div className="text-lg font-extrabold">Fio da Aprendizagem</div>
        <div className="text-sm font-semibold text-muted">Esqueleto da aplicação · escola fictícia</div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h1 className="text-xl font-extrabold">Estado do servidor</h1>
          {isLoading && <p className="mt-2 text-muted">Consultando o servidor…</p>}
          {error && (
            <p className="mt-3 rounded-lg bg-warn-soft px-3 py-2 text-warn">
              Não consegui falar com o servidor. Ele está rodando? ({(error as Error).message})
            </p>
          )}
          {data && (
            <ul className="mt-3 space-y-1 text-sm">
              <li>Servidor: <b>{data.status}</b></li>
              <li>Catálogo {data.catalogo}: <b>{data.habilidades}</b> habilidades</li>
              <li>Base de demonstração: <b>{data.baseDemonstracao ? 'carregada' : 'vazia (rode npm run seed)'}</b></li>
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
