// src/components/pos/AccountDetail.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAccount,
  listCharges,
  listPayments,
  addCharge,
  addPayment,
  markChargePaid,
  AccountSummary,
  Charge,
  Payment,
} from "@/lib/api/accounts";

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

  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);

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
  }, [accountId]);

  const saldoColor = useMemo(() => {
    if (!summary) return "";
    return summary.saldo > 0 ? "text-red-600" : "text-emerald-600";
  }, [summary]);

  async function handleAddCharge(form: {
    kind: "Normal" | "Pase";
    concept: string;
    qty: number;
    amount: number;
  }) {
    await addCharge(accountId, form);
    await loadAll();
    setShowAddCharge(false);
    onChanged?.();
  }

  async function handleAddPayment(form: {
    method: "Efectivo" | "Transferencia" | "Tarjeta";
    amount: number;
    note?: string;
  }) {
    await addPayment(accountId, form);
    await loadAll();
    setShowAddPayment(false);
    onChanged?.();
  }

  async function handleMarkPaid(id: string) {
    await markChargePaid(accountId, id);
    await loadAll();
    onChanged?.();
  }

  if (loading) return <div className="mt-4">Cargando detalle…</div>;
  if (!summary) return null;

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

      {/* Acciones rápidas */}
      <div className="flex gap-2">
        <button onClick={() => setShowAddCharge(true)} className="rounded-full bg-blue-600 text-white px-4 py-2">
          + Agregar Debe
        </button>
        <button onClick={() => setShowAddPayment(true)} className="rounded-full bg-emerald-600 text-white px-4 py-2">
          + Registrar pago
        </button>
      </div>

      {/* Cargos */}
      <div className="rounded-xl border bg-white">
        <div className="p-4 border-b font-semibold">Cargos</div>
        <div className="p-2 overflow-x-auto">
          <table className="min-w-[700px] w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Concepto</th>
                <th className="py-2 px-3">Cant.</th>
                <th className="py-2 px-3">Monto</th>
                <th className="py-2 px-3">Total</th>
                <th className="py-2 px-3">Estado</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {charges.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2 px-3 text-sm">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-3">{c.kind}</td>
                  <td className="py-2 px-3">{c.concept}</td>
                  <td className="py-2 px-3">{c.qty}</td>
                  <td className="py-2 px-3">${c.amount.toFixed(2)}</td>
                  <td className="py-2 px-3 font-medium">${c.total.toFixed(2)}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        c.status === "Pagado"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {c.status === "Pendiente" && (
                      <button
                        onClick={() => handleMarkPaid(c.id)}
                        className="text-sm rounded bg-emerald-600 text-white px-3 py-1"
                      >
                        Marcar pagado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
          <table className="min-w-[600px] w-full">
            <thead>
              <tr className="text-left text-sm text-gray-600">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Método</th>
                <th className="py-2 px-3">Monto</th>
                <th className="py-2 px-3">Nota</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="py-2 px-3 text-sm">{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-3">{p.method}</td>
                  <td className="py-2 px-3 font-medium">${p.amount.toFixed(2)}</td>
                  <td className="py-2 px-3">{p.note ?? "-"}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td className="py-4 px-3 text-gray-500" colSpan={4}>
                    Sin pagos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formularios inline */}
      {showAddCharge && (
        <AddChargeCard onCancel={() => setShowAddCharge(false)} onSave={handleAddCharge} />
      )}
      {showAddPayment && (
        <AddPaymentCard
          saldo={summary.saldo}
          onCancel={() => setShowAddPayment(false)}
          onSave={handleAddPayment}
        />
      )}
    </div>
  );
}

/* ---------- Subcomponentes ---------- */
function AddChargeCard({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (f: { kind: "Normal" | "Pase"; concept: string; qty: number; amount: number }) => void;
}) {
  const [kind, setKind] = useState<"Normal" | "Pase">("Normal");
  const [concept, setConcept] = useState("");
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState(0);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold mb-3">Agregar Debe</div>
      <div className="grid sm:grid-cols-4 gap-3">
        <select className="border rounded px-3 py-2" value={kind} onChange={(e) => setKind(e.target.value as any)}>
          <option value="Normal">Normal</option>
          <option value="Pase">Pase</option>
        </select>
        <input
          className="border rounded px-3 py-2 sm:col-span-2"
          placeholder="Concepto (ej: Entrada 1A Rodrigo)"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(parseInt(e.target.value || "1", 10))}
        />
        <input
          className="border rounded px-3 py-2"
          type="number"
          step="0.01"
          placeholder="Monto unit."
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value || "0"))}
        />
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-2 rounded bg-gray-200">
          Cancelar
        </button>
        <button
          onClick={() =>
            onSave({
              kind,
              concept: concept.trim(),
              qty: Math.max(1, qty),
              amount: Math.max(0, amount),
            })
          }
          className="px-3 py-2 rounded bg-blue-600 text-white"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

function AddPaymentCard({
  saldo,
  onCancel,
  onSave,
}: {
  saldo: number;
  onCancel: () => void;
  onSave: (f: { method: "Efectivo" | "Transferencia" | "Tarjeta"; amount: number; note?: string }) => void;
}) {
  const [method, setMethod] = useState<"Efectivo" | "Transferencia" | "Tarjeta">("Efectivo");
  const [amount, setAmount] = useState(saldo > 0 ? saldo : 0);
  const [note, setNote] = useState("");

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="font-semibold mb-3">Registrar pago</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <select className="border rounded px-3 py-2" value={method} onChange={(e) => setMethod(e.target.value as any)}>
          <option value="Efectivo">Efectivo</option>
          <option value="Transferencia">Transferencia</option>
          <option value="Tarjeta">Tarjeta</option>
        </select>
        <input
          className="border rounded px-3 py-2"
          type="number"
          step="0.01"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value || "0"))}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button onClick={onCancel} className="px-3 py-2 rounded bg-gray-200">
          Cancelar
        </button>
        <button
          onClick={() =>
            onSave({
              method,
              amount: Math.max(0, amount),
              note: note.trim() || undefined,
            })
          }
          className="px-3 py-2 rounded bg-emerald-600 text-white"
        >
          Guardar pago
        </button>
      </div>
    </div>
  );
}
