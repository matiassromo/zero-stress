// src/app/facturacion/pos/page.tsx
"use client";

import { useEffect, useState } from "react";
import CreateAccountModal from "@/components/pos/CreateAccountModal";
import {
  listAccountsToday,
  getAccount,
  PosAccount,
  AccountSummary,
} from "@/lib/api/accounts";
import AccountDetail from "@/components/pos/AccountDetail";

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

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      if (!selectedId) return setPreview(null);
      const detail = await getAccount(selectedId);
      setPreview(detail);
    })();
  }, [selectedId]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Punto de Venta (POS)</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-full"
          onClick={() => setOpenCreate(true)}
        >
          + Abrir cuenta
        </button>
      </header>

      {/* Lista de cuentas */}
      {loading ? (
        <p>Cargando...</p>
      ) : accounts.length === 0 ? (
        <p>No hay cuentas abiertas hoy.</p>
      ) : (
        <div className="grid gap-2 max-w-3xl">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => setSelectedId(acc.id)}
              className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${
                selectedId === acc.id ? "bg-blue-100" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium">Cuenta #{acc.id}</span>
                <span className="text-gray-500 text-sm">• {acc.clientName}</span>
              </div>
              <span className="text-sm">{acc.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* Detalle */}
      {selectedId && <AccountDetail accountId={selectedId} onChanged={load} />}

      {openCreate && (
        <CreateAccountModal onClose={() => setOpenCreate(false)} onCreated={load} />
      )}
    </div>
  );
}
