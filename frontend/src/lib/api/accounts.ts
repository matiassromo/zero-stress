// src/lib/api/accounts.ts
import { PosEntryType, SelectedKey } from "@/types/pos";

export type PosAccount = {
  id: string;
  status: "Abierta" | "Cerrada";
  openedAt: string;
  clientId: string;
  clientName: string;

  // Género del cliente si lo usas para otra cosa ("M" | "F")
  gender: "M" | "F";

  // Llaves asignadas con género de llave (H/M)
  keys?: { items: SelectedKey[]; duration: "1H" | "8H" | "2M" };

  // Tipo de entrada usado al abrir
  entryType: PosEntryType;
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

type PassRecord = {
  id: string;
  holderName: string;
  remaining: number;
  active: boolean;
};

type Store = {
  day: string; // YYYY-MM-DD
  accounts: PosAccount[];
  chargesByAccount: Record<string, Charge[]>;
  paymentsByAccount: Record<string, Payment[]>;
  passesByHolder: Record<string, PassRecord>; // clave normalizada por nombre
};

const KEY = "ZS_POS_STORE_v3";

export const PRICES = {
  A: 7.0,  // Adulto
  N: 4.0,  // Niño
  TE: 5.0, // Tercera edad
  D: 5.0,  // Discapacidad
  AC: 1.0, // Acompañante
  PASS: 55.0,
  KEY_1H: 0.0,
  KEY_8H: 0.0,
  KEY_2M: 0.0,
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function nowISO() { return new Date().toISOString(); }
function uid(prefix = "id") { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
function isSSR() { return typeof window === "undefined"; }
function normName(s: string) { return s.trim().toLowerCase(); }

function freshStore(): Store {
  return {
    day: todayStr(),
    accounts: [],
    chargesByAccount: {},
    paymentsByAccount: {},
    passesByHolder: {},
  };
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
  // migraciones simples
  if (!("passesByHolder" in s)) (s as any).passesByHolder = {};
  return s;
}
function save(s: Store) { if (!isSSR()) localStorage.setItem(KEY, JSON.stringify(s)); }

/* ------------------ API cuentas ------------------ */
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
  input: { kind: "Normal" | "Pase" | "Key"; concept: string; qty: number; amount: number }
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

/* ------------------ PASES (mock local) ------------------ */
export async function findPassByHolder(holderName: string) {
  const s = load();
  const rec = s.passesByHolder[normName(holderName)];
  return rec ?? null;
}

export async function createPassForHolder(holderName: string) {
  const s = load();
  const key = normName(holderName);
  const existing = s.passesByHolder[key];
  if (existing?.active) return existing;
  const rec: PassRecord = {
    id: uid("pass"),
    holderName,
    remaining: 10,
    active: true,
  };
  s.passesByHolder[key] = rec;
  save(s);
  return rec;
}

export async function consumePass(holderName: string, uses: number) {
  const s = load();
  const key = normName(holderName);
  const rec = s.passesByHolder[key];
  if (!rec || !rec.active) throw new Error("Pase no encontrado o inactivo.");
  if (rec.remaining < uses) throw new Error("Pase sin usos suficientes.");
  rec.remaining -= uses;
  save(s);
  return rec.remaining;
}

/* ------------------ Abrir cuenta ------------------ */
export async function openAccount(input: {
  clientId: string;
  clientName: string;
  gender: "M" | "F"; // del cliente
  entryType: PosEntryType;
  counts?: { A: number; N: number; TE: number; D: number; AC: number }; // si normal
  peopleCount: number; // total personas que ingresan
  keys?: { items: SelectedKey[]; duration: "1H" | "8H" | "2M" };
  createPassIfMissing?: boolean; // si entryType=pass y no existe
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
    entryType: input.entryType,
  };
  s.accounts = [account, ...s.accounts];

  const charges: Charge[] = [];

  // Cargos por entradas (NORMAL)
  if (input.entryType === "normal" && input.counts) {
    addChargeIf(charges, "Normal", "Adulto (A)",        input.counts.A,  PRICES.A);
    addChargeIf(charges, "Normal", "Niño (N)",          input.counts.N,  PRICES.N);
    addChargeIf(charges, "Normal", "Tercera edad (TE)", input.counts.TE, PRICES.TE);
    addChargeIf(charges, "Normal", "Discapacidad (D)",  input.counts.D,  PRICES.D);
    addChargeIf(charges, "Normal", "Acompañante (AC)",  input.counts.AC, PRICES.AC);
  }

  // Cargos por pase (PASS)
  if (input.entryType === "pass") {
    const found = await findPassByHolder(input.clientName);
    if (!found) {
      if (input.createPassIfMissing) {
        // vender y crear pase
        await createPassForHolder(input.clientName);
        addChargeIf(charges, "Pase", "Tarjeta 10 pases", 1, PRICES.PASS);
      } else {
        throw new Error("No existe pase para este titular.");
      }
    } else {
      // solo consumo de usos, sin cargos adicionales
      // el consumo real se hace afuera para simplificar (desde el componente)
    }
  }

  // Cargo por llaves (si cobras) + detalle "5H, 2M"
  if (input.keys?.items?.length) {
    const dur = input.keys.duration;
    const tag = input.keys.items.map(k => `${k.number}${k.gender}`).join(", ");
    const price =
      dur === "1H" ? PRICES.KEY_1H : dur === "8H" ? PRICES.KEY_8H : PRICES.KEY_2M;
    addChargeIf(charges, "Key", `Llaves ${tag} (${dur})`, 1, price);
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
