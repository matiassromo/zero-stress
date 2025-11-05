import { http, USE_MOCKS, LS } from "./_core";

export type DashboardSnapshot = {
  cajaAbierta: boolean;
  ingresosHoy: number;
  clientesActivos: number;
  pedidosPendientes: number;
  llavesDisponibles: number;
  llavesTotales: number;
  actividadReciente: { id: string; texto: string; hora: string }[];
};

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  if (!USE_MOCKS) {
    const [
      caja,
      ingresos,
      clientes,
      pedidos,
      llaves,
      actividad,
    ] = await Promise.all([
      http<{ open: boolean }>("/cashbox/status"),
      http<{ total: number }>("/sales/today"),
      http<{ count: number }>("/pool/clients/active"),
      http<{ count: number }>("/orders/pending"),
      http<{ available: number; total: number }>("/keys/availability"),
      http<{ items: { id: string; text: string; time: string }[] }>(
        "/activity/recent"
      ),
    ]);

    return {
      cajaAbierta: caja.open,
      ingresosHoy: ingresos.total,
      clientesActivos: clientes.count,
      pedidosPendientes: pedidos.count,
      llavesDisponibles: llaves.available,
      llavesTotales: llaves.total,
      actividadReciente: actividad.items.map((x) => ({
        id: x.id,
        texto: x.text,
        hora: x.time,
      })),
    };
  }

  // Mocks coherentes con tu UI actual
  const ingresosHoy = LS.get<number>("zs.mock.ingresosHoy", 7);
  const clientesActivos = LS.get<number>("zs.mock.clientesActivos", 1);
  const pedidosPendientes = LS.get<number>("zs.mock.pedidosPendientes", 1);
  const llavesTotales = 32;
  const llavesDisponibles = LS.get<number>("zs.mock.llavesDisponibles", 31);
  const actividadReciente = LS.get<
    { id: string; texto: string; hora: string }[]
  >("zs.mock.actividad", [
    { id: "bo-001", texto: "Pedido BO-001 — Rodrigo Castillo", hora: "17:21" },
    { id: "ing-rc", texto: "Rodrigo Castillo ingresó", hora: "17:21" },
    { id: "pass-1", texto: "Tarjeta 10 pases — consumo 1", hora: "16:48" },
  ]);

  return {
    cajaAbierta: true,
    ingresosHoy,
    clientesActivos,
    pedidosPendientes,
    llavesDisponibles,
    llavesTotales,
    actividadReciente,
  };
}
