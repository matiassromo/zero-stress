import type { Product } from "@/types/pos";

const MOCKS: Product[] = [
  { id: "p1", name: "Entrada Adulto", price: 5.0, tags: ["entrada"] },
  { id: "p2", name: "Entrada Niño", price: 3.0, tags: ["entrada"] },
  { id: "p3", name: "Coca-Cola 500ml", price: 1.5, tags: ["bar"] },
];

export async function listProducts(q?: string): Promise<Product[]> {
  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
  await delay(150); // simula red

  if (!q) return MOCKS;
  const query = q.toLowerCase();
  return MOCKS.filter(
    p =>
      p.name.toLowerCase().includes(query) ||
      p.tags?.some(t => t.toLowerCase().includes(query))
  );
}
