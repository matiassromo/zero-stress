// src/app/facturacion/pos/page.tsx
"use client";

import { useEffect, useState } from "react";
import CreateAccountModal from "@/components/pos/CreateAccountModal";
import AccountDetail from "@/components/pos/AccountDetail";

import {
  listAccountsToday,
  getAccount,
  type PosAccount,
  type AccountSummary,
} from "@/lib/api/accounts";

export default function PosPage() {
  const [openCreate, setOpenCreate] = useState(false);
  const [accounts, setAccounts] = useState<PosAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const data = await listAccountsToday();
    setAccounts(data);
    setLoading(false);

    if (selectedId && !data.find((a) => a.id === selectedId)) {
      setSelectedId(null);
      setPreview(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    (async () => {
      if (!selectedId) return setPreview(null);
      const detail = await getAccount(selectedId);
      setPreview(detail);
    })();
  }, [selectedId]);

  const openAccounts = accounts.filter((a) => a.status === "Abierta");
  const closedAccounts = accounts.filter((a) => a.status === "Cerrada");

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Punto de Venta (POS)</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-full"
          onClick={() => setOpenCreate(true)}
        >
          + Nueva entrada
        </button>
      </header>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] items-start">
          {/* Columna izquierda: listas de cuentas */}
          <div className="space-y-4 max-w-3xl">
            {/* Abiertas */}
            <section className="rounded-2xl border bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-sm font-semibold">
                  Cuentas abiertas ({openAccounts.length})
                </h2>
              </div>
              {openAccounts.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  No hay cuentas abiertas en este momento.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto grid gap-2 p-3">
                  {openAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedId(acc.id)}
                      className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${
                        selectedId === acc.id ? "bg-blue-50 border-blue-400" : "bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">
                            Cuenta #{acc.id}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {acc.clientName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Tipo:{" "}
                          {acc.entryType === "normal"
                            ? "Normal"
                            : "Tarjeta 10 pases"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Apertura:{" "}
                          {new Date(acc.openedAt).toLocaleTimeString("es-EC", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        Abierta
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Cerradas */}
            <section className="rounded-2xl border bg-white">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-sm font-semibold">
                  Cuentas cerradas ({closedAccounts.length})
                </h2>
              </div>
              {closedAccounts.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-500">
                  Aún no hay cuentas cerradas hoy.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto grid gap-2 p-3">
                  {closedAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedId(acc.id)}
                      className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${
                        selectedId === acc.id ? "bg-slate-50 border-slate-400" : "bg-white"
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">
                            Cuenta #{acc.id}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {acc.clientName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Tipo:{" "}
                          {acc.entryType === "normal"
                            ? "Normal"
                            : "Tarjeta 10 pases"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Cerrada:{" "}
                          {acc.closedAt
                            ? new Date(acc.closedAt).toLocaleTimeString("es-EC", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        Cerrada
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Columna derecha: detalle */}
          <div>
            {selectedId && (
              <AccountDetail accountId={selectedId} onChanged={load} />
            )}
            {!selectedId && (
              <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500">
                Selecciona una cuenta de la lista para ver el detalle.
              </div>
            )}
          </div>
        </div>
      )}

      {openCreate && (
        <CreateAccountModal
          onClose={() => setOpenCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
