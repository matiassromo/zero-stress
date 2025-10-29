"use client";
import { useState } from "react";
import { usePass } from "@/lib/api/passes";

export default function UsePassDialog({
  passId,
  onClose,
  onUsed,
}: {
  passId: string;
  onClose: () => void;
  onUsed: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [comment, setComment] = useState("");

  async function submit() {
    const r = await usePass(passId, qty, undefined, comment);
    if (!("ok" in r) || !r.ok) {
      const txt = "text" in r ? await (r as Response).text() : "Error";
      alert(`No se pudo consumir: ${txt}`);
      return;
    }
    onUsed();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white white:bg-zinc-900 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Consumir usos</h2>
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span>Cantidad</span>
            <input
              type="number"
              min={1}
              max={10}
              className="input"
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "1"))}
            />
          </label>
          <label className="grid gap-1">
            <span>Comentario (opcional)</span>
            <input
              className="input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej. Consumo desde POS"
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={submit}>
            Descontar
          </button>
        </div>
      </div>
    </div>
  );
}
