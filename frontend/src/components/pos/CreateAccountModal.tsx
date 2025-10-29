// src/components/pos/CreateAccountModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PRICES,
  openAccount,
  findPassByHolder,
  createPassForHolder,
  consumePass,
} from "@/lib/api/accounts";
import {
  listClients,
  createClient,
  UpsertClientInput,
} from "@/lib/api/clients";
import { Client } from "@/types/client";
import { SelectedKey, PosEntryType, KeyGender } from "@/types/pos";
import { listAvailableKeys, reserveKeys } from "@/lib/api/keys";

type Duration = "1H" | "8H" | "2M";

export default function CreateAccountModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  /* ---------- Cliente ---------- */
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Client[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  /* ---------- Tipo de entrada ---------- */
  const [entryType, setEntryType] = useState<PosEntryType>("normal");

  /* ---------- Rubros (solo normal) ---------- */
  const [counts, setCounts] = useState({ A: 0, N: 0, TE: 0, D: 0, AC: 0 });

  /* ---------- Pases ---------- */
  const peopleCount = counts.A + counts.N + counts.TE + counts.D + counts.AC;
  const [passState, setPassState] = useState<{
    loading: boolean;
    exists: boolean;
    remaining: number;
  }>({
    loading: false,
    exists: false,
    remaining: 0,
  });

  /* ---------- Llaves ---------- */
  const [keyGender, setKeyGender] = useState<KeyGender>("H"); // "H" | "M"
  const [availableKeys, setAvailableKeys] = useState<number[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<SelectedKey[]>([]);
  const [duration, setDuration] = useState<Duration>("1H");

  /* ---------- Estado ---------- */
  const [creating, setCreating] = useState(false);

  /* ---------- Buscar clientes ---------- */
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

  /* ---------- Cargar llaves por género H/M ---------- */
  useEffect(() => {
    (async () => {
      const free = await listAvailableKeys(keyGender);
      setAvailableKeys(free);
      // si cambia de H->M o viceversa, mantén solo las del género activo
      setSelectedKeys((prev) => prev.filter((k) => k.gender === keyGender));
    })();
  }, [keyGender]);

  /* ---------- Totales ---------- */
  const entriesSubtotal = useMemo(() => {
    if (entryType === "pass") return 0;
    return +(
      counts.A * PRICES.A +
      counts.N * PRICES.N +
      counts.TE * PRICES.TE +
      counts.D * PRICES.D +
      counts.AC * PRICES.AC
    ).toFixed(2);
  }, [entryType, counts]);

  const passSale = entryType === "pass" && !passState.exists ? PRICES.PASS : 0;
  const keysSubtotal = 0; // si en el futuro cobras por llaves, cámbialo aquí

  const total = useMemo(
    () => +(entriesSubtotal + passSale + keysSubtotal).toFixed(2),
    [entriesSubtotal, passSale, keysSubtotal]
  );

  function setCount(field: keyof typeof counts, v: number) {
    const n = Math.max(0, Math.floor(Number.isFinite(v) ? v : 0));
    setCounts((c) => ({ ...c, [field]: n }));
  }

  async function ensureClient(
    existing: Client | null,
    fallbackName: string
  ): Promise<Client> {
    if (existing) return existing;
    const name = fallbackName.trim();
    if (!name) throw new Error("Ingresa un nombre de cliente.");

    const input: UpsertClientInput = {
      nationalId: "",
      name,
      email: "",
      address: "",
      number: "",
    };
    return createClient(input);
  }

  async function lookupPass(holderName: string) {
    setPassState((s) => ({ ...s, loading: true }));
    const found = await findPassByHolder(holderName);
    setPassState({
      loading: false,
      exists: !!found,
      remaining: found?.remaining ?? 0,
    });
  }

  /* ---------- Crear cuenta ---------- */
  async function handleCreate() {
    try {
      setCreating(true);
      const holder = await ensureClient(client, query);

      // Validaciones mínimas
      if (peopleCount === 0)
        throw new Error("Agrega al menos 1 persona para continuar.");

      // Reservar llaves seleccionadas del género activo (H/M)
      if (selectedKeys.length) {
        const numbers = selectedKeys
          .filter((k) => k.gender === keyGender)
          .map((k) => k.number);
        if (numbers.length) await reserveKeys(keyGender, numbers);
      }

      // PASES: crear si no existe y cobrar $55; si existe, validar usos
      let willCreatePass = false;
      if (entryType === "pass") {
        const found = await findPassByHolder(holder.name);
        if (!found) {
          await createPassForHolder(holder.name);
          willCreatePass = true; // se cobra en cargos (accounts.ts)
        } else if (found.remaining < peopleCount) {
          throw new Error(
            `Pase sin usos suficientes. Restantes: ${found.remaining}`
          );
        }
      }

      // Armar llaves elegidas (añadir duración)
      const keysToAttach: SelectedKey[] = selectedKeys.map((k) => ({
        ...k,
        duration,
      }));

      // Abrir cuenta + cargos
      await openAccount({
        clientId: holder.id,
        clientName: holder.name,
        gender: "M", // si luego agregas campo, pásalo real aquí ("M" | "F")
        entryType,
        counts: entryType === "normal" ? counts : undefined,
        peopleCount,
        keys:
          keysToAttach.length > 0
            ? { items: keysToAttach, duration }
            : undefined,
        createPassIfMissing: entryType === "pass",
      });

      // Descuento de usos (cuando el pase ya existía)
      if (entryType === "pass" && !willCreatePass) {
        await consumePass(holder.name, peopleCount);
      }

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
    (peopleCount > 0 || selectedKeys.length > 0);

  /* ---------- UI ---------- */
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-lg">
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
            <div className="border rounded max-h-48 overflow-auto">
              {results.map((r) => (
                <button
                  key={r.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onClick={() => {
                    setClient(r);
                    setQuery("");
                  }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tipo de entrada */}
        <div className="mt-4">
          <label className="text-sm font-medium">Tipo de entrada</label>
          <div className="mt-2 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={entryType === "normal"}
                onChange={() => setEntryType("normal")}
              />
              <span>Normal</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={entryType === "pass"}
                onChange={() => setEntryType("pass")}
              />
              <span>Tarjeta 10 pases</span>
            </label>
          </div>
        </div>

        {/* Entradas */}
        <div className="mt-4 rounded-xl border">
          <div className="p-3 font-semibold border-b">Entradas</div>
          {entryType === "normal" ? (
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
          ) : (
            <div className="p-3 grid sm:grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-medium">Personas que ingresan</div>
                <input
                  type="number"
                  min={1}
                  className="mt-1 border rounded px-3 py-2 w-40"
                  value={peopleCount}
                  onChange={(e) => {
                    const v = Math.max(
                      0,
                      parseInt(e.target.value || "0", 10)
                    );
                    // para pase, usamos A=v como contador simple
                    setCounts({ A: v, N: 0, TE: 0, D: 0, AC: 0 });
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se descontarán {peopleCount} usos del pase.
                </p>
              </div>
              <div>
                <div className="text-sm font-medium">Validar pase</div>
                <button
                  className="mt-1 px-3 py-2 rounded bg-gray-100"
                  disabled={!(client || query.trim()) || passState.loading}
                  onClick={() => lookupPass(client ? client.name : query)}
                >
                  {passState.loading ? "Buscando…" : "Buscar pase por nombre"}
                </button>
                <p className="mt-2 text-sm">
                  {passState.exists ? (
                    <>
                      ✔ Pase encontrado. Restantes:{" "}
                      <b>{passState.remaining}</b>
                    </>
                  ) : (
                    <>
                      ✖ No existe pase. Se podrá crear y cobrar{" "}
                      <b>${PRICES.PASS}</b>.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Llaves */}
        <div className="mt-4 rounded-xl border p-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <div className="text-sm font-medium">Género (para llaves)</div>
              <select
                className="border rounded px-3 py-2 w-full mt-1"
                value={keyGender}
                onChange={(e) => setKeyGender(e.target.value as KeyGender)}
              >
                <option value="H">Hombres</option>
                <option value="M">Mujeres</option>
              </select>
            </div>

            <div>
              <div className="text-sm font-medium">Duración llaves</div>
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
              <div className="text-sm font-medium">
                Llaves disponibles ({keyGender})
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {availableKeys.map((n) => {
                  const active = selectedKeys.some(
                    (k) => k.number === n && k.gender === keyGender
                  );
                  return (
                    <button
                      key={n}
                      onClick={() =>
                        setSelectedKeys((prev) =>
                          active
                            ? prev.filter(
                                (k) =>
                                  !(
                                    k.number === n && k.gender === keyGender
                                  )
                              )
                            : [
                                ...prev,
                                {
                                  keyId: `${keyGender}-${n}`,
                                  number: n,
                                  gender: keyGender,
                                  duration,
                                },
                              ]
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

          {selectedKeys.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium">Seleccionadas</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {selectedKeys.map((k) => (
                  <span
                    key={k.keyId}
                    className="px-2 py-1 rounded-full bg-gray-100 border"
                  >
                    {k.number}
                    {k.gender} · {k.duration}
                    <button
                      className="ml-2 opacity-70 hover:opacity-100"
                      onClick={() =>
                        setSelectedKeys((prev) =>
                          prev.filter((x) => x.keyId !== k.keyId)
                        )
                      }
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totales */}
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <TotalCard
            label="Subtotal (entradas)"
            value={entryType === "normal" ? entriesSubtotal : 0}
          />
          <TotalCard label="Venta de pase" value={passSale} />
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
  const safe = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const subtotal = +(safe * price).toFixed(2);
  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-gray-500">Precio: ${price.toFixed(2)}</div>
      <div className="mt-2 flex items-center gap-2">
        <button
          className="px-2 py-1 rounded bg-gray-100"
          onClick={() => onChange(Math.max(0, safe - 1))}
        >
          -
        </button>
        <input
          type="number"
          className="w-16 text-center border rounded px-2 py-1"
          value={safe}
          onChange={(e) =>
            onChange(Math.max(0, parseInt(e.target.value || "0", 10)))
          }
          min={0}
        />
        <button
          className="px-2 py-1 rounded bg-gray-100"
          onClick={() => onChange(safe + 1)}
        >
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
    <div
      className={`rounded-xl border p-4 ${
        highlight ? "bg-emerald-50" : "bg-white"
      }`}
    >
      <div className="text-sm text-gray-500">{label}</div>
      <div
        className={`text-2xl font-semibold ${
          highlight ? "text-emerald-700" : ""
        }`}
      >
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
