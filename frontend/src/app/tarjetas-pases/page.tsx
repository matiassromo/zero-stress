"use client";

import { useEffect, useState } from "react";
import type { AccessCard, AccessCardRequestDto } from "@/types/accessCard";
import type {
  EntranceAccessCard,
  EntranceAccessCardRequestDto,
} from "@/types/entranceAccessCard";
import {
  listAccessCards,
  createAccessCard,
  deleteAccessCard,
} from "@/lib/apiv2/accessCards";
import {
  listEntranceAccessCards,
  createEntranceAccessCard,
  deleteEntranceAccessCard,
} from "@/lib/apiv2/entranceAccessCards";
import AccessCardForm from "@/components/tarjetas-pases/AccessCardForm";
import EntranceAccessCardForm from "@/components/tarjetas-pases/EntranceAccessCardForm";
import Swal from "sweetalert2";
import { toast } from "@/lib/ui/swal";

export default function TarjetasPasesPage() {
  const [accessCards, setAccessCards] = useState<AccessCard[]>([]);
  const [entrances, setEntrances] = useState<EntranceAccessCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCardForm, setShowCardForm] = useState(false);
  const [showEntranceForm, setShowEntranceForm] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [cards, entranceData] = await Promise.all([
        listAccessCards(),
        listEntranceAccessCards(),
      ]);
      setAccessCards(cards);
      setEntrances(entranceData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCard = async (data: AccessCardRequestDto) => {
    try {
      await createAccessCard(data);
      toast("success", "Tarjeta creada");
      setShowCardForm(false);
      await loadData();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message ?? "No se pudo crear la tarjeta",
      });
    }
  };

  const handleCreateEntrance = async (data: EntranceAccessCardRequestDto) => {
    try {
      await createEntranceAccessCard(data);
      toast("success", "Ingreso registrado");
      setShowEntranceForm(false);
      await loadData();
    } catch (error: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.message ?? "No se pudo registrar el ingreso",
      });
    }
  };

  const handleDeleteCard = async (card: AccessCard) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar tarjeta?",
      text: `Se eliminará la tarjeta ${
        card.holderName || card.id.substring(0, 8)
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
          await deleteAccessCard(card.id);
        } catch (err: any) {
          Swal.showValidationMessage(err?.message ?? "Error eliminando tarjeta");
          throw err;
        }
      },
    });

    if (res.isConfirmed) {
      await loadData();
      toast("success", "Tarjeta eliminada");
    }
  };

  const handleDeleteEntrance = async (entrance: EntranceAccessCard) => {
    const res = await Swal.fire({
      icon: "warning",
      title: "¿Eliminar ingreso?",
      text: "Esta acción no se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        try {
          await deleteEntranceAccessCard(entrance.id);
        } catch (err: any) {
          Swal.showValidationMessage(err?.message ?? "Error eliminando ingreso");
          throw err;
        }
      },
    });

    if (res.isConfirmed) {
      await loadData();
      toast("success", "Ingreso eliminado");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Tarjetas y Pases</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Gestión de tarjetas de 10 pases y registro de ingresos
        </p>
      </div>

      {/* Section 1: Access Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Tarjetas de Acceso</h2>
          <button
            onClick={() => setShowCardForm(true)}
            className="rounded-full px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            Crear Tarjeta
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr className="[&>th]:text-left [&>th]:font-medium [&>th]:p-3">
                <th>Titular</th>
                <th className="text-right">Pases Usados</th>
                <th className="text-right">Pases Total</th>
                <th className="text-right">Disponibles</th>
                <th>Transacción</th>
                <th className="text-right pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t [&>tr]:border-neutral-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-4 text-neutral-500 text-center">
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && accessCards.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-neutral-500">
                    No hay tarjetas registradas. Crea la primera arriba.
                  </td>
                </tr>
              )}

              {!loading &&
                accessCards.map((card) => {
                  const remaining = card.total - card.uses;
                  const isActive = remaining > 0;

                  return (
                    <tr
                      key={card.id}
                      className="hover:bg-neutral-50/60 transition-colors"
                    >
                      <td className="p-3">
                        {card.holderName || (
                          <span className="text-neutral-400 italic">
                            Sin titular
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">{card.uses}</td>
                      <td className="p-3 text-right">{card.total}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          {remaining}
                        </span>
                      </td>
                      <td className="p-3">
                        {card.transactionId ? (
                          <span className="font-mono text-xs text-neutral-600">
                            {card.transactionId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-neutral-400 italic text-xs">
                            Sin transacción
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-4">
                          <button
                            onClick={() => handleDeleteCard(card)}
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
      </section>

      {/* Section 2: Entrance Access Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Historial de Ingresos</h2>
          <button
            onClick={() => setShowEntranceForm(true)}
            className="rounded-full px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          >
            Registrar Ingreso
          </button>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr className="[&>th]:text-left [&>th]:font-medium [&>th]:p-3">
                <th>Tarjeta</th>
                <th>Fecha</th>
                <th>Hora Entrada</th>
                <th>Hora Salida</th>
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

              {!loading && entrances.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500">
                    No hay ingresos registrados.
                  </td>
                </tr>
              )}

              {!loading &&
                entrances.map((entrance) => (
                  <tr
                    key={entrance.id}
                    className="hover:bg-neutral-50/60 transition-colors"
                  >
                    <td className="p-3 font-mono text-xs">
                      {entrance.accessCardId?.substring(0, 8)}...
                    </td>
                    <td className="p-3">
                      {entrance.entranceDate
                        ? new Date(entrance.entranceDate).toLocaleDateString(
                            "es-EC"
                          )
                        : "-"}
                    </td>
                    <td className="p-3">{entrance.entranceEntryTime || "-"}</td>
                    <td className="p-3">
                      {entrance.entranceExitTime || (
                        <span className="text-orange-600 text-xs">
                          Aún dentro
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-4">
                        <button
                          onClick={() => handleDeleteEntrance(entrance)}
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
      </section>

      {/* Modals */}
      <AccessCardForm
        open={showCardForm}
        onClose={() => setShowCardForm(false)}
        onSubmit={handleCreateCard}
      />

      <EntranceAccessCardForm
        open={showEntranceForm}
        onClose={() => setShowEntranceForm(false)}
        onSubmit={handleCreateEntrance}
        accessCards={accessCards}
      />
    </div>
  );
}
