"use client"

import Shell from "@/components/shell/Shell"
import { billingAPI } from "@/lib/api/billing"
import { Product } from "@/types/billing"
import { useEffect, useMemo, useState } from "react"

export default function POSPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>([])
  const [cart, setCart] = useState<{ product: Product; qty: number }[]>([])

  useEffect(() => {
    let active = true
    billingAPI.searchProducts(query).then(p => { if (active) setResults(p) })
    return () => { active = false }                         
  }, [query])

  const total = useMemo(
    () => cart.reduce((a, it) => a + it.qty * it.product.price, 0),
    [cart]
  )

  function addToCart(p: Product) {
    setCart(prev => {
      const i = prev.findIndex(x => x.product.id === p.id)
      if (i >= 0) {
        const clone = [...prev]
        clone[i] = { ...clone[i], qty: clone[i].qty + 1 }
        return clone
      }
      return [...prev, { product: p, qty: 1 }]
    })
  }
  function changeQty(id: string, qty: number) {
    setCart(prev => prev.map(it => it.product.id === id ? { ...it, qty } : it).filter(it => it.qty > 0))
  }
  async function checkout() {
    if (cart.length === 0) return
    const payload = cart.map(it => ({ productId: it.product.id, qty: it.qty, price: it.product.price }))
    const res = await billingAPI.createOrder(payload)
    alert(`Orden ${res.orderId} creada. Total: $${res.total.toFixed(2)}`)
    setCart([])
  }

  return (
    <Shell>
      <div className="grid gap-4 md:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium mb-2">Buscar productos</div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Ej. Entrada Adulto, Coca-Cola…"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
          />

          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="rounded-xl border border-neutral-200 p-3 text-left hover:shadow-sm"
              >
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-neutral-500">${p.price.toFixed(2)}</div>
              </button>
            ))}
            {results.length === 0 && (
              <div className="text-sm text-neutral-500">Sin resultados</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-medium mb-2">Carrito</div>
          <div className="divide-y divide-neutral-100">
            {cart.length === 0 ? (
              <div className="text-sm text-neutral-500 p-2">Añade productos</div>
            ) : (
              cart.map(it => (
                <div key={it.product.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="text-sm">{it.product.name}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) => changeQty(it.product.id, Number(e.target.value))}
                      className="w-16 rounded-lg border border-neutral-200 px-2 py-1 text-sm"
                    />
                    <div className="text-sm font-medium">${(it.qty * it.product.price).toFixed(2)}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-neutral-500">Total</div>
            <div className="text-lg font-semibold">${total.toFixed(2)}</div>
          </div>

          <button
            onClick={checkout}
            disabled={cart.length === 0}
            className="mt-3 w-full rounded-xl bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-50"
          >
            Cobrar
          </button>
        </div>
      </div>
    </Shell>
  )
}
