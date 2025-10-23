import ClientForm from "@/components/clientes/ClientForm";

export default function NuevoClientePage() {
  return (
    <div className="p-4">
      <ClientForm mode="create" />
    </div>
  );
}
