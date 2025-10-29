"use client";

import { useEffect, useState } from "react";
import { listPasses } from "@/lib/api/passes";
import CreatePassModal from "@/components/pases/CreatePassModal";
import type { PassCard } from "@/types/passes";

export default function PasesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PassCard[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);

  async function load() {
    const res = await listPasses(q);
    setItems(res.items);
    setTotal(res.total);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarjetas 10 Pases</h1>
        <button className="btn-primary" onClick={() => setOpen(true)}>
          + Nueva
        </button>
      </div>

      <div className="flex gap-3">
        <input
          className="input"
          placeholder="Buscar por nombre o número…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" onClick={load}>
          Buscar
        </button>
      </div>

      <div className="text-sm opacity-70">{total} resultados</div>

      <div className="grid gap-2">
        {items.map((it) => (
          <a
            key={it.id}
            href={`/pases/${it.id}`}
            className="rounded-xl border p-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
          >
            <div className="flex items-center gap-3">
              <span className="badge">{it.status}</span>
              <div>
                <div className="font-medium">{it.holderName}</div>
                <div className="text-xs opacity-70">#{it.cardNumber}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">
                {it.remainingUses}/{it.totalUses}
              </div>
              <div className="text-xs opacity-70">Usos restantes</div>
            </div>
          </a>
        ))}
      </div>

      {open && (
        <CreatePassModal
          onClose={() => setOpen(false)}
          onCreated={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
