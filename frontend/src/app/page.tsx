import Shell from "@/components/shell/Shell";
import MetricCard from "@/components/shell/MetricCard";
import ModuleCard from "@/components/shell/ModuleCard";
import ActivityItem from "@/components/shell/ActivityItem";

export default function PanelZeroStress() {
  return (
    <Shell>
      {/* Estado del sistema */}
      <section className="rounded-2xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-green-800">Sistema Operativo</div>
            <div className="text-sm text-green-700">Caja abierta — Todas las operaciones disponibles</div>
          </div>
          <div className="text-right text-sm text-green-800">
            Ingresos del día: <span className="font-semibold">$7.00</span>
            <div className="text-xs">Abierta: 17:21:27</div>
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="mt-4 grid gap-4 md:grid-cols-4">
        <MetricCard title="Clientes Activos" value="1" subtitle="Dentro del balneario" />
        <MetricCard title="Pedidos Pendientes" value="1" subtitle="En preparación" tone="warning" />
        <MetricCard title="Ingresos Hoy" value="$7.00" subtitle="Todas las ventas" tone="success" />
        <MetricCard title="Llaves Disponibles" value="31" subtitle="De 32 totales" />
      </section>

      {/* Módulos + Actividad */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Módulos del Sistema</h2>
          <p className="text-sm text-neutral-500">
            El POS es el núcleo central — Los demás módulos son pantallas espejo
          </p>

          <div className="grid gap-3">
            <ModuleCard title="Punto de Venta (POS)" subtitle="Núcleo central — Todas las transacciones" badge="NÚCLEO CENTRAL" />
            <ModuleCard title="Clientes" subtitle="Gestión de entradas" />
            <ModuleCard title="Tarjetas 10 Pases" subtitle="Gestión de tarjetas" />
            <ModuleCard title="Bar" subtitle="Pedidos y cocina" />
            <ModuleCard title="Parqueadero" subtitle="Control vehicular" />
            <ModuleCard title="Llaves" subtitle="Lockers y vestidores" />
          </div>
        </div>

        <aside className="space-y-3">
          <h2 className="text-xl font-semibold">Actividad Reciente</h2>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
            <ActivityItem title="Pedido BO-001 — Rodrigo Castillo" time="17:21" />
            <ActivityItem title="Rodrigo Castillo ingresó" time="17:21" />
            <ActivityItem title="Tarjeta 10 pases — consumo 1" time="16:48" />
          </div>
        </aside>
      </section>
    </Shell>
  );
}
