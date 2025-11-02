"use client";

import { useEffect, useState } from "react";
import { getPass, usePass } from "@/lib/api/passes";
import type { PassDetailResponse } from "@/types/passes";
import PassProgress from "./PassProgress";

export default function PassDrawer({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<PassDetailResponse | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await getPass(id);
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function consume() {
    const r = await usePass(id, qty);
    if (!("ok" in r) || !r.ok) {
      const msg = "text" in r ? await (r as Response).text() : "Error";
      alert(`No se pudo consumir: ${msg}`);
      return;
    }
    await load();
    onChanged();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-5 overflow-y-auto">
        {loading || !data ? (
          <div>Cargando…</div>
        ) : (
          <>
            <header className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{data.card.holderName}</h2>
                <div className="text-sm opacity-70">#{data.card.cardNumber}</div>
              </div>
              <button className="btn" onClick={onClose}>Cerrar</button>
            </header>

            <div className="grid gap-3 mb-5">
              <div className="card">
                <div className="flex items-center justify-between">
                  <PassProgress
                    used={data.card.totalUses - data.card.remainingUses}
                    total={data.card.totalUses}
                  />
                  <span className="text-xs px-2 py-0.5 rounded-full border">
                    {data.card.status === "Active" ? "Activa" :
                     data.card.status === "Expired" ? "Finalizada" : "Suspendida"}
                  </span>
                </div>
                <div className="mt-2 text-sm opacity-70">
                  Último uso: {data.card.lastUsedAt ? new Date(data.card.lastUsedAt).toLocaleString() : "—"}
                </div>
              </div>

              <div className="card flex items-end gap-3">
                <div className="grow">
                  <label className="text-sm">Consumir usos</label>
                  <input
                    type="number" min={1} max={10}
                    className="input"
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value || "1"))}
                  />
                </div>
                <button className="btn-primary" onClick={consume}>Descontar</button>
              </div>

              <div className="card">
                <div className="font-medium mb-2">Movimientos</div>
                <div className="divide-y">
                  {data.transactions.map((t) => (
                    <div key={t.id} className="py-2 flex items-center justify-between">
                      <div className="text-sm opacity-80">
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                      <div className={`font-semibold ${t.quantity < 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {t.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
