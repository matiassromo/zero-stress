// src/app/pases/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPass, addManualPass, renewPass, deletePass } from "@/lib/api/passes";
import type { PassDetailResponse } from "@/types/passes";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-sm opacity-70">{children}</span>;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
      <Label>{k}</Label>
      <div className="font-medium">{v}</div>
    </div>
  );
}

export default function PassDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<PassDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [label, setLabel] = useState("Entrada Pase");

  async function load() {
    try {
      setLoading(true);
      const res = await getPass(id);
      setData(res);
    } catch {
      alert("No se pudo cargar la tarjeta");
      router.push("/pases");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const usedInfo = useMemo(() => {
    if (!data) return { used: 0, total: 10 };
    return {
      used: data.card.totalUses - data.card.remainingUses,
      total: data.card.totalUses,
    };
  }, [data]);

  async function onAddManual() {
    const r = await addManualPass(id, qty, label);
    if (!r.ok) {
      const msg = await r.text();
      alert(`No se pudo añadir: ${msg || "Error"}`);
      return;
    }
    await load();
  }

  async function onRenew() {
    const r = await renewPass(id);
    if (!r.ok) {
      const msg = await r.text();
      alert(`No se pudo renovar: ${msg || "Error"}`);
      return;
    }
    await load();
  }

  async function onDelete() {
    if (!confirm("¿Eliminar definitivamente esta tarjeta?")) return;
    const r = await deletePass(id);
    if (!r.ok) {
      const msg = await r.text();
      alert(`No se pudo eliminar: ${msg || "Error"}`);
      return;
    }
    router.push("/pases");
  }

  if (loading || !data) return <div className="p-6">Cargando…</div>;

  const { card, transactions } = data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarjeta de Pases #{card.cardNumber}</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={onRenew}>🔄 Renovar tarjeta</button>
          <button className="btn" onClick={onDelete}>🗑️ Eliminar</button>
        </div>
      </div>

      {/* Info principal */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <Row k="👤 Cliente" v={card.holderName} />
          <Row k="🪪 Cédula" v={card.documentId ?? "—"} />
          <Row k="📧 Email" v={card.email ?? "—"} />
          <Row
            k="📅 Fecha de compra"
            v={card.purchaseDate ? new Date(card.purchaseDate).toLocaleDateString() : "—"}
          />
          <Row
            k="💰 Valor pagado"
            v={card.amountPaid != null ? `$${card.amountPaid.toFixed(2)}` : "—"}
          />
          <Row k="🔢 Pases usados" v={`${usedInfo.used}/${usedInfo.total}`} />
          <Row
            k="⏱️ Último uso"
            v={card.lastUsedAt ? new Date(card.lastUsedAt).toLocaleDateString() : "—"}
          />
        </div>

        <div className="card">
          <div className="font-medium mb-3">➕ Añadir pase manualmente</div>
          <div className="grid sm:grid-cols-3 gap-3 items-end">
            <label className="grid gap-1">
              <span className="text-sm">Personas</span>
              <input
                type="number"
                min={1}
                max={10}
                className="input"
                value={qty}
                onChange={(e) => {
                  const n = parseInt(e.target.value || "1", 10);
                  setQty(Number.isNaN(n) ? 1 : Math.max(1, Math.min(10, n)));
                }}
              />
            </label>
            <label className="grid gap-1 sm:col-span-2">
              <span className="text-sm">Etiqueta</span>
              <input
                className="input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej. Entrada Pase / Entrada Normal"
              />
            </label>
            <div className="sm:col-span-3 flex justify-end">
              <button className="btn-primary" onClick={onAddManual}>Añadir</button>
            </div>
          </div>
          <div className="mt-4 text-sm opacity-70">
            Disponibles: {card.remainingUses} / {card.totalUses}
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <div className="font-medium mb-3">📊 Historial de usos</div>
        <div className="divide-y">
          {transactions
            .filter((t) => t.type !== "Create")
            .map((t, i) => (
              <div key={t.id} className="py-2 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                <div className="opacity-70 text-sm">
                  {`${i + 1}️⃣`} {new Date(t.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm">{t.label ?? (t.type === "Use" ? "Entrada" : t.type)}</div>
                <div className="text-sm sm:text-right">
                  {t.persons != null ? `${t.persons} ${t.persons === 1 ? "persona" : "personas"}` : t.quantity}
                </div>
              </div>
            ))}
          {transactions.filter((t) => t.type !== "Create").length === 0 && (
            <div className="py-4 text-center opacity-60">Sin movimientos</div>
          )}
        </div>
      </div>
    </div>
  );
}
