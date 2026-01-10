// src/components/pos/AccountDetail.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAccount,
  listCharges,
  listPayments,
  addPayment,
  markChargePaid,
  closeAccount,
  printAccountReceipt,
  addCharge,
  updateAccount,
  AccountSummary,
  Charge,
  Payment,
} from "@/lib/api/accounts";

// ✅ NUEVO: modal unificado create/edit
import AccountFormModal from "@/components/pos/AccountFormModal";

// ✅ llaves backend real
import { listKeys, updateKey } from "@/lib/apiv2/keys";
import type { Key } from "@/types/key";

// ✅ bar
import { listBarProducts } from "@/lib/apiv2/barProducts";
import type { BarProduct } from "@/types/barProduct";

type PayMethod = "Efectivo" | "Transferencia";
type KeyGender = "H" | "M";

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function formatKeyLabel(g: KeyGender, n: number) {
  return `${n}${g}`;
}

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

export default function AccountDetail({
  accountId,
  onChanged,
}: {
  accountId: string;
  onChanged?: () => void;
}) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [payChargeId, setPayChargeId] = useState<string | null>(null);

  // ✅ modales/acciones
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [s, ch, pm] = await Promise.all([
      getAccount(accountId),
      listCharges(accountId),
      listPayments(accountId),
    ]);
    setSummary(s);
    setCharges(ch);
    setPayments(pm);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const saldoColor = useMemo(() => {
    if (!summary) return "";
    return summary.saldo > 0 ? "text-red-600" : "text-emerald-600";
  }, [summary]);

  function findChargePaidMethod(chargeId: string): PayMethod | null {
    const tag = `charge:${chargeId}`;
    const p = [...payments]
      .filter((x) => (x.note ?? "").includes(tag))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];

    if (!p) return null;

    const m = String((p as any).method ?? "");
    if (m === "Efectivo") return "Efectivo";
    if (m === "Transferencia") return "Transferencia";
    return null;
  }

  async function handlePayCharge(form: { chargeId: string; method: PayMethod }) {
    const c = charges.find((x) => x.id === form.chargeId);
    if (!c) return;

    await addPayment(accountId, {
      method: form.method,
      amount: c.total,
      note: `charge:${form.chargeId}`,
    });

    await markChargePaid(accountId, form.chargeId);

    await loadAll();
    setPayChargeId(null);
    onChanged?.();
  }

  async function handleCloseAndPrint() {
    await closeAccount(accountId);
    printAccountReceipt(accountId);
    await loadAll();
    onChanged?.();
  }

  // ✅ agregar cargo libre (bar/extras)
  async function handleAddExtraCharge(input: { concept: string; qty: number; amount: number }) {
    if (!summary) return;
    if (summary.status !== "Abierta") throw new Error("Solo puedes modificar cuentas abiertas.");

    const concept = input.concept.trim();
    if (!concept) throw new Error("Concepto requerido.");
    if (input.qty <= 0) throw new Error("Cantidad inválida.");
    if (!Number.isFinite(input.amount)) throw new Error("Monto inválido.");

    await addCharge(accountId, {
      kind: "Normal",
      concept,
      qty: input.qty,
      amount: input.amount,
    });

    await loadAll();
    onChanged?.();
  }

  // ✅ llaves: reservar + registrar evento como cargo (monto 0)
  async function handleAddKey(input: { gender: KeyGender; number: number; clientName: string }) {
    if (!summary) return;
    if (summary.status !== "Abierta") throw new Error("Solo puedes modificar cuentas abiertas.");

    const key = await findKeyEntityByGenderNumber(input.gender, input.number);
    if (!key) throw new Error("No se encontró esa llave.");
    if (!key.available) throw new Error("Esa llave ya está ocupada.");

    const note = `Cuenta ${accountId} - ${input.clientName}`;

    await updateKey(key.id, {
      available: false,
      lastAssignedClient: input.clientName,
      notes: note,
    });

    await addCharge(accountId, {
      kind: "Key",
      concept: `Llave ${formatKeyLabel(input.gender, input.number)} (asignación)`,
      qty: 1,
      amount: 0,
    });

    await loadAll();
    onChanged?.();
  }

  // ✅ llaves: liberar + registrar evento como cargo (monto 0)
  async function handleRemoveKey(input: { gender: KeyGender; number: number; clientName: string }) {
    if (!summary) return;
    if (summary.status !== "Abierta") throw new Error("Solo puedes modificar cuentas abiertas.");

    const key = await findKeyEntityByGenderNumber(input.gender, input.number);
    if (!key) throw new Error("No se encontró esa llave.");
    if (key.available) throw new Error("Esa llave ya está libre.");

    await updateKey(key.id, {
      available: true,
      lastAssignedClient: input.clientName,
      notes: `Liberada desde cuenta ${accountId}`,
    });

    await addCharge(accountId, {
      kind: "Key",
      concept: `Llave ${formatKeyLabel(input.gender, input.number)} (devolución)`,
      qty: 1,
      amount: 0,
    });

    await loadAll();
    onChanged?.();
  }

  if (loading) return <div className="mt-4">Cargando detalle…</div>;
  if (!summary) return null;

  const selectedCharge = payChargeId ? charges.find((c) => c.id === payChargeId) ?? null : null;

  // ✅ Para no pelear con tipos si AccountSummary aún no trae estos campos
  const sAny: any = summary;

  return (
    <div className="mt-6 grid gap-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Total cargos</div>
          <div className="text-2xl font-semibold">${summary.totalCargos.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Total pagos</div>
          <div className="text-2xl font-semibold">${summary.totalPagos.toFixed(2)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500">Saldo</div>
          <div className={`text-2xl font-semibold ${saldoColor}`}>${summary.saldo.toFixed(2)}</div>
        </div>
      </div>

      {/* Info cuenta + acciones */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500 mb-1">
              Cuenta #{summary.id} · {summary.clientName}
            </div>
            <div className="text-sm">
              <span className="font-medium">Estado:</span> {summary.status}
            </div>
            <div className="text-sm">
              <span className="font-medium">Entrada:</span>{" "}
              {new Date(summary.openedAt).toLocaleString("es-EC")}
            </div>
            {summary.closedAt && (
              <div className="text-sm">
                <span className="font-medium">Salida:</span>{" "}
                {new Date(summary.closedAt).toLocaleString("es-EC")}
              </div>
            )}
          </div>

          {summary.status === "Abierta" && (
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setEditFormOpen(true)}
                className="rounded-full border px-4 py-2 text-sm"
              >
                Editar cuenta
              </button>
              <button
                onClick={() => setKeysOpen(true)}
                className="rounded-full border px-4 py-2 text-sm"
              >
                Llaves
              </button>
              <button
                onClick={() => setAddChargeOpen(true)}
                className="rounded-full bg-indigo-600 text-white px-4 py-2 text-sm"
              >
                Agregar cargo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Acción única cierre */}
      <div className="flex flex-wrap gap-2">
        {summary.status === "Abierta" && (
          <button
            onClick={handleCloseAndPrint}
            className="rounded-full bg-red-600 text-white px-4 py-2"
          >
            Cerrar cuenta + imprimir
          </button>
        )}
      </div>

      {/* Cargos */}
      <div className="rounded-xl border bg-white">
        <div className="p-4 border-b font-semibold">Cargos</div>
        <div className="p-2 overflow-x-auto">
          <table className="min-w-[760px] w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Concepto</th>
                <th className="py-2 px-3">Cant.</th>
                <th className="py-2 px-3">Monto</th>
                <th className="py-2 px-3">Total</th>
                <th className="py-2 px-3">Estado</th>
                <th className="py-2 px-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => {
                const paidMethod = c.status === "Pagado" ? findChargePaidMethod(c.id) : null;

                return (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 px-3 text-sm">{new Date(c.createdAt).toLocaleString()}</td>
                    <td className="py-2 px-3">{c.kind}</td>
                    <td className="py-2 px-3">
                      {c.kind === "Key" ? c.concept.replace(/\s*\(\s*1H\s*\)\s*$/i, "") : c.concept}
                    </td>
                    <td className="py-2 px-3">{c.qty}</td>
                    <td className="py-2 px-3">${c.amount.toFixed(2)}</td>
                    <td className="py-2 px-3 font-medium">${c.total.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      {c.status === "Pagado" ? (
                        <span className="px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-700">
                          {paidMethod ? `Pagado (${paidMethod})` : "Pagado"}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {summary.status === "Abierta" && c.status === "Pendiente" ? (
                        <button
                          onClick={() => setPayChargeId(c.id)}
                          className="text-sm rounded bg-emerald-600 text-white px-3 py-1"
                        >
                          Registrar pago
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {charges.length === 0 && (
                <tr>
                  <td className="py-4 px-3 text-gray-500" colSpan={8}>
                    Sin cargos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagos */}
      <div className="rounded-xl border bg-white">
        <div className="p-4 border-b font-semibold">Pagos</div>
        <div className="p-2 overflow-x-auto">
          <table className="min-w-[560px] w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Método</th>
                <th className="py-2 px-3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2 px-3 text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-3">{(p as any).method}</td>
                  <td className="py-2 px-3 font-medium">${p.amount.toFixed(2)}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td className="py-4 px-3 text-gray-500" colSpan={3}>
                    Sin pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal pago */}
      {selectedCharge && (
        <PayChargeModal
          charge={selectedCharge}
          onCancel={() => setPayChargeId(null)}
          onConfirm={(method) => handlePayCharge({ chargeId: selectedCharge.id, method })}
        />
      )}

      {/* ✅ Modal editar cuenta: mismo formulario que crear */}
      {editFormOpen && (
        <AccountFormModal
          mode="edit"
          initial={{
            clientId: sAny.clientId ?? null,
            clientName: summary.clientName ?? "",
            entryType: sAny.entryType, // ajusta cuando tu summary ya lo tenga tipado
            gender: sAny.gender ?? "M",
            requiresParking: sAny.requiresParking ?? false,
            people: sAny.people ?? { adult: 0, child: 0, te: 0, dis: 0, ac: 0 },
            keys: (sAny.keys ?? []).map((k: any) => ({ gender: k.gender, number: k.number })),
          }}
          onCancel={() => setEditFormOpen(false)}
          onSubmit={async (payload) => {
            await updateAccount(accountId, {
              clientId: payload.clientId,
              clientName: payload.clientName,
              entryType: payload.entryType,
              gender: payload.gender,
              requiresParking: payload.requiresParking,
              people: payload.people,
              keys: payload.keys,
            } as any);

            setEditFormOpen(false);
            await loadAll();
            onChanged?.();
          }}
        />
      )}

      {/* Modal agregar cargo */}
      {addChargeOpen && (
        <AddChargeModal
          onCancel={() => setAddChargeOpen(false)}
          onAdd={async (payload) => {
            await handleAddExtraCharge(payload);
            setAddChargeOpen(false);
          }}
        />
      )}

      {/* Modal llaves (acción rápida aparte) */}
      {keysOpen && (
        <KeysModal
          currentClientName={summary.clientName}
          onCancel={() => setKeysOpen(false)}
          onAddKey={handleAddKey}
          onRemoveKey={handleRemoveKey}
        />
      )}
    </div>
  );
}

/* ---------------- Modal pago ---------------- */

function PayChargeModal({
  charge,
  onCancel,
  onConfirm,
}: {
  charge: Charge;
  onCancel: () => void;
  onConfirm: (method: PayMethod) => void;
}) {
  const [method, setMethod] = useState<PayMethod>("Efectivo");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Registrar pago</div>
          <button onClick={onCancel} className="text-sm px-2 py-1 rounded border">
            X
          </button>
        </div>

        <div className="p-4">
          <div className="text-sm text-gray-600">
            <div className="mb-1">
              <span className="font-medium">Concepto:</span> {charge.concept}
            </div>
            <div>
              <span className="font-medium">Total:</span> ${charge.total.toFixed(2)}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("Efectivo")}
              className={
                "px-4 py-3 rounded-xl border text-sm font-medium " +
                (method === "Efectivo"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white")
              }
            >
              Efectivo
            </button>

            <button
              onClick={() => setMethod("Transferencia")}
              className={
                "px-4 py-3 rounded-xl border text-sm font-medium " +
                (method === "Transferencia"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white")
              }
            >
              Transferencia
            </button>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(method)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white"
          >
            Confirmar pago
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Modal agregar cargo (bar/extras) ---------------- */

function AddChargeModal({
  onCancel,
  onAdd,
}: {
  onCancel: () => void;
  onAdd: (payload: { concept: string; qty: number; amount: number }) => Promise<void> | void;
}) {
  const [tab, setTab] = useState<"bar" | "manual">("bar");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<BarProduct[]>([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [qty, setQty] = useState(1);

  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listBarProducts();
        if (!alive) return;
        setProducts(data);
        if (data.length) setSelectedId(data[0].id);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const nq = norm(q);
    if (!nq) return products;
    return products.filter((p) => norm(p.name).includes(nq));
  }, [products, q]);

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-white shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Agregar cargo</div>
          <button onClick={onCancel} className="text-sm px-2 py-1 rounded border">
            X
          </button>
        </div>

        <div className="p-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab("bar")}
              className={
                "px-3 py-2 rounded-full border text-sm " +
                (tab === "bar" ? "bg-slate-900 text-white border-slate-900" : "")
              }
            >
              Bar
            </button>
            <button
              onClick={() => setTab("manual")}
              className={
                "px-3 py-2 rounded-full border text-sm " +
                (tab === "manual" ? "bg-slate-900 text-white border-slate-900" : "")
              }
            >
              Manual
            </button>
          </div>

          {tab === "bar" ? (
            <div className="grid gap-3">
              {loading ? (
                <div className="text-sm text-gray-500">Cargando productos…</div>
              ) : products.length === 0 ? (
                <div className="text-sm text-gray-500">No hay productos de bar.</div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-3 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <div className="text-sm font-medium">Buscar</div>
                      <input
                        className="border rounded px-3 py-2 w-full mt-1"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="salchi, agua, cerveza…"
                      />
                    </div>

                    <div>
                      <div className="text-sm font-medium">Cantidad</div>
                      <input
                        type="number"
                        min={1}
                        className="border rounded px-3 py-2 w-full mt-1"
                        value={qty}
                        onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
                      />
                    </div>
                  </div>

                  <div className="border rounded max-h-56 overflow-auto">
                    {filtered.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={
                          "w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 " +
                          (p.id === selectedId ? "bg-emerald-50" : "")
                        }
                        type="button"
                      >
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">${p.unitPrice.toFixed(2)}</div>
                      </button>
                    ))}
                  </div>

                  <div className="text-sm text-gray-600">
                    Seleccionado: <span className="font-medium">{selected?.name ?? "—"}</span> ·
                    Unit: <span className="font-medium">${(selected?.unitPrice ?? 0).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <div className="text-sm font-medium">Concepto</div>
                <input
                  className="border rounded px-3 py-2 w-full mt-1"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="Salchipapa, Nevado, etc."
                />
              </div>
              <div>
                <div className="text-sm font-medium">Monto unitario</div>
                <input
                  type="number"
                  step="0.01"
                  className="border rounded px-3 py-2 w-full mt-1"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value || "0"))}
                />
              </div>

              <div>
                <div className="text-sm font-medium">Cantidad</div>
                <input
                  type="number"
                  min={1}
                  className="border rounded px-3 py-2 w-full mt-1"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (tab === "bar") {
                if (!selected) return;
                onAdd({
                  concept: `Bar: ${selected.name}`,
                  qty,
                  amount: selected.unitPrice,
                });
                return;
              }
              onAdd({ concept, qty, amount });
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white"
            disabled={tab === "bar" ? !selected : !concept.trim() || !Number.isFinite(amount)}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Modal llaves ---------------- */

function KeysModal({
  currentClientName,
  onCancel,
  onAddKey,
  onRemoveKey,
}: {
  currentClientName: string;
  onCancel: () => void;
  onAddKey: (payload: { gender: KeyGender; number: number; clientName: string }) => Promise<void>;
  onRemoveKey: (payload: { gender: KeyGender; number: number; clientName: string }) => Promise<void>;
}) {
  const [gender, setGender] = useState<KeyGender>("H");
  const [free, setFree] = useState<number[]>([]);
  const [busy, setBusy] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const raw: Key[] = await listKeys();
      const ordered = [...raw].sort((a, b) => a.id.localeCompare(b.id));

      const freeNums: number[] = [];
      const busyNums: number[] = [];

      ordered.forEach((k, idx) => {
        const g: KeyGender = idx < 16 ? "H" : "M";
        if (g !== gender) return;
        const n = g === "H" ? idx + 1 : idx - 16 + 1;
        if (k.available) freeNums.push(n);
        else busyNums.push(n);
      });

      setFree(freeNums.sort((a, b) => a - b));
      setBusy(busyNums.sort((a, b) => a - b));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border bg-white shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="font-semibold">Gestión de llaves</div>
          <button onClick={onCancel} className="text-sm px-2 py-1 rounded border">
            X
          </button>
        </div>

        <div className="p-4 grid gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setGender("H")}
              className={
                "px-3 py-2 rounded-full border text-sm " +
                (gender === "H" ? "bg-slate-900 text-white border-slate-900" : "")
              }
            >
              Hombres
            </button>
            <button
              onClick={() => setGender("M")}
              className={
                "px-3 py-2 rounded-full border text-sm " +
                (gender === "M" ? "bg-slate-900 text-white border-slate-900" : "")
              }
            >
              Mujeres
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Cargando llaves…</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-3">
                <div className="font-semibold text-sm mb-2">Disponibles</div>
                <div className="flex flex-wrap gap-2">
                  {free.length === 0 && (
                    <span className="text-xs text-gray-500">No hay llaves libres</span>
                  )}
                  {free.map((n) => (
                    <button
                      key={`free-${gender}-${n}`}
                      className="px-3 py-1 rounded-full border text-sm hover:bg-emerald-50"
                      onClick={async () => {
                        await onAddKey({ gender, number: n, clientName: currentClientName });
                        await reload();
                      }}
                      type="button"
                    >
                      Asignar {formatKeyLabel(gender, n)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-3">
                <div className="font-semibold text-sm mb-2">Ocupadas</div>
                <div className="flex flex-wrap gap-2">
                  {busy.length === 0 && (
                    <span className="text-xs text-gray-500">No hay llaves ocupadas</span>
                  )}
                  {busy.map((n) => (
                    <button
                      key={`busy-${gender}-${n}`}
                      className="px-3 py-1 rounded-full border text-sm hover:bg-amber-50"
                      onClick={async () => {
                        await onRemoveKey({ gender, number: n, clientName: currentClientName });
                        await reload();
                      }}
                      type="button"
                    >
                      Liberar {formatKeyLabel(gender, n)}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Este modal libera/asigna llaves en inventario y registra el evento como cargo (monto 0).
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
