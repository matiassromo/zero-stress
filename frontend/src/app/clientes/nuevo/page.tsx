import ClientForm from "@/components/clientes/ClientForm";

export default function NuevoClientePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Registrar Cliente</h1>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <ClientForm mode="create" />
      </div>
    </div>
  );
}
