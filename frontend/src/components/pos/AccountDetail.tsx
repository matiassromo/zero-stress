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
  AccountSummary,
  Charge,
  Payment,
} from "@/lib/api/accounts";

type PayMethod = "Efectivo" | "Transferencia";

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

    // payment: monto = total del cargo (no editable)
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

  if (loading) return <div className="mt-4">Cargando detalle…</div>;
  if (!summary) return null;

  const selectedCharge = payChargeId ? charges.find((c) => c.id === payChargeId) ?? null : null;

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

      {/* Info cuenta */}
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-500 mb-1">
          Cuenta #{summary.id} · {summary.clientName}
        </div>
        <div className="text-sm">
          <span className="font-medium">Estado:</span> {summary.status}
        </div>
        <div className="text-sm">
          <span className="font-medium">Entrada:</span> {new Date(summary.openedAt).toLocaleString("es-EC")}
        </div>
        {summary.closedAt && (
          <div className="text-sm">
            <span className="font-medium">Salida:</span> {new Date(summary.closedAt).toLocaleString("es-EC")}
          </div>
        )}
      </div>

      {/* Acción única */}
      <div className="flex flex-wrap gap-2">
        {summary.status === "Abierta" && (
          <button onClick={handleCloseAndPrint} className="rounded-full bg-red-600 text-white px-4 py-2">
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
                        <span className="px-2 py-1 rounded text-xs bg-amber-100 text-amber-700">Pendiente</span>
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

      {/* Modal */}
      {selectedCharge && (
        <PayChargeModal
          charge={selectedCharge}
          onCancel={() => setPayChargeId(null)}
          onConfirm={(method) => handlePayCharge({ chargeId: selectedCharge.id, method })}
        />
      )}
    </div>
  );
}

/* ---------- Modal pago (solo efectivo/transferencia) ---------- */

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
                (method === "Efectivo" ? "bg-slate-900 text-white border-slate-900" : "bg-white")
              }
            >
              Efectivo
            </button>

            <button
              onClick={() => setMethod("Transferencia")}
              className={
                "px-4 py-3 rounded-xl border text-sm font-medium " +
                (method === "Transferencia" ? "bg-slate-900 text-white border-slate-900" : "bg-white")
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
