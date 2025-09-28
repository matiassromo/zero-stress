import AppShell from "@/components/AppShell"

export default function Page() {
  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="text-sm text-neutral-400">Ventas hoy</div>
          <div className="mt-2 text-3xl font-semibold">$ 382.00</div>
        </div>
        <div className="card">
          <div className="text-sm text-neutral-400">Entradas</div>
          <div className="mt-2 text-3xl font-semibold">97</div>
        </div>
        <div className="card">
          <div className="text-sm text-neutral-400">Caja</div>
          <div className="mt-2 inline-block rounded-md border border-green-600/40 px-2 py-1 text-green-400 text-sm">
            Abierta
          </div>
        </div>
      </div>
    </AppShell>
  )
}
