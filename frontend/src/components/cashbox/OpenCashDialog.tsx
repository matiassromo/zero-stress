"use client";

import React from "react";

export function OpenCashDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { openingAmount: number; openedBy: string }) => void;
}) {
  const [openingAmount, setOpeningAmount] = React.useState<string>("0");
  const [openedBy, setOpenedBy] = React.useState<string>("operador");

  React.useEffect(() => {
    if (open) {
      setOpeningAmount("0");
      setOpenedBy("operador");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border">
        <div className="p-5 border-b">
          <div className="text-lg font-semibold">Abrir caja</div>
          <div className="text-sm text-slate-500">Registra el saldo inicial.</div>
        </div>

        <div className="p-5 space-y-4">
          <label className="block">
            <div className="text-sm font-medium mb-1">Saldo inicial</div>
            <input
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
              inputMode="decimal"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
              placeholder="0.00"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Usuario</div>
            <input
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-slate-200"
              value={openedBy}
              onChange={(e) => setOpenedBy(e.target.value)}
              placeholder="operador"
            />
          </label>
        </div>

        <div className="p-5 border-t flex gap-2 justify-end">
          <button className="px-4 py-2 rounded-xl border" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-xl bg-slate-900 text-white"
            onClick={() => onSubmit({ openingAmount: Number(openingAmount), openedBy })}
          >
            Abrir
          </button>
        </div>
      </div>
    </div>
  );
}
