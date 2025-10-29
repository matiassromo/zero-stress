"use client";
import { Product } from "@/types/pos";

type Props = {
  product: Product;
  onAdd: (p: Product) => void;
};

export default function ProductCard({ product, onAdd }: Props) {
  return (
    <button
      onClick={() => onAdd(product)}
      className="w-full rounded-2xl border p-4 text-left shadow-sm hover:shadow transition"
    >
      <div className="font-medium">{product.name}</div>
      <div className="text-sm opacity-70">${product.price.toFixed(2)}</div>
    </button>
  );
}
