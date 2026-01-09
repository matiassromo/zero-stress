"use client";

import { useEffect, useState } from "react";
import type { Transaction, TransactionRequestDto } from "@/types/transaction";
import {
  listTransactions,
  createTransaction,
  deleteTransaction,
} from "@/lib/apiv2/transactions";
import TransactionForm from "@/components/transacciones/TransactionForm";
import Swal from "sweetalert2";
import { toast } from "@/lib/ui/swal";
import { cn } from "@/lib/utils";

type PaymentStatus = "Pagado" | "Pendiente" | "Parcial";

interface ComputedStatus {
  status: PaymentStatus;
  totalItems: number;
  totalPaid: number;
  balance: number;
}

export default function TransaccionesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadTransactions() {
    setLoading(true);
    try {
      const data = await listTransactions();
      setTransactions(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleCreate = async (data: TransactionRequestDto) => {
    try {
      await createTransaction(data);
      toast("success", "Transacción creada");
      setShowForm(false);
      await loadTransactions();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message ?? "No se pudo crear la transacción",
      });
    }
  };

  const handleDelete = async (transaction: Transaction) => {
    const computed = computePaidStatus(transaction);

    // Check if transaction has items or payments
    const hasItems = computed.totalItems > 0;
    const hasPayments = computed.totalPaid > 0;

    if (hasItems || hasPayments) {
      await Swal.fire({
        icon: "warning",
        title: "No se puede eliminar",
        text: "Esta transacción tiene items o pagos asociados. Elimina primero los items y pagos.",
      });
      return;
    }

    const res = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar transacción?",
      text: `Se eliminará la transacción del cliente ${transaction.client?.name}. Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await deleteTransaction(transaction.id);
        } catch (err: any) {
          Swal.showValidationMessage(err?.message ?? "Error eliminando transacción");
          throw err;
        }
      },
    });

    if (res.isConfirmed) {
      await loadTransactions();
      toast("success", "Transacción eliminada");
    }
  };

  function computePaidStatus(transaction: Transaction): ComputedStatus {
    // Calculate total from transaction items
    const totalItems =
      (transaction.transactionItem || []).reduce(
        (sum: number, item: any) => sum + (item.total || 0),
        0
      ) || 0;

    // Calculate total paid from payments
    const totalPaid =
      (transaction.payment || []).reduce(
        (sum: number, payment: any) => sum + (payment.total || 0),
        0
      ) || 0;

    const balance = totalItems - totalPaid;

    let status: PaymentStatus;
    if (balance <= 0 && totalItems > 0) {
      status = "Pagado";
    } else if (totalPaid === 0 || totalItems === 0) {
      status = "Pendiente";
    } else {
      status = "Parcial";
    }

    return { status, totalItems, totalPaid, balance };
  }

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;

    const computed = computePaidStatus(t);
    return computed.status === statusFilter;
  });

  const getStatusBadgeClass = (status: PaymentStatus): string => {
    switch (status) {
      case "Pagado":
        return "bg-emerald-100 text-emerald-700";
      case "Pendiente":
        return "bg-orange-100 text-orange-700";
      case "Parcial":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-neutral-100 text-neutral-700";
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Transacciones</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Gestión de transacciones y seguimiento de pagos
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          Nueva Transacción
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <input
          className="flex-1 rounded-full border border-neutral-300 bg-white px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por cliente o ID de transacción..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select
          className="rounded-full border border-neutral-300 bg-white px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="all">Todos los estados</option>
          <option value="Pagado">Pagado</option>
          <option value="Parcial">Parcial</option>
          <option value="Pendiente">Pendiente</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr className="[&>th]:text-left [&>th]:font-medium [&>th]:p-3">
              <th>Fecha</th>
              <th>Cliente</th>
              <th className="text-right">Total Items</th>
              <th className="text-right">Total Pagado</th>
              <th>Estado</th>
              <th className="text-right">Balance</th>
              <th className="text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-t [&>tr]:border-neutral-200">
            {loading && (
              <tr>
                <td colSpan={7} className="p-4 text-neutral-500 text-center">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-neutral-500">
                  {searchQuery || statusFilter !== "all"
                    ? "No se encontraron transacciones"
                    : "No hay transacciones registradas. Crea la primera arriba."}
                </td>
              </tr>
            )}

            {!loading &&
              filteredTransactions.map((transaction) => {
                const computed = computePaidStatus(transaction);
                const isExpanded = expandedId === transaction.id;

                return (
                  <>
                    <tr
                      key={transaction.id}
                      className="hover:bg-neutral-50/60 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(transaction.id)}
                    >
                      <td className="p-3">
                        {new Date(transaction.createdAt).toLocaleDateString(
                          "es-EC",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">
                            {transaction.client?.name || "Sin cliente"}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {transaction.id.substring(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        ${computed.totalItems.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-medium text-emerald-600">
                        ${computed.totalPaid.toFixed(2)}
                      </td>
                      <td className="p-3">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            getStatusBadgeClass(computed.status)
                          )}
                        >
                          {computed.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        ${Math.abs(computed.balance).toFixed(2)}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => toggleExpand(transaction.id)}
                            className="text-blue-600 hover:underline"
                          >
                            {isExpanded ? "Ocultar" : "Ver Detalles"}
                          </button>
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="text-red-600 hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-neutral-50 p-6">
                          <div className="space-y-6">
                            {/* Transaction Items */}
                            <div>
                              <h3 className="font-semibold text-sm mb-3">
                                Items de Transacción
                              </h3>
                              {(!transaction.transactionItem ||
                                transaction.transactionItem.length === 0) && (
                                <p className="text-sm text-neutral-500 italic">
                                  No hay items asociados a esta transacción
                                </p>
                              )}
                              {transaction.transactionItem &&
                                transaction.transactionItem.length > 0 && (
                                  <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead className="bg-neutral-100">
                                        <tr>
                                          <th className="text-left p-2">Tipo</th>
                                          <th className="text-left p-2">
                                            Descripción
                                          </th>
                                          <th className="text-right p-2">
                                            Monto
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {transaction.transactionItem.map(
                                          (item: any, idx: number) => (
                                            <tr key={idx} className="border-t">
                                              <td className="p-2">
                                                {item.type || "Item"}
                                              </td>
                                              <td className="p-2">
                                                {item.description ||
                                                  item.id?.substring(0, 8) ||
                                                  "-"}
                                              </td>
                                              <td className="p-2 text-right">
                                                ${(item.total || 0).toFixed(2)}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                            </div>

                            {/* Payments */}
                            <div>
                              <h3 className="font-semibold text-sm mb-3">
                                Pagos Realizados
                              </h3>
                              {(!transaction.payment ||
                                transaction.payment.length === 0) && (
                                <p className="text-sm text-neutral-500 italic">
                                  No hay pagos registrados para esta transacción
                                </p>
                              )}
                              {transaction.payment &&
                                transaction.payment.length > 0 && (
                                  <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead className="bg-neutral-100">
                                        <tr>
                                          <th className="text-left p-2">Fecha</th>
                                          <th className="text-left p-2">Tipo</th>
                                          <th className="text-right p-2">
                                            Monto
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {transaction.payment.map(
                                          (payment: any, idx: number) => (
                                            <tr key={idx} className="border-t">
                                              <td className="p-2">
                                                {payment.createdAt
                                                  ? new Date(
                                                      payment.createdAt
                                                    ).toLocaleDateString("es-EC")
                                                  : "-"}
                                              </td>
                                              <td className="p-2">
                                                {payment.type === 0
                                                  ? "Efectivo"
                                                  : "Transferencia"}
                                              </td>
                                              <td className="p-2 text-right text-emerald-600 font-medium">
                                                ${(payment.total || 0).toFixed(2)}
                                              </td>
                                            </tr>
                                          )
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                            </div>

                            {/* Summary */}
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-neutral-600 text-xs">
                                    Total Items
                                  </p>
                                  <p className="font-bold text-lg">
                                    ${computed.totalItems.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-600 text-xs">
                                    Total Pagado
                                  </p>
                                  <p className="font-bold text-lg text-emerald-600">
                                    ${computed.totalPaid.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-neutral-600 text-xs">
                                    Balance
                                  </p>
                                  <p
                                    className={cn(
                                      "font-bold text-lg",
                                      computed.balance > 0
                                        ? "text-red-600"
                                        : "text-emerald-600"
                                    )}
                                  >
                                    ${Math.abs(computed.balance).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Transaction Form Modal */}
      <TransactionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
