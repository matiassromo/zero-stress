// src/lib/api/passes.ts
import type { PassCard, PassDetailResponse, PassTransaction } from "@/types/passes";

/* ------------ Config base ------------ */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";

/* ------------ LocalStorage (mocks) ------------ */
const LS = {
  get<T>(k: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(k: string, v: T) {
    if (typeof window === "undefined") return;
    localStorage.setItem(k, JSON.stringify(v));
  },
};
const MOCK_KEY = "zs_passes_mock";
const MOCK_TX_KEY = "zs_passes_txs_mock";

/* ------------ HTTP ------------ */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // Si NO usamos mocks, asumimos rewrites y usamos ruta relativa
  const url = USE_MOCKS ? `${API_BASE}${path}` : path;
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

/* ------------ API real ------------ */
async function apiListPasses(query = "", status = "") {
  const p = new URLSearchParams();
  if (query) p.set("query", query);
  if (status) p.set("status", status);
  return http<{ items: PassCard[]; total: number }>(`/api/passes?${p.toString()}`);
}
async function apiGetPass(id: string) {
  return http<PassDetailResponse>(`/api/passes/${id}`);
}
async function apiCreatePass(input: {
  clientId?: string;
  holderName: string;
  cardNumber: string;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}) {
  return http<PassCard>(`/api/passes`, { method: "POST", body: JSON.stringify(input) });
}
async function apiUsePass(
  id: string,
  quantity: number,
  accountId?: string,
  comment?: string
): Promise<Response> {
  return fetch(`/api/passes/${id}/use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity, accountId, comment }),
    cache: "no-store",
  });
}
async function apiAddManualPass(
  id: string,
  persons: number,
  label?: string,
  comment?: string
): Promise<Response> {
  return fetch(`/api/passes/${id}/manual`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ persons, label, comment }),
    cache: "no-store",
  });
}
async function apiRenewPass(id: string): Promise<Response> {
  return fetch(`/api/passes/${id}/renew`, { method: "POST", cache: "no-store" });
}
async function apiDeletePass(id: string): Promise<Response> {
  return fetch(`/api/passes/${id}`, { method: "DELETE", cache: "no-store" });
}

/* ------------ Mocks ------------ */
function seedIfEmpty() {
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  if (cards.length === 0) {
    const now = new Date().toISOString();
    const demo: PassCard[] = [
      {
        id: crypto.randomUUID(),
        holderName: "Rodrigo Castillo",
        documentId: "1724567890",
        email: "rodrigo@gmail.com",
        cardNumber: "T-00012",
        totalUses: 10,
        remainingUses: 5,
        status: "Active",
        createdAt: now,
        purchaseDate: "2025-10-01T10:00:00.000Z",
        amountPaid: 55,
        lastUsedAt: "2025-10-28T12:00:00.000Z",
        clientId: null,
        validFrom: null,
        validTo: null,
        notes: null,
      },
    ];
    LS.set(MOCK_KEY, demo);
    const txs: PassTransaction[] = [
      { id: crypto.randomUUID(), passCardId: demo[0].id, type: "Create", quantity: 10, performedBy: "system", createdAt: "2025-10-01T10:00:00.000Z", label: "Compra" },
      { id: crypto.randomUUID(), passCardId: demo[0].id, type: "Use", quantity: -2, performedBy: "system", createdAt: "2025-10-02T12:00:00.000Z", label: "Entrada Normal", persons: 2 },
      { id: crypto.randomUUID(), passCardId: demo[0].id, type: "Use", quantity: -1, performedBy: "system", createdAt: "2025-10-05T12:00:00.000Z", label: "Entrada Normal", persons: 1 },
      { id: crypto.randomUUID(), passCardId: demo[0].id, type: "Use", quantity: -1, performedBy: "system", createdAt: "2025-10-09T12:00:00.000Z", label: "Entrada Pase", persons: 1 },
      { id: crypto.randomUUID(), passCardId: demo[0].id, type: "Use", quantity: -1, performedBy: "system", createdAt: "2025-10-12T12:00:00.000Z", label: "Entrada Pase", persons: 1 },
      { id: crypto.randomUUID(), passCardId: demo[0].id, type: "Use", quantity: -1, performedBy: "system", createdAt: "2025-10-28T12:00:00.000Z", label: "Entrada Pase", persons: 1 },
    ];
    LS.set(MOCK_TX_KEY, txs);
  }
}

async function mockListPasses(query = "", _status = "") {
  seedIfEmpty();
  let items = LS.get<PassCard[]>(MOCK_KEY, []);
  if (query) {
    const q = query.toLowerCase();
    items = items.filter(
      (p) => p.holderName.toLowerCase().includes(q) || p.cardNumber.toLowerCase().includes(q)
    );
  }
  return { items, total: items.length };
}
async function mockGetPass(id: string) {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  const card = cards.find((c) => c.id === id);
  if (!card) throw new Error("Not found");
  const txs = LS.get<PassTransaction[]>(MOCK_TX_KEY, []).filter((t) => t.passCardId === id);
  return { card, transactions: txs } as PassDetailResponse;
}
async function mockCreatePass(input: {
  clientId?: string;
  holderName: string;
  cardNumber: string;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}) {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  if (cards.some((c) => c.cardNumber.toUpperCase() === input.cardNumber.toUpperCase())) {
    throw new Error("409 Conflict: Duplicated CardNumber");
  }
  const now = new Date().toISOString();
  const newCard: PassCard = {
    id: crypto.randomUUID(),
    clientId: input.clientId ?? null,
    holderName: input.holderName.trim(),
    cardNumber: input.cardNumber.trim().toUpperCase(),
    totalUses: 10,
    remainingUses: 10,
    status: "Active",
    validFrom: input.validFrom ?? null,
    validTo: input.validTo ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    lastUsedAt: null,
    documentId: null,
    email: null,
    purchaseDate: now,
    amountPaid: 55,
  };
  cards.unshift(newCard);
  LS.set(MOCK_KEY, cards);

  const txs = LS.get<PassTransaction[]>(MOCK_TX_KEY, []);
  txs.push({
    id: crypto.randomUUID(),
    passCardId: newCard.id,
    type: "Create",
    quantity: 10,
    performedBy: "system",
    createdAt: now,
    label: "Compra",
  });
  LS.set(MOCK_TX_KEY, txs);

  return newCard;
}
async function mockUsePass(
  id: string,
  quantity: number,
  accountId?: string,
  comment?: string
): Promise<Response> {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  const card = cards.find((c) => c.id === id);
  if (!card) return new Response("Not found", { status: 404 });
  if (card.status !== "Active") return new Response("Inactive card", { status: 400 });
  if (card.remainingUses < quantity) return new Response("Insufficient uses", { status: 400 });

  card.remainingUses -= quantity;
  card.lastUsedAt = new Date().toISOString();
  LS.set(MOCK_KEY, cards);

  const txs = LS.get<PassTransaction[]>(MOCK_TX_KEY, []);
  txs.push({
    id: crypto.randomUUID(),
    passCardId: id,
    type: "Use",
    quantity: -quantity,
    accountId: accountId ?? null,
    performedBy: "system",
    comment,
    createdAt: card.lastUsedAt,
    label: "Entrada Pase",
    persons: quantity,
  });
  LS.set(MOCK_TX_KEY, txs);

  return new Response(null, { status: 204 });
}
async function mockAddManualPass(
  id: string,
  persons: number,
  label?: string,
  comment?: string
): Promise<Response> {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  const card = cards.find((c) => c.id === id);
  if (!card) return new Response("Not found", { status: 404 });
  if (card.remainingUses < persons) return new Response("Insufficient uses", { status: 400 });

  card.remainingUses -= persons;
  card.lastUsedAt = new Date().toISOString();
  LS.set(MOCK_KEY, cards);

  const txs = LS.get<PassTransaction[]>(MOCK_TX_KEY, []);
  txs.push({
    id: crypto.randomUUID(),
    passCardId: id,
    type: "ManualAdd",
    quantity: -persons,
    persons,
    label: label ?? "Consumo manual",
    performedBy: "user",
    comment,
    createdAt: card.lastUsedAt,
  });
  LS.set(MOCK_TX_KEY, txs);

  return new Response(null, { status: 204 });
}
async function mockRenewPass(id: string): Promise<Response> {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  const card = cards.find((c) => c.id === id);
  if (!card) return new Response("Not found", { status: 404 });

  card.totalUses = 10;
  card.remainingUses = 10;
  card.status = "Active";
  card.purchaseDate = new Date().toISOString();
  card.amountPaid = 55;
  LS.set(MOCK_KEY, cards);

  const txs = LS.get<PassTransaction[]>(MOCK_TX_KEY, []);
  txs.push({
    id: crypto.randomUUID(),
    passCardId: id,
    type: "Renew",
    quantity: +10,
    persons: null,
    label: "Renovación",
    performedBy: "user",
    createdAt: card.purchaseDate!,
  });
  LS.set(MOCK_TX_KEY, txs);

  return new Response(null, { status: 204 });
}
async function mockDeletePass(id: string): Promise<Response> {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []).filter((c) => c.id !== id);
  const txs = LS.get<PassTransaction[]>(MOCK_TX_KEY, []).filter((t) => t.passCardId !== id);
  LS.set(MOCK_KEY, cards);
  LS.set(MOCK_TX_KEY, txs);
  return new Response(null, { status: 204 });
}

/* ------------ Exports públicos ------------ */
export async function listPasses(query = "", status = "") {
  return USE_MOCKS ? mockListPasses(query, status) : apiListPasses(query, status);
}
export async function getPass(id: string) {
  return USE_MOCKS ? mockGetPass(id) : apiGetPass(id);
}
export async function createPass(input: {
  clientId?: string;
  holderName: string;
  cardNumber: string;
  validFrom?: string;
  validTo?: string;
  notes?: string;
}) {
  return USE_MOCKS ? mockCreatePass(input) : apiCreatePass(input);
}
export async function usePass(
  id: string,
  quantity: number,
  accountId?: string,
  comment?: string
): Promise<Response> {
  return USE_MOCKS ? mockUsePass(id, quantity, accountId, comment) : apiUsePass(id, quantity, accountId, comment);
}
export async function addManualPass(
  id: string,
  persons: number,
  label?: string,
  comment?: string
): Promise<Response> {
  return USE_MOCKS ? mockAddManualPass(id, persons, label, comment) : apiAddManualPass(id, persons, label, comment);
}
export async function renewPass(id: string): Promise<Response> {
  return USE_MOCKS ? mockRenewPass(id) : apiRenewPass(id);
}
export async function deletePass(id: string): Promise<Response> {
  return USE_MOCKS ? mockDeletePass(id) : apiDeletePass(id);
}
export async function tryConsumePassByNumber(cardNumber: string, quantity: number, accountId?: string) {
  const { items } = await listPasses(cardNumber);
  const found = items.find((x) => x.cardNumber.toUpperCase() === cardNumber.toUpperCase());
  if (!found) throw new Error("Tarjeta no encontrada");
  const r = await usePass(found.id, quantity, accountId);
  if (!r.ok) throw new Error("No se pudo consumir");
  return true;
}
