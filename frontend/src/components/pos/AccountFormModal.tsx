// src/components/pos/AccountFormModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

// ✅ clientes
import { listClients, createClient } from "@/lib/api/clients";
import type { Client } from "@/types/client";

// ✅ llaves backend real
import { listKeys, updateKey } from "@/lib/apiv2/keys";
import type { Key } from "@/types/key";

// ✅ tipos POS
import type { PosEntryType, SelectedKey, KeyGender as UiKeyGender } from "@/types/pos";

// ✅ Ajusta estos 2 valores a los que EXISTEN en tu src/types/pos.ts
const ENTRY_NORMAL = "normal" as PosEntryType;
const ENTRY_PASS10 = "tarjeta10" as PosEntryType; // <- CAMBIA a tu valor real


function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

type Mode = "create" | "edit";
type PayGender = "M" | "F";
type KeyGender = "H" | "M";

function formatMoney(n: number) {
  const x = Number.isFinite(n) ? n : 0;
  return `$${x.toFixed(2)}`;
}

/**
 * Si tu proyecto tiene PRICES en otro path, ajusta este import/const.
 * Estos son los que se ven en tu modal (Adulto 7, Niño 4, TE 5, D 5, AC 1).
 */
const DEFAULT_PRICES = {
  adult: 7,
  child: 4,
  te: 5,
  dis: 5,
  ac: 1,
  passSale: 55, // Tarjeta 10 pases (venta)
  parkingRateLabel: "0.50 la hora o fracción",
};

function computeKeyGenderAndNumber(orderedIndex: number): { gender: KeyGender; number: number } {
  const gender: KeyGender = orderedIndex < 16 ? "H" : "M";
  const number = gender === "H" ? orderedIndex + 1 : orderedIndex - 16 + 1;
  return { gender, number };
}

async function fetchAvailableKeysByGender(gender: KeyGender): Promise<number[]> {
  const raw: Key[] = await listKeys();
  const ordered = [...raw].sort((a, b) => a.id.localeCompare(b.id));

  const free: number[] = [];
  ordered.forEach((k, index) => {
    const g = index < 16 ? "H" : "M";
    if (g !== gender) return;

    const num = g === "H" ? index + 1 : index - 16 + 1;
    if (k.available) free.push(num);
  });

  return free.sort((a, b) => a - b);
}

async function findKeyEntityByGenderNumber(g: KeyGender, n: number): Promise<Key | null> {
  const raw: Key[] = await listKeys();
  const ordered = [...raw].sort((a, b) => a.id.localeCompare(b.id));

  for (let idx = 0; idx < ordered.length; idx++) {
    const { gender, number } = computeKeyGenderAndNumber(idx);
    if (gender === g && number === n) return ordered[idx];
  }
  return null;
}

export type AccountFormPeople = {
  adult: number;
  child: number;
  te: number;
  dis: number;
  ac: number;
};

export type AccountFormKey = { gender: KeyGender; number: number };

export type AccountFormInitial = {
  clientId?: string | null;
  clientName?: string | null;

  entryType?: PosEntryType; // "Normal" | "Tarjeta 10 pases"
  gender?: PayGender; // género cliente (para otras reglas)
  requiresParking?: boolean;

  people?: Partial<AccountFormPeople>;

  // llaves que "ya tiene" la cuenta en edición
  keys?: AccountFormKey[];
};

export type AccountFormSubmit = {
  // cliente final
  clientId: string;
  clientName: string;

  entryType: PosEntryType;
  gender: PayGender;
  requiresParking: boolean;

  people: AccountFormPeople;

  // llaves que deben quedar asignadas al guardar
  keys: AccountFormKey[];

  // Totales ya calculados (opcional, útil para auditoría)
  totals: {
    entriesSubtotal: number;
    passSale: number;
    grandTotal: number;
  };
};

export default function AccountFormModal({
  mode,
  initial,
  onCancel,
  onSubmit,
}: {
  mode: Mode;
  initial?: AccountFormInitial;
  onCancel: () => void;
  onSubmit: (payload: AccountFormSubmit) => Promise<void> | void;
}) {
  // -------------------- CLIENTE --------------------
  const [clients, setClients] = useState<Client[]>([]);
  const [clientQ, setClientQ] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");

  const [loadingClients, setLoadingClients] = useState(false);

  // -------------------- FORM --------------------
  const [entryType, setEntryType] = useState<PosEntryType>(() => initial?.entryType ?? ENTRY_NORMAL);
  const [gender, setGender] = useState<PayGender>(initial?.gender ?? "M");
  const [requiresParking, setRequiresParking] = useState<boolean>(!!initial?.requiresParking);

  const [people, setPeople] = useState<AccountFormPeople>({
    adult: Math.max(0, initial?.people?.adult ?? 0),
    child: Math.max(0, initial?.people?.child ?? 0),
    te: Math.max(0, initial?.people?.te ?? 0),
    dis: Math.max(0, initial?.people?.dis ?? 0),
    ac: Math.max(0, initial?.people?.ac ?? 0),
  });

  // -------------------- LLAVES --------------------
  const [keyGender, setKeyGender] = useState<KeyGender>(() => {
    // si ya tiene llaves en edición, usar el género de la primera
    const k = initial?.keys?.[0];
    return k?.gender ?? "H";
  });

  const [availableKeys, setAvailableKeys] = useState<number[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<AccountFormKey[]>(initial?.keys ?? []);

  // -------------------- SUBMIT --------------------
  const [saving, setSaving] = useState(false);
  const PRICES = DEFAULT_PRICES;

  // -------------------- LOAD CLIENTS --------------------
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoadingClients(true);
      try {
        const data = await listClients();
        if (!alive) return;
        setClients(data);

        // precarga inicial
        if (mode === "edit") {
          const initName = (initial?.clientName ?? "").trim();
          if (initName) setClientName(initName);

          const initId = (initial?.clientId ?? "").trim();
          if (initId) setSelectedClientId(initId);
        }
      } finally {
        if (alive) setLoadingClients(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------- FILTRO CLIENTE --------------------
  const filteredClients = useMemo(() => {
    const nq = norm(clientQ);
    if (!nq) return clients;
    return clients.filter((c: any) => norm(c.name ?? c.fullName ?? c.nombre ?? "").includes(nq));
  }, [clients, clientQ]);

  // -------------------- AUTO-SET CLIENT NAME --------------------
  useEffect(() => {
    if (!selectedClientId) return;
    const found = clients.find((c: any) => (c.id ?? "") === selectedClientId);
    const name =
      (found as any)?.name ??
      (found as any)?.fullName ??
      (found as any)?.nombre ??
      (found as any)?.clientName ??
      "";
    if (name) setClientName(String(name));
  }, [selectedClientId, clients]);

  // si en edit no tenemos clientId pero sí nombre, y el usuario selecciona de la lista, ok.

  // -------------------- LOAD KEYS AVAILABLE --------------------
  async function reloadKeys() {
    setLoadingKeys(true);
    try {
      const freeNums = await fetchAvailableKeysByGender(keyGender);

      // En edición: si ya tiene llaves ocupadas, deben mostrarse “seleccionables”
      // aunque no estén disponibles. Para eso, unimos:
      // - disponibles reales (freeNums)
      // - llaves ya seleccionadas del mismo género (selectedKeys)
      const already = selectedKeys
        .filter((k) => k.gender === keyGender)
        .map((k) => k.number);

      const union = Array.from(new Set([...freeNums, ...already])).sort((a, b) => a - b);
      setAvailableKeys(union);
    } finally {
      setLoadingKeys(false);
    }
  }

  useEffect(() => {
    reloadKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyGender]);

  // -------------------- HELPERS PEOPLE --------------------
  function incPeople(k: keyof AccountFormPeople) {
    setPeople((p) => ({ ...p, [k]: (p[k] ?? 0) + 1 }));
  }
  function decPeople(k: keyof AccountFormPeople) {
    setPeople((p) => ({ ...p, [k]: Math.max(0, (p[k] ?? 0) - 1) }));
  }

  // -------------------- HELPERS KEYS --------------------
  function isKeySelected(g: KeyGender, n: number) {
    return selectedKeys.some((k) => k.gender === g && k.number === n);
  }

  function toggleKey(g: KeyGender, n: number) {
    setSelectedKeys((prev) => {
      const exists = prev.some((k) => k.gender === g && k.number === n);
      if (exists) return prev.filter((k) => !(k.gender === g && k.number === n));
      return [...prev, { gender: g, number: n }];
    });
  }

  // -------------------- TOTALS --------------------
  const entriesSubtotal = useMemo(() => {
    const a = people.adult * PRICES.adult;
    const n = people.child * PRICES.child;
    const te = people.te * PRICES.te;
    const dis = people.dis * PRICES.dis;
    const ac = people.ac * PRICES.ac;
    return a + n + te + dis + ac;
  }, [people, PRICES]);

  const passSale = useMemo(() => {
    return entryType === ENTRY_PASS10 ? PRICES.passSale : 0;
  }, [entryType, PRICES]);

  const grandTotal = useMemo(() => {
    return entriesSubtotal + passSale;
  }, [entriesSubtotal, passSale]);

  // -------------------- VALIDATION --------------------
  const canSubmit = useMemo(() => {
    const nameOk = (clientName ?? "").trim().length >= 2;

    // Si es create: requiere counts o tarjeta; en edit dejamos editar aunque quede en 0.
    // Si quieres forzar al menos 1 persona, descomenta:
    // const totalPeople = people.adult + people.child + people.te + people.dis + people.ac;
    // const peopleOk = totalPeople > 0 || entryType === "Tarjeta 10 pases";
    const peopleOk = true;

    return nameOk && peopleOk && !saving;
  }, [clientName, saving]);

  // -------------------- SUBMIT --------------------
  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    try {
      // 1) Resolver clientId
      let finalClientId = selectedClientId;

      // Si no hay client seleccionado, intentamos buscarlo por nombre (match exact normalizado)
      if (!finalClientId) {
        const target = norm(clientName);
        const found = clients.find((c: any) => norm(c.name ?? c.fullName ?? c.nombre ?? "") === target);
        if (found?.id) finalClientId = String(found.id);
      }

      // Si sigue sin id, creamos cliente
      if (!finalClientId) {
        const created = await createClient({
          name: clientName.trim(),
        } as any);
        finalClientId = String((created as any)?.id ?? "");
      }

      if (!finalClientId) throw new Error("No se pudo resolver el cliente.");

      const payload: AccountFormSubmit = {
        clientId: finalClientId,
        clientName: clientName.trim(),
        entryType,
        gender,
        requiresParking,
        people: {
          adult: Math.max(0, people.adult | 0),
          child: Math.max(0, people.child | 0),
          te: Math.max(0, people.te | 0),
          dis: Math.max(0, people.dis | 0),
          ac: Math.max(0, people.ac | 0),
        },
        keys: selectedKeys.slice().sort((a, b) => (a.gender + a.number).localeCompare(b.gender + b.number)),
        totals: {
          entriesSubtotal,
          passSale,
          grandTotal,
        },
      };

      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  }

  // -------------------- RENDER --------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-2xl border bg-white shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">{mode === "create" ? "Abrir nueva cuenta" : "Editar cuenta"}</div>
          <button onClick={onCancel} className="text-sm px-2 py-1 rounded border">
            X
          </button>
        </div>

        <div className="p-4 grid gap-4">
          {/* CLIENTE */}
          <div>
            <div className="text-sm font-medium mb-1">Cliente</div>
            <input
              className="border rounded px-3 py-2 w-full"
              value={clientQ}
              onChange={(e) => setClientQ(e.target.value)}
              placeholder="Buscar o ingresar nombre…"
            />
            <div className="mt-2 grid md:grid-cols-2 gap-2">
              <div className="border rounded max-h-44 overflow-auto">
                {loadingClients ? (
                  <div className="p-3 text-sm text-gray-500">Cargando clientes…</div>
                ) : filteredClients.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No hay coincidencias. Puedes escribir el nombre.</div>
                ) : (
                  filteredClients.map((c: any) => {
                    const name = String(c.name ?? c.fullName ?? c.nombre ?? "—");
                    return (
                      <button
                        key={String(c.id)}
                        type="button"
                        onClick={() => setSelectedClientId(String(c.id))}
                        className={
                          "w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 " +
                          (String(c.id) === selectedClientId ? "bg-emerald-50" : "")
                        }
                      >
                        <div className="text-sm font-medium">{name}</div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="border rounded p-3">
                <div className="text-xs text-gray-500 mb-1">Nombre seleccionado</div>
                <input
                  className="border rounded px-3 py-2 w-full"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nombre del cliente…"
                />
                <div className="mt-2 text-xs text-gray-500">
                  Si no existe, se creará automáticamente al guardar.
                </div>
              </div>
            </div>
          </div>

          {/* TIPO DE ENTRADA */}
          <div>
            <div className="text-sm font-medium mb-2">Tipo de entrada</div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={entryType === ENTRY_NORMAL}
                  onChange={() => setEntryType(ENTRY_NORMAL)}
                />
                Normal
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={entryType === ENTRY_PASS10}
                  onChange={() => setEntryType(ENTRY_PASS10)}
                />
                Tarjeta 10 pases
              </label>
            </div>
          </div>

          {/* ENTRADAS */}
          <div className="rounded-xl border p-3">
            <div className="font-semibold text-sm mb-3">Entradas</div>

            <div className="grid sm:grid-cols-5 gap-3">
              <CounterCard
                title="Adulto (A)"
                price={PRICES.adult}
                value={people.adult}
                onDec={() => decPeople("adult")}
                onInc={() => incPeople("adult")}
              />
              <CounterCard
                title="Niño (N)"
                price={PRICES.child}
                value={people.child}
                onDec={() => decPeople("child")}
                onInc={() => incPeople("child")}
              />
              <CounterCard
                title="3ra edad (TE)"
                price={PRICES.te}
                value={people.te}
                onDec={() => decPeople("te")}
                onInc={() => incPeople("te")}
              />
              <CounterCard
                title="Discapacidad (D)"
                price={PRICES.dis}
                value={people.dis}
                onDec={() => decPeople("dis")}
                onInc={() => incPeople("dis")}
              />
              <CounterCard
                title="Acompañante (AC)"
                price={PRICES.ac}
                value={people.ac}
                onDec={() => decPeople("ac")}
                onInc={() => incPeople("ac")}
              />
            </div>

            <div className="mt-3 text-sm text-gray-700">
              Subtotal (entradas): <span className="font-semibold">{formatMoney(entriesSubtotal)}</span>
            </div>
          </div>

          {/* GÉNERO + LLAVES + PARQUEADERO */}
          <div className="rounded-xl border p-3 grid gap-3">
            <div className="grid md:grid-cols-2 gap-3 items-end">
              <div>
                <div className="text-sm font-medium mb-1">Género (para llaves)</div>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={keyGender}
                  onChange={(e) => setKeyGender(e.target.value as KeyGender)}
                >
                  <option value="H">Hombres</option>
                  <option value="M">Mujeres</option>
                </select>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Género cliente</div>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as PayGender)}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-1">
                Llaves disponibles ({keyGender === "H" ? "H" : "M"})
              </div>

              {loadingKeys ? (
                <div className="text-sm text-gray-500">Cargando llaves…</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableKeys.length === 0 && (
                    <span className="text-xs text-gray-500">No hay llaves libres</span>
                  )}

                  {availableKeys.map((n) => {
                    const active = isKeySelected(keyGender, n);
                    return (
                      <button
                        key={`${keyGender}-${n}`}
                        type="button"
                        onClick={() => toggleKey(keyGender, n)}
                        className={
                          "px-3 py-1 rounded border text-sm " +
                          (active ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-gray-50")
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-2 text-xs text-gray-500">
                En edición, las llaves ya asignadas aparecen seleccionables aunque estén ocupadas.
              </div>

              {/* Resumen llaves seleccionadas */}
              <div className="mt-2 text-sm">
                Seleccionadas:{" "}
                <span className="font-medium">
                  {selectedKeys.length === 0
                    ? "—"
                    : selectedKeys
                        .slice()
                        .sort((a, b) => (a.gender + a.number).localeCompare(b.gender + b.number))
                        .map((k) => `${k.number}${k.gender}`)
                        .join(", ")}
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={requiresParking}
                onChange={(e) => setRequiresParking(e.target.checked)}
              />
              Requiere parqueadero ({PRICES.parkingRateLabel})
            </label>
          </div>

          {/* BAR: SOLO CREATE */}
          {mode === "create" ? (
            <div className="rounded-xl border p-3 flex items-center justify-between">
              <div className="text-sm font-medium">Consumo de bar inicial</div>
              <div className="text-xs text-gray-500">Se gestiona en “Agregar cargo” luego</div>
            </div>
          ) : null}

          {/* TOTALES */}
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Subtotal (entradas)</div>
              <div className="text-xl font-semibold">{formatMoney(entriesSubtotal)}</div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500">Venta de pase</div>
              <div className="text-xl font-semibold">{formatMoney(passSale)}</div>
            </div>
            <div className="rounded-xl border p-3 bg-emerald-50">
              <div className="text-xs text-gray-500">Total</div>
              <div className="text-xl font-semibold text-emerald-700">{formatMoney(grandTotal)}</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border" disabled={saving}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-60"
            disabled={!canSubmit}
          >
            {saving ? "Guardando…" : mode === "create" ? "Crear cuenta" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI: CounterCard ---------------- */

function CounterCard({
  title,
  price,
  value,
  onDec,
  onInc,
}: {
  title: string;
  price: number;
  value: number;
  onDec: () => void;
  onInc: () => void;
}) {
  const subtotal = (value ?? 0) * (price ?? 0);

  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xs text-gray-500">Precio: {formatMoney(price)}</div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button type="button" onClick={onDec} className="w-9 h-9 rounded border">
          -
        </button>
        <div className="text-xl font-semibold w-10 text-center">{value}</div>
        <button type="button" onClick={onInc} className="w-9 h-9 rounded border">
          +
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Subtotal: <span className="font-semibold text-gray-800">{formatMoney(subtotal)}</span>
      </div>
    </div>
  );
}
