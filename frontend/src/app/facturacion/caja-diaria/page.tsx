"use client"

import Shell from "@/components/shell/Shell"
import { billingAPI } from "@/lib/api/billing"
import { Movement } from "@/types/billing"
import { useEffect, useMemo, useState } from "react"


function currency(n: number) {
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(n)
}

export default function CajaDiariaPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"open"|"closed">("closed")
  const [openedAt, setOpenedAt] = useState<string | undefined>()
  const [openingAmount, setOpeningAmount] = useState(0)
  const [movs, setMovs] = useState<Movement[]>([])
  const [income, setIncome] = useState(0)
  const [expense, setExpense] = useState(0)
  const balance = useMemo(() => openingAmount + income - expense, [openingAmount, income, expense])

  async function load() {
    setLoading(true)
    const s = await billingAPI.getCashboxStatus()
    const m = await billingAPI.listMovements()
    setStatus(s.status)
    setOpenedAt(s.openedAt)
    setOpeningAmount(s.openingAmount ?? 0)
    setIncome(s.totals.income)
    setExpense(s.totals.expense)
    setMovs(m)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function onOpen() {
    const amt = Number(prompt("Saldo inicial de caja:", "0") ?? "0")
    if (isNaN(amt)) return
    await billingAPI.openCashbox(amt)
    await load()
  }
  async function onClose() {
    await billingAPI.closeCashbox()
    await load()
  }
  async function add(type: Movement["type"]) {
    const concept = prompt(type === "income" ? "Concepto de ingreso" : "Concepto de egreso")
    if (!concept) return
    const amt = Number(prompt("Monto:", "0") ?? "0")
    if (isNaN(amt) || amt <= 0) return
    const mv = await billingAPI.addMovement({ type, concept, amount: amt })
    setMovs(prev => [mv, ...prev])
    if (type === "income") setIncome(x => x + amt)
    else setExpense(x => x + amt)
  }

  return (
    <>
    <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Caja Diaria</div>
            <div className="text-sm text-neutral-500">
              Estado:{" "}
              <span className={status==="open" ? "text-green-700" : "text-neutral-700"}>
                {status==="open" ? "Abierta" : "Cerrada"}
              </span>
              {status==="open" && openedAt ? ` — desde ${new Date(openedAt).toLocaleTimeString()}` : null}
            </div>
          </div>
          <div className="flex gap-2">
            {status==="closed" ? (
              <button onClick={onOpen} className="rounded-xl bg-green-600 text-white px-3 py-2 text-sm hover:opacity-90">
                Abrir Caja
              </button>
            ) : (
              <button onClick={onClose} className="rounded-xl bg-neutral-800 text-white px-3 py-2 text-sm hover:opacity-90">
                Cerrar Caja
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="text-xs text-neutral-500">Saldo Inicial</div>
            <div className="mt-1 text-2xl font-semibold">{currency(openingAmount)}</div>
          </div>
          <div className="rounded-2xl border border-green-200 bg-white p-4">
            <div className="text-xs text-neutral-500">Ingresos</div>
            <div className="mt-1 text-2xl font-semibold text-green-700">{currency(income)}</div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white p-4">
            <div className="text-xs text-neutral-500">Egresos</div>
            <div className="mt-1 text-2xl font-semibold text-amber-700">{currency(expense)}</div>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-white p-4">
            <div className="text-xs text-neutral-500">Saldo Actual</div>
            <div className="mt-1 text-2xl font-semibold text-blue-700">{currency(balance)}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => add("income")} disabled={status!=="open"} className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            + Ingreso
          </button>
          <button onClick={() => add("expense")} disabled={status!=="open"} className="rounded-xl bg-amber-600 text-white px-3 py-2 text-sm disabled:opacity-50">
            + Egreso
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white">
          <div className="px-4 py-3 border-b border-neutral-200 text-sm font-medium">Movimientos</div>
          <div className="divide-y divide-neutral-100">
            {loading ? (
              <div className="p-4 text-sm text-neutral-500">Cargando…</div>
            ) : movs.length === 0 ? (
              <div className="p-4 text-sm text-neutral-500">Sin movimientos</div>
            ) : (
              movs.map(m => (
                <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${m.type==="income" ? "bg-green-400" : "bg-amber-400"}`} />
                    <div>
                      <div className="text-sm">{m.concept}</div>
                      <div className="text-xs text-neutral-500">{new Date(m.at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${m.type==="income" ? "text-green-700" : "text-amber-700"}`}>
                    {m.type==="income" ? "+" : "-"} {currency(m.amount)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
