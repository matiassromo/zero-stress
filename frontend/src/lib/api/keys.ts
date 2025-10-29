// src/lib/api/keys.ts
import { nanoid } from "nanoid";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export type LockerZone = "Hombres" | "Mujeres";
export type KeyStatus = "disponible" | "ocupada";

export interface LockerKey {
  id: string;          // uuid
  code: string;        // "1H" | "1M" ...
  zone: LockerZone;    // Hombres / Mujeres
  status: KeyStatus;
  assignedTo?: string; // nombre cuenta/persona
  since?: string;      // ISO
}

/* -------------------- MOCKS -------------------- */
const LS_KEY = "zs.keys.v1";

function seedIfNeeded() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return;
  const list: LockerKey[] = [];
  for (let i = 1; i <= 16; i++) {
    list.push({ id: nanoid(), code: `${i}H`, zone: "Hombres", status: "disponible" });
  }
  for (let i = 1; i <= 16; i++) {
    list.push({ id: nanoid(), code: `${i}M`, zone: "Mujeres", status: "disponible" });
  }
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function readAll(): LockerKey[] {
  seedIfNeeded();
  const raw = localStorage.getItem(LS_KEY);
  return raw ? (JSON.parse(raw) as LockerKey[]) : [];
}

function writeAll(list: LockerKey[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* -------------------- API base -------------------- */
export async function listKeys(): Promise<LockerKey[]> {
  if (USE_MOCKS) return readAll();
  // Reemplaza por tu ASP.NET si aplica:
  // return http<LockerKey[]>('/keys');
  return readAll();
}

export async function assignKey(code: string, assignedTo: string) {
  if (USE_MOCKS) {
    const all = readAll();
    const k = all.find((x) => x.code === code);
    if (!k) throw new Error("Llave no encontrada");
    if (k.status === "ocupada") throw new Error("La llave ya está ocupada");
    k.status = "ocupada";
    k.assignedTo = assignedTo;
    k.since = new Date().toISOString();
    writeAll(all);
    return k;
  }
  // POST /keys/{code}/assign
}

export async function releaseKey(code: string) {
  if (USE_MOCKS) {
    const all = readAll();
    const k = all.find((x) => x.code === code);
    if (!k) throw new Error("Llave no encontrada");
    k.status = "disponible";
    k.assignedTo = undefined;
    k.since = undefined;
    writeAll(all);
    return k;
  }
  // POST /keys/{code}/release
}

/* -------------------- Helpers H/M -------------------- */
type KeyGenderHM = "H" | "M";

function genderToZone(g: KeyGenderHM): LockerZone {
  return g === "H" ? "Hombres" : "Mujeres";
}
function codeFrom(g: KeyGenderHM, n: number) {
  return `${n}${g}`;
}
function numberFrom(code: string) {
  return parseInt(code.slice(0, -1), 10);
}

/* -------------------- API esperada por el modal -------------------- */
/**
 * Devuelve los números (1..16) de llaves disponibles para un género ("H" | "M").
 */
export async function listAvailableKeys(gender: KeyGenderHM): Promise<number[]> {
  const all = await listKeys();
  const zone = genderToZone(gender);
  return all
    .filter((k) => k.zone === zone && k.status === "disponible" && k.code.endsWith(gender))
    .map((k) => numberFrom(k.code))
    .sort((a, b) => a - b);
}

/**
 * Reserva (marca como ocupadas) varias llaves por género y número.
 * `assignedTo` es opcional; por defecto "POS".
 */
export async function reserveKeys(
  gender: KeyGenderHM,
  numbers: number[],
  assignedTo = "POS"
): Promise<void> {
  for (const n of numbers) {
    await assignKey(codeFrom(gender, n), assignedTo);
  }
}

/**
 * (Opcional) Libera varias llaves por género y número.
 */
export async function releaseKeysBulk(gender: KeyGenderHM, numbers: number[]): Promise<void> {
  for (const n of numbers) {
    await releaseKey(codeFrom(gender, n));
  }
}
