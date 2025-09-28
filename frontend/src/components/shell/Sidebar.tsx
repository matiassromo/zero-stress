"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const items = [
  { href: "/", label: "Dashboard" },
  { href: "/pos", label: "Punto de Venta (POS)" },
  { href: "/clientes", label: "Clientes" },
  { href: "/pases", label: "Tarjetas 10 Pases" },
  { href: "/bar", label: "Bar" },
  { href: "/parqueadero", label: "Parqueadero" },
  { href: "/llaves", label: "Llaves" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="h-full p-4 flex flex-col gap-4">
      {/* Logo + título */}
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white text-lg font-bold">
          Z
        </div>
        <div>
          <div className="text-lg font-semibold">Zero Stress</div>
          <div className="text-xs text-neutral-500 -mt-0.5">Panel Único</div>
        </div>
      </div>

      {/* Estado de caja */}
      <div className="rounded-xl border border-green-200 bg-green-50 p-3">
        <div className="text-sm font-medium text-green-800">Estado de Caja</div>
        <div className="mt-1 text-sm text-green-700">Abierta — {new Date().toLocaleDateString()}</div>
        <div className="mt-1 text-xs text-green-700">Ingresos: $7.00</div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <div className="text-xs text-neutral-500">Personas</div>
          <div className="text-lg font-semibold">1</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <div className="text-xs text-neutral-500">Llaves</div>
          <div className="text-lg font-semibold">31</div>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-3">
          <div className="text-xs text-neutral-500">Pend.</div>
          <div className="text-lg font-semibold">1</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="mt-2 flex flex-col gap-1">
        {items.map((it) => {
          const active = pathname === it.href
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors ${
                active ? "bg-blue-600 text-white" : "hover:bg-neutral-100 text-neutral-700"
              }`}
            >
              <span>{it.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
