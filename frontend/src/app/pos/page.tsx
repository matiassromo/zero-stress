"use client"
import { useState } from "react"
import AppShell from "@/components/AppShell"

type Item = { id: string; nombre: string; precio: number; qty: number }
const catalogo: Omit<Item, "qty">[] = [
  { id: "E-ADULTO", nombre: "Entrada Adulto", precio: 6.00 },
  { id: "E-NIÑO", nombre: "Entrada Niño", precio: 3.50 },
  { id: "BAR-GASEOSA", nombre: "Gaseosa 500ml", precio: 1.25 },
  { id: "PARK-HORA", nombre: "Parqueadero (hora)", precio: 0.75 },
]

export default function POSPage() {
  const [items, setItems] = useState<Item[]>([])
  const [pago, setPago] = useState<number>(0)

  const add = (p: Omit<Item, "qty">) =>
    setItems(prev => {
      const i = prev.find(x => x.id === p.id)
      return i ? prev.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...prev, { ...p, qty: 1 }]
    })

  const inc = (id: string, d = 1) =>
    setItems(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty + d) } : x))

  const remove = (id: string) => setItems(prev => prev.filter(x => x.id !== id))

  const subtotal = items.reduce((s, i) => s + i.precio * i.qty, 0)
  const cambio = Math.max(0, pago - subtotal)

  return (
    <AppShell>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="text-lg font-semibold">Carrito</div>
          <div className="mt-3 space-y-3">
            {items.length === 0 && <p className="text-sm text-neutral-400">Agrega productos…</p>}
            {items.map(i => (
              <div key={i.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="font-medium">{i.nombre}</div>
                  <div className="text-xs text-neutral-400">${i.precio.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="btn" onClick={() => inc(i.id, -1)}>-</button>
                  <div className="w-8 text-center">{i.qty}</div>
                  <button className="btn" onClick={() => inc(i.id, +1)}>+</button>
                </div>
                <div className="w-20 text-right">${(i.precio * i.qty).toFixed(2)}</div>
                <button className="btn" onClick={() => remove(i.id)}>Quitar</button>
              </div>
            ))}
            <div className="border-t border-neutral-800 pt-3 text-right font-semibold">
              Total: ${subtotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-lg font-semibold">Catálogo rápido</div>
          <div className="mt-3 space-y-2">
            {catalogo.map(p => (
              <button key={p.id} className="btn w-full justify-between" onClick={() => add(p)}>
                <span>{p.nombre}</span><span>${p.precio.toFixed(2)}</span>
              </button>
            ))}
            <div className="h-px bg-neutral-800 my-2" />
            <label className="text-sm text-neutral-300">Pago recibido</label>
            <input
              type="number" step="0.01" value={pago}
              onChange={e => setPago(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 outline-none focus:ring-2 focus:ring-neutral-600"
            />
            <div className="text-sm mt-1">
              Cambio: <span className="font-semibold">${cambio.toFixed(2)}</span>
            </div>
            <button className="btn w-full mt-2" disabled={items.length === 0 || pago < subtotal}>
              Registrar venta
            </button>
            <p className="text-xs text-neutral-400 mt-2">
              *Luego conectamos con el backend para persistir transacción y actualizar inventario/llaves/pases.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
