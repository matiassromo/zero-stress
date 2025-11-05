"use client";

import MetricCard from "@/components/shell/MetricCard";
import ModuleCard from "@/components/shell/ModuleCard";
import ActivityItem from "@/components/shell/ActivityItem";
import { useDashboard } from "@/hooks/useDashboard";

export default function PanelZeroStress() {
  const { data, loading } = useDashboard(10000);

  const cajaAbierta = data?.cajaAbierta ?? false;
  const ingresosHoy = data?.ingresosHoy ?? 0;
  const clientesActivos = data?.clientesActivos ?? 0;
  const pedidosPendientes = data?.pedidosPendientes ?? 0;
  const llavesDisponibles = data?.llavesDisponibles ?? 0;
  const llavesTotales = data?.llavesTotales ?? 0;
  const actividad = data?.actividadReciente ?? [];

  return (
    <>
      {/* Estado del sistema */}
      <section
        className={`rounded-2xl border p-4 ${
          cajaAbierta
            ? "border-green-200 bg-green-50"
            : "border-rose-200 bg-rose-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`text-lg font-semibold ${
                cajaAbierta ? "text-green-800" : "text-rose-800"
              }`}
            >
              Sistema Operativo
            </div>
            <div
              className={`text-sm ${
                cajaAbierta ? "text-green-700" : "text-rose-700"
              }`}
            >
              {cajaAbierta
                ? "Caja abierta — Todas las operaciones disponibles"
                : "Caja cerrada — Operaciones restringidas"}
            </div>
          </div>
          <div
            className={`text-right text-sm ${
              cajaAbierta ? "text-green-800" : "text-rose-800"
            }`}
          >
            Ingresos del día:{" "}
            <span className="font-semibold">
              {loading ? "…" : `$${ingresosHoy.toFixed(2)}`}
            </span>
            {/* Si tienes hora de apertura en el snapshot, muéstrala aquí */}
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="mt-4 grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Clientes Activos"
          value={loading ? "…" : String(clientesActivos)}
          subtitle="Dentro del balneario"
        />
        <MetricCard
          title="Pedidos Pendientes"
          value={loading ? "…" : String(pedidosPendientes)}
          subtitle="En preparación"
          tone={pedidosPendientes > 0 ? "warning" : undefined}
        />
        <MetricCard
          title="Ingresos Hoy"
          value={loading ? "…" : `$${ingresosHoy.toFixed(2)}`}
          subtitle="Todas las ventas"
          tone="success"
        />
        <MetricCard
          title="Llaves Disponibles"
          value={loading ? "…" : String(llavesDisponibles)}
          subtitle={loading ? "" : `De ${llavesTotales} totales`}
        />
      </section>

      {/* Módulos + Actividad */}
      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Módulos del Sistema</h2>
          <p className="text-sm text-neutral-500">
            Facturación es el módulo principal — POS y Caja Diaria viven aquí
          </p>
          <div className="grid gap-3">
            <ModuleCard
              title="Facturación"
              subtitle="Módulo principal — POS y Caja Diaria"
              badge="MÓDULO PRINCIPAL"
              href="/facturacion"
            />
            <ModuleCard
              title="Clientes"
              subtitle="Gestión de entradas"
              href="/clientes"
            />
            <ModuleCard
              title="Tarjetas 10 Pases"
              subtitle="Gestión de tarjetas"
              href="/pases"
            />
            <ModuleCard
              title="Bar"
              subtitle="Pedidos y cocina"
              href="/bar"
            />
            <ModuleCard
              title="Parqueadero"
              subtitle="Control vehicular"
              href="/parqueadero"
            />
            <ModuleCard
              title="Llaves"
              subtitle="Lockers y vestidores"
              href="/llaves"
            />
          </div>
        </div>

        <aside className="space-y-3">
          <h2 className="text-xl font-semibold">Actividad Reciente</h2>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
            {loading && actividad.length === 0 ? (
              <>
                <ActivityItem title="Cargando…" time="…" />
                <ActivityItem title="Cargando…" time="…" />
                <ActivityItem title="Cargando…" time="…" />
              </>
            ) : actividad.length === 0 ? (
              <div className="text-sm text-neutral-500">Sin actividad reciente</div>
            ) : (
              actividad.map((i) => (
                <ActivityItem key={i.id} title={i.texto} time={i.hora} />
              ))
            )}
          </div>
        </aside>
      </section>
    </>
  );
}
