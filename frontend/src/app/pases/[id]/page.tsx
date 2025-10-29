"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPass, usePass } from "@/lib/api/passes";
import type { PassDetailResponse } from "@/types/passes";
import UsePassDialog from "@/components/pases/UsePassDialog";

export default function PassDetail() {
  const params = useParams();
  const id = String(params?.id);
  const router = useRouter();

  const [data, setData] = useState<PassDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openUse, setOpenUse] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const res = await getPass(id);
      setData(res);
    } catch (e) {
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

  if (loading || !data) return <div className="p-6">Cargando…</div>;

  const { card, transactions } = data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{card.holderName}</h1>
          <div className="opacity-70">#{card.cardNumber}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold">
            {card.remainingUses}/{card.totalUses}
          </div>
          <div className="text-xs opacity-70">Usos restantes</div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 flex items-end gap-3">
        <button className="btn-primary" onClick={() => setOpenUse(true)}>
          Consumir usos…
        </button>
      </div>

      <div className="rounded-2xl border">
        <div className="px-4 py-3 border-b font-medium">Movimientos</div>
        <div className="divide-y">
          {transactions.map((t) => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="badge">{t.type}</span>
                <div className="opacity-80 text-sm">
                  {new Date(t.createdAt).toLocaleString()}
                </div>
              </div>
              <div
                className={
                  "font-semibold " + (t.quantity < 0 ? "text-red-600" : "text-emerald-600")
                }
              >
                {t.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {openUse && (
        <UsePassDialog
          passId={card.id}
          onClose={() => setOpenUse(false)}
          onUsed={() => {
            setOpenUse(false);
            load();
          }}
        />
      )}
    </div>
  );
}
