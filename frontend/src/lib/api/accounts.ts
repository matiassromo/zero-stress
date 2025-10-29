// src/lib/api/accounts.ts
export type PosAccount = {
  id: string;
  status: "Abierta" | "Cerrada";
  openedAt: string;
  clientId: string;
  clientName: string;
  gender: "M" | "F";
  keys?: { numbers: number[]; duration: "1H" | "8H" | "2M" };
};

export type Charge = {
  id: string;
  kind: "Normal" | "Pase" | "Key";
  concept: string;
  qty: number;
  amount: number;
  total: number;
  status: "Pendiente" | "Pagado";
  createdAt: string;
};

export type Payment = {
  id: string;
  method: "Efectivo" | "Transferencia" | "Tarjeta";
  amount: number;
  note?: string;
  createdAt: string;
};

export type AccountSummary = {
  id: string;
  totalCargos: number;
  totalPagos: number;
  saldo: number;
};

type Store = {
  day: string; // YYYY-MM-DD
  accounts: PosAccount[];
  chargesByAccount: Record<string, Charge[]>;
  paymentsByAccount: Record<string, Payment[]>;
};

const KEY = "ZS_POS_STORE_v2";

export const PRICES = {
  A: 7.0,  // Adulto
  N: 4.0,  // Niño
  TE: 5.0, // Tercera edad
  D: 0.0,  // Discapacidad
  AC: 2.0, // Acompañante
  KEY_1H: 0.0,
  KEY_8H: 0.0,
  KEY_2M: 0.0,
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowISO() { return new Date().toISOString(); }
function uid(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
function isSSR() { return typeof window === "undefined"; }

function freshStore(): Store {
  return { day: todayStr(), accounts: [], chargesByAccount: {}, paymentsByAccount: {} };
}
function load(): Store {
  if (isSSR()) return freshStore();
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const init = freshStore();
    localStorage.setItem(KEY, JSON.stringify(init));
    return init;
  }
  const s = JSON.parse(raw) as Store;
  if (s.day !== todayStr()) {
    const init = freshStore();
    localStorage.setItem(KEY, JSON.stringify(init));
    return init;
  }
  return s;
}
function save(s: Store) { if (!isSSR()) localStorage.setItem(KEY, JSON.stringify(s)); }

/* ------------------ API ------------------ */
export async function listAccountsToday(): Promise<PosAccount[]> {
  return load().accounts;
}
export async function getAccount(id: string): Promise<AccountSummary> {
  const s = load();
  const charges = s.chargesByAccount[id] ?? [];
  const payments = s.paymentsByAccount[id] ?? [];
  const totalCargos = charges.reduce((acc, c) => acc + c.total, 0);
  const totalPagos = payments.reduce((acc, p) => acc + p.amount, 0);
  return { id, totalCargos, totalPagos, saldo: totalCargos - totalPagos };
}
export async function listCharges(id: string) { return load().chargesByAccount[id] ?? []; }
export async function listPayments(id: string) { return load().paymentsByAccount[id] ?? []; }

export async function addCharge(
  accountId: string,
  input: { kind: "Normal" | "Pase"; concept: string; qty: number; amount: number }
) {
  const s = load();
  const list = s.chargesByAccount[accountId] ?? [];
  const ch: Charge = {
    id: uid("ch"),
    kind: input.kind,
    concept: input.concept,
    qty: input.qty,
    amount: input.amount,
    total: +(input.qty * input.amount).toFixed(2),
    status: "Pendiente",
    createdAt: nowISO(),
  };
  s.chargesByAccount[accountId] = [ch, ...list];
  save(s);
  return ch;
}

export async function addPayment(
  accountId: string,
  input: { method: "Efectivo" | "Transferencia" | "Tarjeta"; amount: number; note?: string }
) {
  const s = load();
  const list = s.paymentsByAccount[accountId] ?? [];
  const p: Payment = {
    id: uid("pm"),
    method: input.method,
    amount: input.amount,
    note: input.note,
    createdAt: nowISO(),
  };
  s.paymentsByAccount[accountId] = [p, ...list];
  save(s);
  return p;
}

export async function markChargePaid(accountId: string, chargeId: string) {
  const s = load();
  const list = s.chargesByAccount[accountId] ?? [];
  const i = list.findIndex((c) => c.id === chargeId);
  if (i >= 0) {
    list[i] = { ...list[i], status: "Pagado" };
    s.chargesByAccount[accountId] = list;
    save(s);
  }
}

export async function closeAccount(id: string) {
  const s = load();
  s.accounts = s.accounts.map((a) => (a.id === id ? { ...a, status: "Cerrada" } : a));
  save(s);
}

export async function openAccount(input: {
  clientId: string;
  clientName: string;
  gender: "M" | "F";
  counts: { A: number; N: number; TE: number; D: number; AC: number };
  keys?: { numbers: number[]; duration: "1H" | "8H" | "2M" };
}) {
  const s = load();
  const id = nextAccountId(s.accounts);
  const account: PosAccount = {
    id,
    status: "Abierta",
    openedAt: nowISO(),
    clientId: input.clientId,
    clientName: input.clientName,
    gender: input.gender,
    keys: input.keys,
  };
  s.accounts = [account, ...s.accounts];

  // Cargos por rubros
  const charges: Charge[] = [];
  addChargeIf(charges, "Normal", "Adulto (A)", input.counts.A, PRICES.A);
  addChargeIf(charges, "Normal", "Niño (N)", input.counts.N, PRICES.N);
  addChargeIf(charges, "Normal", "Tercera edad (TE)", input.counts.TE, PRICES.TE);
  addChargeIf(charges, "Normal", "Discapacidad (D)", input.counts.D, PRICES.D);
  addChargeIf(charges, "Normal", "Acompañante (AC)", input.counts.AC, PRICES.AC);

  // Cargo por llaves (opcional si cobras)
  if (input.keys?.numbers?.length) {
    const dur = input.keys.duration;
    const price = dur === "1H" ? PRICES.KEY_1H : dur === "8H" ? PRICES.KEY_8H : PRICES.KEY_2M;
    addChargeIf(charges, "Key", `Llaves ${input.keys.numbers.join(", ")} (${dur})`, 1, price);
  }

  s.chargesByAccount[id] = [...(s.chargesByAccount[id] ?? []), ...charges];
  save(s);
  return account;
}

/* ---------- helpers ---------- */
function addChargeIf(
  list: Charge[],
  kind: Charge["kind"],
  label: string,
  qty: number,
  price: number
) {
  if (!qty) return;
  list.push({
    id: uid("ch"),
    kind,
    concept: label,
    qty,
    amount: price,
    total: +(qty * price).toFixed(2),
    status: "Pendiente",
    createdAt: nowISO(),
  });
}

function nextAccountId(existing: PosAccount[]) {
  const nums = existing.map((a) => parseInt(a.id, 10)).filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return next.toString().padStart(3, "0");
}
