"use client";
import { useState } from "react";
import { createPass } from "@/lib/api/passes";

export default function CreatePassModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [holderName, setHolder] = useState("");
  const [cardNumber, setCard] = useState("");
  const [validFrom, setFrom] = useState("");
  const [validTo, setTo] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    try {
      setSaving(true);
      await createPass({
        holderName,
        cardNumber: cardNumber.toUpperCase(),
        validFrom: validFrom || undefined,
        validTo: validTo || undefined,
        notes: notes || undefined,
      });
      onCreated();
    } catch (e: any) {
      alert(e?.message ?? "Error creando tarjeta");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white white:bg-zinc-900 rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Nueva tarjeta (10 usos)</h2>

        <div className="grid gap-3">
          <label className="grid gap-1">
            <span>Titular</span>
            <input
              className="input"
              value={holderName}
              onChange={(e) => setHolder(e.target.value)}
              placeholder="Nombre y apellido"
            />
          </label>

          <label className="grid gap-1">
            <span>Número de tarjeta</span>
            <input
              className="input uppercase"
              value={cardNumber}
              onChange={(e) => setCard(e.target.value)}
              placeholder="Ej. ZS-000123"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span>Válida desde</span>
              <input
                type="date"
                className="input"
                value={validFrom}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <span>Válida hasta</span>
              <input
                type="date"
                className="input"
                value={validTo}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span>Notas</span>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            disabled={saving || !holderName || !cardNumber}
            onClick={save}
          >
            {saving ? "Guardando…" : "Crear tarjeta"}
          </button>
        </div>
      </div>
    </div>
  );
}
