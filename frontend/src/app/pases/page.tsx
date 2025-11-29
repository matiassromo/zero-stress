"use client";

import { useEffect, useState, useMemo } from "react";
import { listAccessCards } from "@/lib/apiv2/accessCards";
import { listEntranceAccessCards } from "@/lib/apiv2/entranceAccessCards";
import type { AccessCard } from "@/types/accessCard";
import type { EntranceAccessCard } from "@/types/entranceAccessCard";

export default function PasesPage() {
  const [items, setItems] = useState<AccessCard[]>([]);
  const [hist, setHist] = useState<EntranceAccessCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(""); // 🔍 búsqueda

  async function load() {
    setLoading(true);

    const cards = await listAccessCards();
    const entries = await listEntranceAccessCards();

    setItems(cards);
    setHist(entries);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function lastUse(cardId: string) {
  const usos = hist.filter(x => x.accessCardId === cardId);
  if (usos.length === 0) return "—";

  const validUsos = usos.filter(u => u.entranceDate);
  if (validUsos.length === 0) return "—";

  const last = validUsos.reduce((a, b) =>
    new Date(a.entranceDate!) > new Date(b.entranceDate!) ? a : b
  );

  return new Date(last.entranceDate!).toLocaleDateString();
}


  // 🟦 FILTRO PROFESIONAL
  const filtered = useMemo(() => {
    if (!q.trim()) return items;

    const query = q.trim().toLowerCase();

    return items.filter((it) => {
      const idShort = it.id.slice(0, 8).toLowerCase();
      const fullId = it.id.toLowerCase();

      return (
        idShort.includes(query) ||
        fullId.includes(query) ||
        `${it.uses}/${it.total}`.includes(query)
      );
    });
  }, [q, items]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarjetas de 10 Pases</h1>
      </div>

      {/* 🔍 Cuadro de búsqueda */}
      <div className="flex gap-3">
        <input
          className="input"
          placeholder="Buscar tarjeta por ID…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn" onClick={load}>Recargar</button>
      </div>

      {loading && <div>Cargando…</div>}

      {!loading && (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                <th>ID Tarjeta</th>
                <th>Pases usados</th>
                <th>Último uso</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody className="[&>tr]:border-t">
              {filtered.map((it) => {
                const used = it.uses;
                const remaining = it.total - it.uses;

                return (
                  <tr key={it.id} className="hover:bg-neutral-50 cursor-pointer">
                    <td className="px-3 py-3">
                      <div className="font-medium">#{it.id.slice(0, 8)}</div>
                    </td>

                    <td className="px-3 py-3">
                      {used} / {it.total}
                    </td>

                    <td className="px-3 py-3">{lastUse(it.id)}</td>

                    <td className="px-3 py-3">
                      <span className="badge">
                        {remaining > 0 ? "Activa" : "Finalizada"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center opacity-60"
                  >
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
