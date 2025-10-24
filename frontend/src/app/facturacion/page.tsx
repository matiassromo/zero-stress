import ModuleCard from "@/components/shell/ModuleCard";

export default function FacturacionHome() {
  return (
    <>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Facturación</h1>
        <p className="text-sm text-neutral-500">
          Selecciona una opción para continuar.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <ModuleCard
            title="Punto de Venta"
            subtitle="Registrar ventas, entradas y consumos"
            href="/facturacion/pos"
          />
          <ModuleCard
            title="Caja Diaria"
            subtitle="Apertura, movimientos y cierre de caja"
            href="/facturacion/caja-diaria"
          />
        </div>
      </div>
    </>
  );
}
