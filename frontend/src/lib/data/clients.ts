// src/lib/data/clients.ts
export type Client = {
  id: string
  nombre: string
  cedula: string
  telefono: string
  correo: string
  nacimiento: string
  direccion: string
  avatarUrl?: string
  notas?: string
  pases: Array<{
    tipo: string
    inicio: string
    vence: string
    usosRestantes: number
    estado: "Activo" | "Vencido" | "Suspendido"
  }>
  compras: Array<{
    fecha: string
    descripcion: string
    monto: number
    medio: string
  }>
  llaves: Array<{
    numero: string
    entrega: string
    devolucion?: string
    estado: "En uso" | "Devuelta"
  }>
}

export const clientsMock: Client[] = [
  {
    id: "rodrigo-castillo",
    nombre: "Rodrigo Castillo",
    cedula: "1723456789",
    telefono: "0987654321",
    correo: "rodrigo@gmail.com",
    nacimiento: "1990-04-15",
    direccion: "Quito, Ecuador",
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Rodrigo%20Castillo",
    notas:
      "Cliente habitual, suele venir con su familia los fines de semana. Prefiere pagar por transferencia.",
    pases: [
      {
        tipo: "Pase 10 usos",
        inicio: "2025-10-10",
        vence: "2025-12-10",
        usosRestantes: 6,
        estado: "Activo",
      },
    ],
    compras: [
      { fecha: "2025-10-21 15:40", descripcion: "Entrada 2A 2N", monto: 22, medio: "Transferencia" },
      { fecha: "2025-10-18 11:00", descripcion: "Pase 10 usos", monto: 50, medio: "Efectivo" },
    ],
    llaves: [
      { numero: "12", entrega: "2025-10-21 15:40", devolucion: undefined, estado: "En uso" },
    ],
  },
]
export function getClient(id: string) {
  return clientsMock.find((c) => c.id === id) || null
}
