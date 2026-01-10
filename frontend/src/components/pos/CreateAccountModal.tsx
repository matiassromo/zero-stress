// src/components/pos/CreateAccountModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { PRICES, openAccount, addCharge } from "@/lib/api/accounts";

import { listClients, createClient, UpsertClientInput } from "@/lib/api/clients";
import { Client } from "@/types/client";
import { SelectedKey, PosEntryType, KeyGender } from "@/types/pos";

// 🔽 backend real de llaves
import { listKeys, updateKey } from "@/lib/apiv2/keys";
import { createParking } from "@/lib/apiv2/parkings";
import type { ParkingRequestDto } from "@/types/parking";
import type { Key } from "@/types/key";

// 🔽 Bar
import type { BarProduct } from "@/types/barProduct";
import { listBarProducts } from "@/lib/apiv2/barProducts";
import { createBarOrder, createBarOrderDetail } from "@/lib/apiv2/barOrders";

// ✅ Tarjetas 10 pases (módulo real)
import {
  findAccessCardByHolder,
  createAccessCardForHolder,
  consumeAccessCardByHolder,
} from "@/lib/apiv2/accessCards";

const PARKING_HOURLY_RATE = 0.5;

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesPrefixAnyWord(fullName: string, q: string) {
  const nq = norm(q);
  if (!nq) return true;

  const words = norm(fullName).split(/\s+/).filter(Boolean);
  return words.some((w) => w.startsWith(nq));
}

function formatDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function formatTimeOnly(d: Date): string {
  return d.toTimeString().slice(0, 8);
}

type Duration = "1H" | "8H" | "2M";

/* --------- HELPERS PARA LLAVES (api/Keys) --------- */
async function fetchAvailableKeysByGender(gender: KeyGender): Promise<number[]> {
  const raw: Key[] = await listKeys();
  const ordered = [...raw].sort((a, b) => a.id.localeCompare(b.id));

  const free: number[] = [];
  ordered.forEach((k, index) => {
    const g: KeyGender = index < 16 ? "H" : "M";
    if (g !== gender) return;

    const num = g === "H" ? index + 1 : index - 16 + 1;
    if (k.available) free.push(num);
  });

  return free.sort((a, b) => a - b);
}

async function reserveLockerKeys(
  selectedKeys: SelectedKey[],
  accountId: string,
  clientName: string
) {
  if (!selectedKeys.length) return;

  const raw: Key[] = await listKeys();
  const ordered = [...raw].sort((a, b) => a.id.localeCompare(b.id));

  type KeyIndex = { gender: KeyGender; number: number; key: Key };
  const indexed: KeyIndex[] = [];

  ordered.forEach((k, index) => {
    const gender: KeyGender = index < 16 ? "H" : "M";
    const number = gender === "H" ? index + 1 : index - 16 + 1;
    indexed.push({ gender, number, key: k });
  });

  const note = `Cuenta ${accountId} - ${clientName}`;

  const toUpdate = indexed.filter((ix) =>
    selectedKeys.some((s) => s.gender === ix.gender && s.number === ix.number)
  );

  if (!toUpdate.length) return;

  await Promise.all(
    toUpdate.map(({ key }) =>
      updateKey(key.id, {
        available: false,
        lastAssignedClient: clientName,
        notes: note,
      })
    )
  );
}

/* --------- Tipo auxiliar para bar en el modal ---------- */
type BarItem = {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
};

/* --------- Tipo auxiliar tarjeta 10 pases ---------- */
type AccessCardState = {
  loading: boolean;
  exists: boolean;
  cardId: string | null;
  remaining: number; // ✅ en tu sistema: remaining === card.uses
  willCreateIfMissing: boolean;
  createdNow: boolean;
  error: string | null;
};

const emptyCardState: AccessCardState = {
  loading: false,
  exists: false,
  cardId: null,
  remaining: 0,
  willCreateIfMissing: false,
  createdNow: false,
  error: null,
};

// ✅ fuente de verdad: remaining = card.uses (como en /pases)
function remainingFromFound(found: { card: any; remaining?: any } | null | undefined): number {
  const uses = Number(found?.card?.uses);
  if (Number.isFinite(uses)) return uses;

  const fallback = Number(found?.remaining);
  return Number.isFinite(fallback) ? fallback : 0;
}

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
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  /* ---------- Tipo de entrada ---------- */
  const [entryType, setEntryType] = useState<PosEntryType>("normal");

  /* ---------- Rubros (solo normal) ---------- */
  const [counts, setCounts] = useState({ A: 0, N: 0, TE: 0, D: 0, AC: 0 });

  /* ---------- Pases (Tarjeta 10) ---------- */
  const peopleCount = counts.A + counts.N + counts.TE + counts.D + counts.AC;
  const [cardState, setCardState] = useState<AccessCardState>(emptyCardState);

  /* ---------- Llaves ---------- */
  const [keyGender, setKeyGender] = useState<KeyGender>("H");
  const [availableKeys, setAvailableKeys] = useState<number[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<SelectedKey[]>([]);
  const duration: Duration = "1H";

  /* ---------- Parqueadero ---------- */
  const [requiresParking, setRequiresParking] = useState(false);

  /* ---------- Estado ---------- */
  const [creating, setCreating] = useState(false);

  /* ---------- Bar ---------- */
  const [useBarOrder, setUseBarOrder] = useState(false);
  const [barProducts, setBarProducts] = useState<BarProduct[]>([]);
  const [loadingBarProducts, setLoadingBarProducts] = useState(false);
  const [selectedBarProductId, setSelectedBarProductId] = useState("");
  const [barQty, setBarQty] = useState(1);
  const [barItems, setBarItems] = useState<BarItem[]>([]);

  /* ---------- Precargar clientes (1 vez) ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await listClients("");
        if (alive) setAllClients(data);
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- Buscar clientes (prefijo) ---------- */
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();

      if (!q) {
        setResults([]);
        return;
      }

      if (allClients.length > 0) {
        const filtered = allClients
          .filter((c) => matchesPrefixAnyWord(c.name, q))
          .slice(0, 50);

        setResults(filtered);
        return;
      }

      const r = await listClients(q);
      setResults(r);
    }, 150);

    return () => clearTimeout(t);
  }, [query, allClients]);

  /* ---------- Cargar llaves por género H/M ---------- */
  const selectedHash = useMemo(() => {
    return selectedKeys
      .filter((k) => k.gender === keyGender)
      .map((k) => k.number)
      .sort((a, b) => a - b)
      .join(",");
  }, [selectedKeys, keyGender]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const free = await fetchAvailableKeysByGender(keyGender);

      const selectedNums = new Set(
        selectedHash ? selectedHash.split(",").map((x) => parseInt(x, 10)) : []
      );

      if (!alive) return;
      setAvailableKeys(free.filter((n) => !selectedNums.has(n)));
    })();

    return () => {
      alive = false;
    };
  }, [keyGender, selectedHash]);

  /* ---------- Cargar productos de bar cuando se active ---------- */
  useEffect(() => {
    if (!useBarOrder) return;
    (async () => {
      setLoadingBarProducts(true);
      try {
        const data = await listBarProducts();
        setBarProducts(data);
        if (data.length && !selectedBarProductId) {
          setSelectedBarProductId(data[0].id);
        }
      } finally {
        setLoadingBarProducts(false);
      }
    })();
  }, [useBarOrder, selectedBarProductId]);

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

  const passSale = useMemo(() => {
    if (entryType !== "pass") return 0;
    if (cardState.createdNow) return PRICES.PASS;
    if (!cardState.exists && cardState.willCreateIfMissing) return PRICES.PASS;
    return 0;
  }, [entryType, cardState.createdNow, cardState.exists, cardState.willCreateIfMissing]);

  const keysSubtotal = 0;
  const parkingSubtotal = 0;

  const barSubtotal = useMemo(
    () => barItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    [barItems]
  );

  const total = useMemo(
    () =>
      +(
        entriesSubtotal +
        passSale +
        keysSubtotal +
        parkingSubtotal +
        barSubtotal
      ).toFixed(2),
    [entriesSubtotal, passSale, keysSubtotal, parkingSubtotal, barSubtotal]
  );

  function setCount(field: keyof typeof counts, v: number) {
    const n = Math.max(0, Math.floor(Number.isFinite(v) ? v : 0));
    setCounts((c) => ({ ...c, [field]: n }));
  }

  async function ensureClient(existing: Client | null, fallbackName: string) {
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

  function holderNameFromUI(): string {
    return (client?.name ?? query).trim();
  }

  async function lookupCard(holderName: string) {
    setCardState((s) => ({ ...s, loading: true, error: null }));
    try {
      const found = await findAccessCardByHolder(holderName);
      const remaining = remainingFromFound(found);

      setCardState((s) => ({
        ...s,
        loading: false,
        exists: !!found,
        cardId: found?.card?.id ?? null,
        remaining,
        error: null,
        willCreateIfMissing: found ? false : s.willCreateIfMissing,
        createdNow: false,
      }));
    } catch (e) {
      setCardState((s) => ({
        ...s,
        loading: false,
        error: (e as Error).message ?? "Error buscando tarjeta.",
      }));
    }
  }

  async function createCardNow(holderName: string) {
    setCardState((s) => ({ ...s, loading: true, error: null }));
    try {
      const created = await createAccessCardForHolder(holderName, 10);

      // ✅ fuente de verdad: si viene uses desde backend, úsalo; si no, usa remaining param
      const uses = Number((created as any)?.card?.uses);
      const remaining = Number.isFinite(uses)
        ? uses
        : Number.isFinite(Number(created.remaining))
        ? Number(created.remaining)
        : 10;

      setCardState({
        loading: false,
        exists: true,
        cardId: created.card.id,
        remaining,
        willCreateIfMissing: true,
        createdNow: true,
        error: null,
      });
    } catch (e) {
      setCardState((s) => ({
        ...s,
        loading: false,
        error: (e as Error).message ?? "Error creando tarjeta.",
      }));
    }
  }

  /* ---------- Crear cuenta ---------- */
  async function handleCreate() {
    try {
      setCreating(true);

      const holder = await ensureClient(client, query);
      const holderName = holder.name;

      if (entryType === "pass") {
        if (peopleCount <= 0) throw new Error("Agrega al menos 1 persona para continuar.");
      } else {
        if (peopleCount <= 0 && selectedKeys.length === 0) {
          throw new Error("Agrega al menos 1 persona o selecciona llaves para continuar.");
        }
      }

      let willChargePassSale = false;
      let remainingToValidate = 0;

      if (entryType === "pass") {
        if (cardState.exists && cardState.cardId) {
          // ✅ cardState.remaining ya representa "disponibles" (uses)
          remainingToValidate = cardState.remaining;
          if (cardState.createdNow) willChargePassSale = true;
        } else {
          const found = await findAccessCardByHolder(holderName);

          if (found) {
            const remaining = remainingFromFound(found);
            remainingToValidate = remaining;

            setCardState((s) => ({
              ...s,
              exists: true,
              cardId: found.card.id,
              remaining,
              createdNow: false,
              error: null,
            }));
          } else {
            if (!cardState.willCreateIfMissing) {
              throw new Error("No existe tarjeta. Marca 'Crear y cobrar si no existe' para continuar.");
            }

            const created = await createAccessCardForHolder(holderName, 10);

            willChargePassSale = true;

            const uses = Number((created as any)?.card?.uses);
            remainingToValidate = Number.isFinite(uses)
              ? uses
              : Number.isFinite(Number(created.remaining))
              ? Number(created.remaining)
              : 10;

            setCardState((s) => ({
              ...s,
              exists: true,
              cardId: created.card.id,
              remaining: remainingToValidate,
              willCreateIfMissing: true,
              createdNow: true,
              error: null,
            }));
          }
        }

        if (remainingToValidate < peopleCount) {
          throw new Error(`Tarjeta sin usos suficientes. Restantes: ${remainingToValidate}`);
        }
      }

      const keysToAttach: SelectedKey[] = selectedKeys.map((k) => ({
        ...k,
        duration,
      }));

      const account = await openAccount({
        clientId: holder.id,
        clientName: holder.name,
        gender: "M",

        // FORZAR normal para que el backend no busque “pase”
        entryType: "normal",

        counts: entryType === "normal" ? counts : undefined,
        peopleCount,
        keys: keysToAttach.length > 0 ? { items: keysToAttach, duration } : undefined,

        createPassIfMissing: false,
      });

      if (entryType === "pass" && willChargePassSale) {
        await addCharge(account.id, {
          kind: "Normal",
          concept: "Tarjeta 10 pases (venta)",
          qty: 1,
          amount: PRICES.PASS,
        });
      }

      if (entryType === "pass") {
        await consumeAccessCardByHolder(holderName, peopleCount);

        // opcional: refrescar UI local después de consumir
        setCardState((s) => ({
          ...s,
          remaining: Math.max(0, (s.remaining ?? 0) - peopleCount),
        }));
      }

      if (selectedKeys.length) {
        await reserveLockerKeys(selectedKeys, account.id, holder.name);
      }

      if (requiresParking) {
        const now = new Date();
        const parkingInput: ParkingRequestDto = {
          parkingDate: formatDateOnly(now),
          parkingEntryTime: formatTimeOnly(now),
          parkingExitTime: null,
        };
        await createParking(parkingInput);
      }

      if (useBarOrder && barItems.length > 0) {
        const order = await createBarOrder({});

        await Promise.all(
          barItems.map((item) =>
            createBarOrderDetail(order.id, {
              barProductId: item.productId,
              unitPrice: item.unitPrice,
              qty: item.qty,
            })
          )
        );

        await Promise.all(
          barItems.map((item) =>
            addCharge(account.id, {
              kind: "Normal",
              concept: `Bar: ${item.name}`,
              qty: item.qty,
              amount: item.unitPrice,
            })
          )
        );
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
    (entryType === "pass"
      ? peopleCount > 0
      : peopleCount > 0 || selectedKeys.length > 0);

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
                onChange={() => {
                  setEntryType("normal");
                  setCardState(emptyCardState);
                }}
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
                    const v = Math.max(0, parseInt(e.target.value || "0", 10));
                    setCounts({ A: v, N: 0, TE: 0, D: 0, AC: 0 });
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se descontarán {peopleCount} usos de la tarjeta.
                </p>
              </div>

              <div className="sm:col-span-2">
                <div className="text-sm font-medium">Validar tarjeta 10 pases</div>

                <div className="mt-1 flex flex-wrap gap-2 items-center">
                  <button
                    className="px-3 py-2 rounded bg-gray-100 disabled:opacity-60"
                    disabled={!holderNameFromUI() || cardState.loading}
                    onClick={() => lookupCard(holderNameFromUI())}
                    type="button"
                  >
                    {cardState.loading ? "Buscando…" : "Buscar por nombre"}
                  </button>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={cardState.willCreateIfMissing}
                      onChange={(e) =>
                        setCardState((s) => ({
                          ...s,
                          willCreateIfMissing: e.target.checked,
                        }))
                      }
                    />
                    <span>Crear y cobrar si no existe</span>
                  </label>

                  {!cardState.exists && cardState.willCreateIfMissing && (
                    <button
                      className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-60"
                      disabled={!holderNameFromUI() || cardState.loading}
                      onClick={() => createCardNow(holderNameFromUI())}
                      type="button"
                    >
                      Crear ahora
                    </button>
                  )}
                </div>

                <div className="mt-2 text-sm">
                  {cardState.error && <p className="text-red-600">{cardState.error}</p>}

                  {cardState.exists ? (
                    <p>
                      ✔ Tarjeta encontrada. Restantes: <b>{cardState.remaining}</b>
                    </p>
                  ) : (
                    <p>
                      ✖ No existe tarjeta.
                      {cardState.willCreateIfMissing ? (
                        <>
                          {" "}Se creará y se cobrará <b>${PRICES.PASS}</b>.
                        </>
                      ) : (
                        <>
                          {" "}Marca “Crear y cobrar” para continuar.
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Llaves + Parqueadero */}
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

            <div className="sm:col-span-2">
              <div className="text-sm font-medium">Llaves disponibles ({keyGender})</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {availableKeys.map((n) => {
                  const active = selectedKeys.some(
                    (k) => k.number === n && k.gender === keyGender
                  );

                  return (
                    <button
                      key={`${keyGender}-${n}`}
                      type="button"
                      onClick={() =>
                        setSelectedKeys((prev) =>
                          active
                            ? prev.filter(
                                (k) => !(k.number === n && k.gender === keyGender)
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
                        active ? "bg-blue-600 text-white border-blue-600" : "bg-white"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}

                {availableKeys.length === 0 && (
                  <span className="text-sm text-gray-500">No hay llaves libres</span>
                )}
              </div>
            </div>
          </div>

          {selectedKeys.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium">Llaves seleccionadas</div>
              <div className="mt-1 flex flex-wrap gap-2">
                {selectedKeys
                  .slice()
                  .sort(
                    (a, b) => a.gender.localeCompare(b.gender) || a.number - b.number
                  )
                  .map((k) => (
                    <span
                      key={k.keyId}
                      className="px-2 py-1 rounded-full bg-gray-100 border"
                    >
                      {k.number}
                      {k.gender}
                      <button
                        type="button"
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

          <div className="mt-4 flex items-center gap-2">
            <input
              id="requiresParking"
              type="checkbox"
              className="h-4 w-4"
              checked={requiresParking}
              onChange={(e) => setRequiresParking(e.target.checked)}
            />
            <label htmlFor="requiresParking" className="text-sm">
              Requiere parqueadero (0.50 la hora o fracción)
            </label>
          </div>
        </div>

        {/* Consumo de bar inicial */}
        <div className="mt-4 rounded-xl border p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Consumo de bar inicial</div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useBarOrder}
                onChange={(e) => setUseBarOrder(e.target.checked)}
              />
              <span>Agregar productos de bar</span>
            </label>
          </div>

          {useBarOrder && (
            <div className="mt-3 space-y-3">
              {loadingBarProducts ? (
                <p className="text-sm text-gray-500">Cargando productos de bar...</p>
              ) : barProducts.length === 0 ? (
                <p className="text-sm text-gray-500">No hay productos de bar configurados.</p>
              ) : (
                <form
                  className="grid sm:grid-cols-3 gap-3 items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const p = barProducts.find((x) => x.id === selectedBarProductId);
                    if (!p || barQty <= 0) return;
                    setBarItems((prev) => [
                      ...prev,
                      {
                        productId: p.id,
                        name: p.name,
                        unitPrice: p.unitPrice,
                        qty: barQty,
                      },
                    ]);
                    setBarQty(1);
                  }}
                >
                  <div className="sm:col-span-2">
                    <div className="text-sm font-medium">Producto</div>
                    <select
                      className="border rounded px-3 py-2 w-full mt-1 text-sm"
                      value={selectedBarProductId}
                      onChange={(e) => setSelectedBarProductId(e.target.value)}
                    >
                      <option value="">Selecciona un producto</option>
                      {barProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.unitPrice.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Cantidad</div>
                    <input
                      type="number"
                      min={1}
                      className="border rounded px-3 py-2 w-full mt-1 text-sm"
                      value={barQty}
                      onChange={(e) =>
                        setBarQty(Math.max(1, parseInt(e.target.value || "1", 10)))
                      }
                    />
                  </div>
                  <div className="sm:col-span-3 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm disabled:opacity-60"
                      disabled={!selectedBarProductId}
                    >
                      Agregar a pedido
                    </button>
                  </div>
                </form>
              )}

              {barItems.length > 0 && (
                <div className="border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2">Producto</th>
                        <th className="text-right px-3 py-2">Cant.</th>
                        <th className="text-right px-3 py-2">P. Unit.</th>
                        <th className="text-right px-3 py-2">Subtotal</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {barItems.map((i, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{i.name}</td>
                          <td className="px-3 py-2 text-right">{i.qty}</td>
                          <td className="px-3 py-2 text-right">
                            ${i.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {(i.unitPrice * i.qty).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              className="text-xs text-red-600"
                              onClick={() =>
                                setBarItems((prev) =>
                                  prev.filter((_, iIdx) => iIdx !== idx)
                                )
                              }
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-3 py-2 font-semibold text-right" colSpan={3}>
                          Total bar
                        </td>
                        <td className="px-3 py-2 font-semibold text-right">
                          ${barSubtotal.toFixed(2)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
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
