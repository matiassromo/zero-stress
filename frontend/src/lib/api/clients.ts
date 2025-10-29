// src/lib/api/clients.ts
import { Client, ClientId } from "@/types/client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://localhost:7013";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/* -------------------- HTTP helper -------------------- */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

/* -------------------- Tipos -------------------- */
export interface UpsertClientInput {
  nationalId: string;
  name: string;
  email: string;
  address: string;
  number: string; // <- importante
}

/* -------------------- MOCKS -------------------- */
const LS_KEY = "zs.clients";
function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}
function readLS(): Client[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(LS_KEY);
  return raw ? (JSON.parse(raw) as Client[]) : [];
}
function writeLS(list: Client[]) {
  if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(list));
}

/* -------------------- API -------------------- */
export async function listClients(q?: string): Promise<Client[]> {
  if (!USE_MOCKS) {
    const data = await http<any[]>(`/api/Clients`);
    return (q
      ? data.filter((d) => {
          const c = normalize(d);
          const s = (q ?? "").toLowerCase();
          return (
            c.name.toLowerCase().includes(s) ||
            c.nationalId?.includes(q!) ||
            c.number?.includes(q!) ||
            c.email.toLowerCase().includes(s)
          );
        })
      : data
    ).map(normalize);
  }
  const all = readLS();
  if (!q) return all;
  const s = q.toLowerCase();
  return all.filter(
    (c) =>
      c.name.toLowerCase().includes(s) ||
      c.nationalId.includes(q) ||
      c.number.includes(q) ||
      c.email.toLowerCase().includes(s)
  );
}

export async function getClient(id: ClientId): Promise<Client | null> {
  if (!USE_MOCKS) {
    const dto = await http<any>(`/api/Clients/${id}`);
    return dto ? normalize(dto) : null;
  }
  return readLS().find((c) => c.id === id) ?? null;
}

export async function createClient(input: UpsertClientInput): Promise<Client> {
  if (!USE_MOCKS) {
    const dto = await http<any>(`/api/Clients`, {
      method: "POST",
      body: JSON.stringify(input), // backend espera "number", no "phone"
    });
    return normalize(dto);
  }
  const now = new Date().toISOString();
  const newItem: Client = { id: uid(), ...input, createdAt: now, updatedAt: now };
  const list = readLS();
  list.push(newItem);
  writeLS(list);
  return newItem;
}

export async function updateClient(id: ClientId, input: UpsertClientInput): Promise<Client> {
  if (!USE_MOCKS) {
    const dto = await http<any>(`/api/Clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return normalize(dto);
  }
  const list = readLS();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Cliente no encontrado");
  list[idx] = { ...list[idx], ...input, updatedAt: new Date().toISOString() };
  writeLS(list);
  return list[idx];
}

export async function deleteClient(id: ClientId): Promise<void> {
  if (!USE_MOCKS) {
    await http<void>(`/api/Clients/${id}`, { method: "DELETE" });
    return;
  }
  const next = readLS().filter((c) => c.id !== id);
  writeLS(next);
}

/* Normaliza por si tu DTO viene en PascalCase o camelCase */
function normalize(dto: any): Client {
  return {
    id: dto.id ?? dto.Id,
    nationalId: dto.nationalId ?? dto.NationalId,
    name: dto.name ?? dto.Name,
    email: dto.email ?? dto.Email,
    address: dto.address ?? dto.Address,
    number: dto.number ?? dto.Number,
    createdAt: dto.createdAt ?? dto.CreatedAt ?? null,
    updatedAt: dto.updatedAt ?? dto.UpdatedAt ?? null,
  } as Client;
}
