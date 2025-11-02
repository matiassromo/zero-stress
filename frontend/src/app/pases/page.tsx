"use client";

import { useEffect, useState } from "react";
import { listPasses } from "@/lib/api/passes";
import type { PassCard } from "@/types/passes";
import CreatePassModal from "@/components/pases/CreatePassModal";
import PassProgress from "@/components/pases/PassProgress";
import PassDrawer from "@/components/pases/PassDrawer";

export default function PasesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PassCard[]>([]);
  const [total, setTotal] = useState(0);
  const [openNew, setOpenNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    const res = await listPasses(q);
    setItems(res.items);
    setTotal(res.total);
  }
  useEffect(() => { load(); }, []);

  function estadoES(s: PassCard["status"]) {
    return s === "Active" ? "Activa" : s === "Expired" ? "Finalizada" : "Suspendida";
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarjetas de 10 Pases</h1>
        <button className="btn-primary" onClick={() => setOpenNew(true)}>+ Nueva</button>
      </div>

      <div className="flex gap-3">
        <input
          className="input"
          placeholder="Buscar cliente o número de tarjeta…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" onClick={load}>Buscar</button>
      </div>

      <div className="text-sm opacity-70">{total} resultados</div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
              <th>Cliente</th>
              <th>Pases usados</th>
              <th>Último uso</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody className="[&>tr]:border-t">
            {items.map((it) => {
              const used = it.totalUses - it.remainingUses;
              return (
                <tr key={it.id} className="hover:bg-neutral-50 cursor-pointer" onClick={() => setOpenId(it.id)}>
                  <td className="px-3 py-3">
                    <div className="font-medium">{it.holderName}</div>
                    <div className="opacity-60 text-xs">#{it.cardNumber}</div>
                  </td>
                  <td className="px-3 py-3">
                    <PassProgress used={used} total={it.totalUses} />
                  </td>
                  <td className="px-3 py-3">
                    {it.lastUsedAt ? new Date(it.lastUsedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span className="badge">{estadoES(it.status)}</span>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center opacity-60">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {openNew && (
        <CreatePassModal
          onClose={() => setOpenNew(false)}
          onCreated={() => { setOpenNew(false); load(); }}
        />
      )}

      {openId && (
        <PassDrawer
          id={openId}
          onClose={() => setOpenId(null)}
          onChanged={() => load()}
        />
      )}
    </div>
  );
}
