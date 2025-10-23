// src/types/billing.ts

export type CashStatus = "open" | "closed"

export type CashboxStatus = {
  status: CashStatus
  openedAt?: string
  closedAt?: string
  openingAmount?: number
  totals: { income: number; expense: number; balance: number }
}

export type Movement = {
  id: string
  type: "income" | "expense"
  concept: string
  amount: number
  at: string // ISO
}

export type Product = {
  id: string
  name: string
  price: number
  sku?: string
  category?: string
}

export type OrderItem = {
  productId: string
  name: string
  qty: number
  price: number
}

export type Order = {
  id: string
  total: number
  items: OrderItem[]
  createdAt: string // ISO
}
