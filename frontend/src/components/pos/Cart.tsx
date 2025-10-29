"use client";
import { CartItem, Product } from "@/types/pos";
import { useMemo } from "react";

type Props = {
  items: CartItem[];
  onAdd: (p: Product) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: (total: number) => void;
};

export default function Cart({ items, onAdd, onRemove, onClear, onCheckout }: Props) {
  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.product.price * it.qty, 0),
    [items]
  );

  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="mb-3 text-lg font-semibold">Carrito</div>

      {items.length === 0 ? (
        <div className="text-sm opacity-70">Añade productos</div>
      ) : (
        <ul className="mb-3 space-y-2">
          {items.map((it) => (
            <li key={it.product.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{it.product.name}</div>
                <div className="text-xs opacity-70">
                  ${it.product.price.toFixed(2)} × {it.qty}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRemove(it.product.id)}
                  className="rounded-lg border px-2 py-1 text-sm"
                >
                  −
                </button>
                <button
                  onClick={() => onAdd(it.product)}
                  className="rounded-lg border px-2 py-1 text-sm"
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-3 flex items-center justify-between border-t pt-3">
        <span className="text-sm opacity-70">Total</span>
        <span className="text-xl font-semibold">${total.toFixed(2)}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="flex-1 rounded-xl border px-4 py-2"
        >
          Limpiar
        </button>
        <button
          onClick={() => onCheckout(total)}
          disabled={items.length === 0}
          className="flex-1 rounded-xl bg-indigo-500 px-4 py-2 text-white disabled:opacity-50"
        >
          Cobrar
        </button>
      </div>
    </div>
  );
}
