// src/lib/api/billing.ts
import { CashboxStatus, Movement, Order, Product } from "@/types/billing"

/** ========= CONFIG ========= */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000"
const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true").toLowerCase() === "false"

/** ========= HTTP ========= */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`)
  }
  return res.json()
}

/** ========= MOCKS (localStorage) ========= */
const LS = {
  get<T>(k: string, v: T): T {
    if (typeof window === "undefined") return v
    const raw = localStorage.getItem(k)
    return raw ? JSON.parse(raw) : v
  },
  set<T>(k: string, v: T) {
    if (typeof window === "undefined") return
    localStorage.setItem(k, JSON.stringify(v))
  },
}
const KEY = "zs:caja"

type CajaMock = {
  status: "open" | "closed"
  openedAt?: string
  closedAt?: string
  openingAmount?: number
  movements: Movement[]
}

function ensureMock(): CajaMock {
  return LS.get<CajaMock>(KEY, { status: "closed", movements: [] })
}

function mockCashboxStatus(): CashboxStatus {
  const m = ensureMock()
  const sums = m.movements.reduce(
    (acc, it) => {
      if (it.type === "income") acc.income += it.amount
      else acc.expense += it.amount
      return acc
    },
    { income: 0, expense: 0 }
  )
  return {
    status: m.status,
    openedAt: m.openedAt,
    closedAt: m.closedAt,
    openingAmount: m.openingAmount ?? 0,
    totals: {
      income: sums.income,
      expense: sums.expense,
      balance: (m.openingAmount ?? 0) + sums.income - sums.expense,
    },
  }
}

function mockOpenCashbox(openingAmount: number) {
  const now = new Date().toISOString()
  const m: CajaMock = { status: "open", openedAt: now, openingAmount, movements: [] }
  LS.set(KEY, m)
  return { status: "open" as const, openedAt: now }
}

function mockCloseCashbox() {
  const box = ensureMock()
  const now = new Date().toISOString()
  LS.set(KEY, { ...box, status: "closed" as const, closedAt: now })
  return { status: "closed" as const, closedAt: now }
}

function mockListMovements(): Movement[] {
  return ensureMock().movements
}

function mockAddMovement(payload: { type: Movement["type"]; concept: string; amount: number }): Movement {
  const box = ensureMock()
  const mv: Movement = {
    id: crypto.randomUUID(),
    type: payload.type,
    concept: payload.concept,
    amount: payload.amount,
    at: new Date().toISOString(),
  }
  const updated = { ...box, movements: [mv, ...box.movements], status: "open" as const }
  LS.set(KEY, updated)
  return mv
}

/** ========= API ========= */
export const billingAPI = {
  // --- Caja Diaria ---
  async getCashboxStatus(): Promise<CashboxStatus> {
    if (USE_MOCKS) return mockCashboxStatus()
    try {
      return await http<CashboxStatus>("/billing/cashbox/status")
    } catch (e) {
      console.warn("[billingAPI.getCashboxStatus] fallback -> mocks:", e)
      return mockCashboxStatus()
    }
  },

  async openCashbox(openingAmount: number) {
    if (USE_MOCKS) return mockOpenCashbox(openingAmount)
    try {
      return await http<{ status: "open"; openedAt: string }>("/billing/cashbox/open", {
        method: "POST",
        body: JSON.stringify({ openingAmount }),
      })
    } catch (e) {
      console.warn("[billingAPI.openCashbox] fallback -> mocks:", e)
      return mockOpenCashbox(openingAmount)
    }
  },

  async closeCashbox(notes?: string) {
    if (USE_MOCKS) return mockCloseCashbox()
    try {
      return await http<{ status: "closed"; closedAt: string }>("/billing/cashbox/close", {
        method: "POST",
        body: JSON.stringify({ notes }),
      })
    } catch (e) {
      console.warn("[billingAPI.closeCashbox] fallback -> mocks:", e)
      return mockCloseCashbox()
    }
  },

  async listMovements(dateISO?: string): Promise<Movement[]> {
    if (USE_MOCKS) return mockListMovements()
    try {
      const q = dateISO ? `?date=${encodeURIComponent(dateISO)}` : ""
      return await http<Movement[]>(`/billing/cashbox/movements${q}`)
    } catch (e) {
      console.warn("[billingAPI.listMovements] fallback -> mocks:", e)
      return mockListMovements()
    }
  },

  async addMovement(payload: { type: Movement["type"]; concept: string; amount: number }): Promise<Movement> {
    if (USE_MOCKS) return mockAddMovement(payload)
    try {
      return await http<Movement>("/billing/cashbox/movements", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    } catch (e) {
      console.warn("[billingAPI.addMovement] fallback -> mocks:", e)
      return mockAddMovement(payload)
    }
  },

  // --- POS ---
  async searchProducts(query: string): Promise<Product[]> {
    const base: Product[] = [
      { id: "p1", name: "Entrada Adulto", price: 5 },
      { id: "p2", name: "Entrada Niño", price: 3 },
      { id: "p3", name: "Coca-Cola 500ml", price: 1.5 },
    ]
    const filter = (q: string) => {
      const t = q.trim().toLowerCase()
      return t ? base.filter(p => p.name.toLowerCase().includes(t)) : base
    }

    if (USE_MOCKS) return filter(query)
    try {
      const q = query ? `?query=${encodeURIComponent(query)}` : ""
      return await http<Product[]>(`/billing/pos/products${q}`)
    } catch (e) {
      console.warn("[billingAPI.searchProducts] fallback -> mocks:", e)
      return filter(query)
    }
  },

  async createOrder(items: { productId: string; qty: number; price: number }[], notes?: string) {
    const mock = () => ({
      orderId: crypto.randomUUID(),
      total: items.reduce((a, b) => a + b.qty * b.price, 0),
    })

    if (USE_MOCKS) return mock()
    try {
      return await http<{ orderId: string; total: number }>("/billing/pos/orders", {
        method: "POST",
        body: JSON.stringify({ items, notes }),
      })
    } catch (e) {
      console.warn("[billingAPI.createOrder] fallback -> mocks:", e)
      return mock()
    }
  },

  async listOrders(dateISO?: string): Promise<Order[]> {
    if (USE_MOCKS) return []
    try {
      const q = dateISO ? `?date=${encodeURIComponent(dateISO)}` : ""
      return await http<Order[]>(`/billing/pos/orders${q}`)
    } catch (e) {
      console.warn("[billingAPI.listOrders] fallback -> mocks:", e)
      return []
    }
  },
}
