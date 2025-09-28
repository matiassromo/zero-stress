// src/app/clientes/page.tsx
import Shell from "@/components/shell/Shell";

export default function ClientesPage() {
  return (
    <Shell>
      <h1 className="mb-4 text-xl font-semibold">Clientes</h1>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        Listado de clientes…
      </div>
    </Shell>
  );
}
