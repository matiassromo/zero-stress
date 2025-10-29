import type { PassCard, PassDetailResponse } from "@/types/passes";

/* ------------ Config base (consistente con tus otros módulos) ------------ */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
const USE_MOCKS = (process.env.NEXT_PUBLIC_USE_MOCKS ?? "true") === "true";


/* ------------------------- Helpers de localStorage ------------------------ */
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

/* --------------------------------- HTTP ---------------------------------- */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`);
  return res.json();
}

/* ------------------------------ API (real) ------------------------------- */
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

async function apiUsePass(id: string, quantity: number, accountId?: string, comment?: string) {
  return fetch(`${API_BASE}/api/passes/${id}/use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity, accountId, comment }),
  });
}

/* ------------------------------ API (mocks) ------------------------------ */
function seedIfEmpty() {
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  if (cards.length === 0) {
    const now = new Date().toISOString();
    const demo: PassCard[] = [
      {
        id: crypto.randomUUID(),
        holderName: "Cliente Demo",
        cardNumber: "ZS-000001",
        totalUses: 10,
        remainingUses: 7,
        status: "Active",
        createdAt: now,
        clientId: null,
        validFrom: null,
        validTo: null,
        notes: "Tarjeta de ejemplo",
      },
    ];
    LS.set(MOCK_KEY, demo);
    const txs = [
      {
        id: crypto.randomUUID(),
        passCardId: demo[0].id,
        type: "Create",
        quantity: 10,
        performedBy: "system",
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        passCardId: demo[0].id,
        type: "Use",
        quantity: -3,
        performedBy: "system",
        createdAt: now,
      },
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
      (p) =>
        p.holderName.toLowerCase().includes(q) ||
        p.cardNumber.toLowerCase().includes(q)
    );
  }
  return { items, total: items.length };
}

async function mockGetPass(id: string) {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  const card = cards.find((c) => c.id === id);
  if (!card) throw new Error("Not found");
  const txs = LS.get<any[]>(MOCK_TX_KEY, []).filter((t) => t.passCardId === id);
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
  };
  cards.unshift(newCard);
  LS.set(MOCK_KEY, cards);

  const txs = LS.get<any[]>(MOCK_TX_KEY, []);
  txs.push({
    id: crypto.randomUUID(),
    passCardId: newCard.id,
    type: "Create",
    quantity: 10,
    performedBy: "system",
    createdAt: now,
  });
  LS.set(MOCK_TX_KEY, txs);

  return newCard;
}

async function mockUsePass(id: string, quantity: number, accountId?: string, comment?: string) {
  seedIfEmpty();
  const cards = LS.get<PassCard[]>(MOCK_KEY, []);
  const card = cards.find((c) => c.id === id);
  if (!card) return new Response("Not found", { status: 404 });
  if (card.status !== "Active") return new Response("Inactive card", { status: 400 });
  if (card.remainingUses < quantity) return new Response("Insufficient uses", { status: 400 });

  card.remainingUses -= quantity;
  LS.set(MOCK_KEY, cards);

  const txs = LS.get<any[]>(MOCK_TX_KEY, []);
  txs.push({
    id: crypto.randomUUID(),
    passCardId: id,
    type: "Use",
    quantity: -quantity,
    accountId: accountId ?? null,
    performedBy: "system",
    comment,
    createdAt: new Date().toISOString(),
  });
  LS.set(MOCK_TX_KEY, txs);

  return new Response(null, { status: 204 });
}

/* ----------------------------- Export público ---------------------------- */
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

export async function usePass(id: string, quantity: number, accountId?: string, comment?: string) {
  return USE_MOCKS ? mockUsePass(id, quantity, accountId, comment) : apiUsePass(id, quantity, accountId, comment);
}

/* ---- Helper para POS: consumir por número (lookup + use), opcional ---- */
export async function tryConsumePassByNumber(cardNumber: string, quantity: number, accountId?: string) {
  const { items } = await listPasses(cardNumber);
  const found = items.find((x) => x.cardNumber.toUpperCase() === cardNumber.toUpperCase());
  if (!found) throw new Error("Tarjeta no encontrada");
  const r = await usePass(found.id, quantity, accountId);
  if (!("ok" in r) || !r.ok) throw new Error("No se pudo consumir");
  return true;
}
