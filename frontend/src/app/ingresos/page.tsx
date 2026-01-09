"use client";

import { useEffect, useState } from "react";
import type {
  EntranceTransaction,
  EntranceTransactionRequestDto,
} from "@/types/entranceTransaction";
import {
  listEntranceTransactions,
  createEntranceTransaction,
  deleteEntranceTransaction,
} from "@/lib/apiv2/entranceTransactions";
import EntranceTransactionForm from "@/components/ingresos/EntranceTransactionForm";
import Swal from "sweetalert2";
import { toast } from "@/lib/ui/swal";

export default function IngresosPage() {
  const [entrances, setEntrances] = useState<EntranceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadEntrances() {
    setLoading(true);
    try {
      const data = await listEntranceTransactions();
      setEntrances(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEntrances();
  }, []);

  const handleCreate = async (data: EntranceTransactionRequestDto) => {
    try {
      await createEntranceTransaction(data);
      toast("success", "Ingreso registrado");
      setShowForm(false);
      await loadEntrances();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message ?? "No se pudo registrar el ingreso",
      });
    }
  };

  const handleDelete = async (entrance: EntranceTransaction) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar ingreso?",
      text: `Se eliminará el ingreso del ${
        entrance.entranceDate
          ? new Date(entrance.entranceDate).toLocaleDateString("es-EC")
          : ""
      }. Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await deleteEntranceTransaction(entrance.id);
        } catch (err: any) {
          Swal.showValidationMessage(err?.message ?? "Error eliminando ingreso");
          throw err;
        }
      },
    });

    if (res.isConfirmed) {
      await loadEntrances();
      toast("success", "Ingreso eliminado");
    }
  };

  // Filter entrances by search query (date or transaction ID)
  const filteredEntrances = entrances.filter((e) => {
    const dateStr = e.entranceDate
      ? new Date(e.entranceDate).toLocaleDateString("es-EC")
      : "";
    const txId = e.transactionId || "";
    return (
      dateStr.includes(searchQuery) ||
      txId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getTotalPeople = (entrance: EntranceTransaction): number => {
    return (
      (entrance.numberAdults || 0) +
      (entrance.numberChildren || 0) +
      (entrance.numberSeniors || 0) +
      (entrance.numberDisabled || 0)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Ingresos</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Registro de transacciones de entrada al establecimiento
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
        >
          Registrar Ingreso
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          className="w-full md:w-96 rounded-full border border-neutral-300 bg-white px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por fecha o ID de transacción..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Entrances Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr className="[&>th]:text-left [&>th]:font-medium [&>th]:p-3">
              <th>Fecha</th>
              <th>Hora Entrada</th>
              <th>Hora Salida</th>
              <th className="text-center">Adultos</th>
              <th className="text-center">Niños</th>
              <th className="text-center">3ra Edad</th>
              <th className="text-center">Discap.</th>
              <th className="text-right">Total</th>
              <th>Transacción</th>
              <th className="text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-t [&>tr]:border-neutral-200">
            {loading && (
              <tr>
                <td colSpan={10} className="p-4 text-neutral-500 text-center">
                  Cargando...
                </td>
              </tr>
            )}

            {!loading && filteredEntrances.length === 0 && (
              <tr>
                <td colSpan={10} className="p-6 text-center text-neutral-500">
                  {searchQuery
                    ? "No se encontraron ingresos"
                    : "No hay ingresos registrados. Crea el primero arriba."}
                </td>
              </tr>
            )}

            {!loading &&
              filteredEntrances.map((entrance) => {
                const totalPeople = getTotalPeople(entrance);

                return (
                  <tr
                    key={entrance.id}
                    className="hover:bg-neutral-50/60 transition-colors"
                  >
                    <td className="p-3">
                      {entrance.entranceDate
                        ? new Date(entrance.entranceDate).toLocaleDateString(
                            "es-EC",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                    <td className="p-3">
                      {entrance.entranceEntryTime || "-"}
                    </td>
                    <td className="p-3">
                      {entrance.entranceExitTime || (
                        <span className="text-orange-600 text-xs">
                          Aún dentro
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {entrance.numberAdults || 0}
                    </td>
                    <td className="p-3 text-center">
                      {entrance.numberChildren || 0}
                    </td>
                    <td className="p-3 text-center">
                      {entrance.numberSeniors || 0}
                    </td>
                    <td className="p-3 text-center">
                      {entrance.numberDisabled || 0}
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {totalPeople}
                      </span>
                    </td>
                    <td className="p-3">
                      {entrance.transactionId ? (
                        <span className="font-mono text-xs text-neutral-600">
                          {entrance.transactionId.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-neutral-400 italic text-xs">
                          Sin TX
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleDelete(entrance)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      {!loading && filteredEntrances.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h3 className="text-sm font-medium text-neutral-600 mb-3">
            Resumen de Ingresos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {filteredEntrances.reduce(
                  (sum, e) => sum + getTotalPeople(e),
                  0
                )}
              </p>
              <p className="text-xs text-neutral-600">Total Personas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-700">
                {filteredEntrances.reduce(
                  (sum, e) => sum + (e.numberAdults || 0),
                  0
                )}
              </p>
              <p className="text-xs text-neutral-600">Adultos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-700">
                {filteredEntrances.reduce(
                  (sum, e) => sum + (e.numberChildren || 0),
                  0
                )}
              </p>
              <p className="text-xs text-neutral-600">Niños</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-700">
                {filteredEntrances.reduce(
                  (sum, e) => sum + (e.numberSeniors || 0),
                  0
                )}
              </p>
              <p className="text-xs text-neutral-600">3ra Edad</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-700">
                {filteredEntrances.reduce(
                  (sum, e) => sum + (e.numberDisabled || 0),
                  0
                )}
              </p>
              <p className="text-xs text-neutral-600">Discapacitados</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <EntranceTransactionForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
