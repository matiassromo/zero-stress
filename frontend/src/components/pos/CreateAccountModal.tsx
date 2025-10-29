// src/components/pos/CreateAccountModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { openAccount, PRICES } from "@/lib/api/accounts";
import { listClients, createClient, UpsertClientInput } from "@/lib/api/clients";
import { Client } from "@/types/client";
import { listAvailableKeys, reserveKeys } from "@/lib/api/keys";

type Duration = "1H" | "8H" | "2M";

export default function CreateAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  // Cliente
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  // Datos básicos
  const [gender, setGender] = useState<"M" | "F">("M");
  const [counts, setCounts] = useState({ A: 0, N: 0, TE: 0, D: 0, AC: 0 });

  // Llaves
  const [availableKeys, setAvailableKeys] = useState<number[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [duration, setDuration] = useState<Duration>("1H");

  // Estado
  const [creating, setCreating] = useState(false);

  /* ---------- Buscar clientes (usa tu API/mocks) ---------- */
  useEffect(() => {
    (async () => {
      if (!query) {
        setResults([]);
        return;
      }
      const r = await listClients(query);
      setResults(r);
    })();
  }, [query]);

  /* ---------- Cargar llaves disponibles por género ---------- */
  useEffect(() => {
    (async () => {
      const free = await listAvailableKeys(gender);
      setAvailableKeys(free);
      setSelectedKeys([]); // reset si cambia género
    })();
  }, [gender]);

  /* ---------- Totales ---------- */
  const subtotalA = counts.A * PRICES.A;
  const subtotalN = counts.N * PRICES.N;
  const subtotalTE = counts.TE * PRICES.TE;
  const subtotalD = counts.D * PRICES.D;
  const subtotalAC = counts.AC * PRICES.AC;

  const subtotalKeys = 0; // si luego cobras por 1H/8H/2M, usa PRICES.KEY_*
  const total = useMemo(
    () =>
      +(
        subtotalA +
        subtotalN +
        subtotalTE +
        subtotalD +
        subtotalAC +
        subtotalKeys
      ).toFixed(2),
    [subtotalA, subtotalN, subtotalTE, subtotalD, subtotalAC, subtotalKeys]
  );

  function setCount(field: keyof typeof counts, v: number) {
    setCounts((c) => ({ ...c, [field]: Math.max(0, Math.floor(v || 0)) }));
  }

  /* ---------- Crea cliente si no existía ---------- */
  async function ensureClient(
    existing: Client | null,
    fallbackName: string
  ): Promise<Client> {
    if (existing) return existing;

    const name = fallbackName.trim();
    if (!name) throw new Error("Ingresa un nombre de cliente.");

    // Cumple tu contrato UpsertClientInput (backend espera 'number' como teléfono)
    const input: UpsertClientInput = {
      nationalId: "",
      name,
      email: "",
      address: "",
      number: "",
    };
    const created = await createClient(input);
    return created;
  }

  /* ---------- Crear cuenta ---------- */
  async function handleCreate() {
    try {
      setCreating(true);
      const c = await ensureClient(client, query);

      // Reservar llaves si hay
      if (selectedKeys.length) {
        await reserveKeys(gender, selectedKeys);
      }

      await openAccount({
        clientId: c.id,
        clientName: c.name,
        gender,
        counts,
        keys: selectedKeys.length ? { numbers: selectedKeys, duration } : undefined,
      });

      onCreated();
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  const canSubmit =
    (client || query.trim().length > 0) &&
    (counts.A + counts.N + counts.TE + counts.D + counts.AC > 0 ||
      selectedKeys.length > 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Abrir nueva cuenta</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        {/* Cliente */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Cliente</label>
          <input
            className="border rounded px-3 py-2"
            placeholder="Buscar o ingresar nombre…"
            value={client ? client.name : query}
            onChange={(e) => {
              setClient(null);
              setQuery(e.target.value);
            }}
          />
          {!client && results.length > 0 && (
            <div className="border rounded">
              {results.map((r) => {
                const extra = [r.nationalId, r.number]
                  .filter((x) => (x ?? "").toString().trim().length > 0)
                  .join(" — ");
                return (
                  <button
                    key={r.id}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    onClick={() => {
                      setClient(r);
                      setQuery("");
                    }}
                  >
                    {r.name}
                    {extra ? ` — ${extra}` : ""}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Género + llaves */}
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="text-sm font-medium">Género (para llaves)</label>
            <select
              className="border rounded px-3 py-2 w-full mt-1"
              value={gender}
              onChange={(e) => setGender(e.target.value as "M" | "F")}
            >
              <option value="M">Hombres</option>
              <option value="F">Mujeres</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Duración llaves</label>
            <select
              className="border rounded px-3 py-2 w-full mt-1"
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
            >
              <option value="1H">1H</option>
              <option value="8H">8H</option>
              <option value="2M">2M</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Llaves disponibles</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {availableKeys.map((n) => {
                const active = selectedKeys.includes(n);
                return (
                  <button
                    key={n}
                    onClick={() =>
                      setSelectedKeys((prev) =>
                        prev.includes(n)
                          ? prev.filter((x) => x !== n)
                          : [...prev, n]
                      )
                    }
                    className={`px-2 py-1 rounded border text-sm ${
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
              {availableKeys.length === 0 && (
                <span className="text-sm text-gray-500">
                  No hay llaves libres
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rubros */}
        <div className="mt-6 rounded-xl border">
          <div className="p-3 font-semibold border-b">Entradas</div>
          <div className="p-3 grid sm:grid-cols-5 gap-3">
            {(["A", "N", "TE", "D", "AC"] as const).map((k) => (
              <Counter
                key={k}
                label={labelOf(k)}
                price={priceOf(k)}
                value={(counts as any)[k]}
                onChange={(v) => setCount(k, v)}
              />
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <TotalCard label="Subtotal (entradas)" value={total - subtotalKeys} />
          <TotalCard label="Llaves" value={subtotalKeys} />
          <TotalCard label="Total" value={total} highlight />
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            className="px-3 py-2 rounded bg-gray-200"
            onClick={onClose}
            disabled={creating}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-full bg-blue-600 text-white disabled:opacity-60"
            onClick={handleCreate}
            disabled={!canSubmit || creating}
          >
            {creating ? "Creando…" : "Crear cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */

function Counter({
  label,
  price,
  value,
  onChange,
}: {
  label: string;
  price: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const subtotal = +(value * price).toFixed(2);
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-gray-500">Precio: ${price.toFixed(2)}</div>
      <div className="mt-2 flex items-center gap-2">
        <button className="px-2 py-1 rounded bg-gray-100" onClick={() => onChange(value - 1)}>
          -
        </button>
        <input
          type="number"
          className="w-16 text-center border rounded px-2 py-1"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
          min={0}
        />
        <button className="px-2 py-1 rounded bg-gray-100" onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
      <div className="mt-2 text-sm">
        Subtotal: <b>${subtotal.toFixed(2)}</b>
      </div>
    </div>
  );
}

function TotalCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "bg-emerald-50" : "bg-white"}`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-2xl font-semibold ${highlight ? "text-emerald-700" : ""}`}>
        ${value.toFixed(2)}
      </div>
    </div>
  );
}

function labelOf(k: "A" | "N" | "TE" | "D" | "AC") {
  return k === "A"
    ? "Adulto (A)"
    : k === "N"
    ? "Niño (N)"
    : k === "TE"
    ? "3ra edad (TE)"
    : k === "D"
    ? "Discapacidad (D)"
    : "Acompañante (AC)";
}
function priceOf(k: "A" | "N" | "TE" | "D" | "AC") {
  return k === "A"
    ? PRICES.A
    : k === "N"
    ? PRICES.N
    : k === "TE"
    ? PRICES.TE
    : k === "D"
    ? PRICES.D
    : PRICES.AC;
}
