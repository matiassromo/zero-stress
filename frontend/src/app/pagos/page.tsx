"use client";

import { useEffect, useState } from "react";
import type { Payment, PaymentRequestDto } from "@/types/payment";
import { PaymentType } from "@/types/payment";
import {
  listPayments,
  createPayment,
  deletePayment,
} from "@/lib/apiv2/payments";
import PaymentForm from "@/components/pagos/PaymentForm";
import Swal from "sweetalert2";
import { toast } from "@/lib/ui/swal";

export default function PagosPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadPayments() {
    setLoading(true);
    try {
      const data = await listPayments();
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const handleCreatePayment = async (data: PaymentRequestDto) => {
    try {
      await createPayment(data);
      toast("success", "Pago registrado");
      setShowForm(false);
      await loadPayments();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message ?? "No se pudo registrar el pago",
      });
    }
  };

  const handleDelete = async (payment: Payment) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar pago?",
      text: `Se eliminará el pago de $${payment.total.toFixed(
        2
      )}. Esta acción no se puede deshacer.`,
      html: `Se eliminará el pago de <strong>$${payment.total.toFixed(
        2
      )}</strong>.<br/><br/><small class="text-neutral-600">Nota: Esto no eliminará la transacción asociada.</small>`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await deletePayment(payment.id);
        } catch (err: any) {
          Swal.showValidationMessage(err?.message ?? "Error eliminando pago");
          throw err;
        }
      },
    });

    if (res.isConfirmed) {
      await loadPayments();
      toast("success", "Pago eliminado");
    }
  };

  // Filter payments by search query (transaction ID or amount)
  const filteredPayments = payments.filter(
    (p) =>
      p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.total.toString().includes(searchQuery)
  );

  const getPaymentTypeLabel = (type: PaymentType): string => {
    return type === PaymentType.Efectivo ? "Efectivo" : "Transferencia";
  };

  const getPaymentTypeIcon = (type: PaymentType): string => {
    return type === PaymentType.Efectivo ? "💵" : "🏦";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Pagos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          Registrar Pago
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          className="w-full md:w-96 rounded-full border border-neutral-300 bg-white px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por ID de transacción o monto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr className="[&>th]:text-left [&>th]:font-medium [&>th]:p-3">
              <th>Fecha</th>
              <th>Tipo</th>
              <th className="text-right">Total</th>
              <th>Transacción</th>
              <th className="text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-t [&>tr]:border-neutral-200">
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-neutral-500 text-center">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && filteredPayments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500">
                  {searchQuery
                    ? "No se encontraron pagos"
                    : "No hay pagos registrados. Crea el primero arriba."}
                </td>
              </tr>
            )}

            {!loading &&
              filteredPayments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-neutral-50/60 transition-colors"
                >
                  <td className="p-3">
                    {new Date(payment.createdAt).toLocaleDateString("es-EC", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs">
                      <span>{getPaymentTypeIcon(payment.type)}</span>
                      <span>{getPaymentTypeLabel(payment.type)}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-emerald-600">
                    ${payment.total.toFixed(2)}
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-xs text-neutral-600">
                      {payment.transactionId.substring(0, 8)}...
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-4">
                      <button
                        onClick={() => handleDelete(payment)}
                        className="text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Payment Form Modal */}
      <PaymentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreatePayment}
      />
    </div>
  );
}
