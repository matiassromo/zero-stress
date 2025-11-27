// app/bar/page.tsx  (o src/app/bar/page.tsx)
"use client";

import { useEffect, useState } from "react";
import type { BarProduct } from "@/types/barProduct";
import type { BarOrder, BarOrderDetail } from "@/types/barOrder";

// AJUSTA ESTAS RUTAS A TU PROYECTO
import {
  listBarProducts,
  createBarProduct,
} from "@/lib/apiv2/barProducts"; // <- path real a barProducts.ts
import {
  createBarOrder,
  getBarOrder,
  createBarOrderDetail,
} from "@/lib/apiv2/barOrders"; // <- path real a barOrders.ts

export default function BarPage() {
  const [products, setProducts] = useState<BarProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);

  const [currentOrder, setCurrentOrder] = useState<BarOrder | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [detailQty, setDetailQty] = useState<number>(1);

  // 1) Cargar productos al entrar
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const data = await listBarProducts();
      setProducts(data);
    } finally {
      setLoadingProducts(false);
    }
  }

  // 2) Crear producto nuevo
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!newName || newQty <= 0 || newPrice <= 0) return;

    const created = await createBarProduct({
      name: newName,
      qty: newQty,
      unitPrice: newPrice,
    });

    setProducts((prev) => [...prev, created]);
    setNewName("");
    setNewQty(0);
    setNewPrice(0);
  }

  // 3) Crear nueva orden vacía
  async function handleNewOrder() {
    const order = await createBarOrder();
    // por si quieres refrescarla del back (traer detalles)
    const full = await getBarOrder(order.id);
    setCurrentOrder(full ?? order);
    setSelectedProductId("");
    setDetailQty(1);
  }

  // 4) Agregar producto a la orden actual
  async function handleAddDetail(e: React.FormEvent) {
    e.preventDefault();
    if (!currentOrder) return;
    if (!selectedProductId || detailQty <= 0) return;

    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    await createBarOrderDetail(currentOrder.id, {
      barProductId: product.id,
      unitPrice: product.unitPrice,
      qty: detailQty,
    });

    // recargar la orden con sus detalles actualizados
    const updated = await getBarOrder(currentOrder.id);
    if (updated) setCurrentOrder(updated);
    setDetailQty(1);
  }

  const orderDetails: BarOrderDetail[] = currentOrder?.details ?? [];
  const orderTotal = orderDetails.reduce(
    (acc, d) => acc + d.unitPrice * d.qty,
    0
  );

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-semibold">Bar</h1>

      {/* ==================== PRODUCTOS ==================== */}
      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold">Productos (alimentos/bebidas)</h2>

        <form
          onSubmit={handleCreateProduct}
          className="grid grid-cols-4 gap-4 items-end"
        >
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Hamburguesa, cerveza, pizza..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={newQty}
              onChange={(e) => setNewQty(Number(e.target.value))}
              min={0}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Precio unitario
            </label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              min={0}
              step="0.01"
            />
          </div>
          <div className="col-span-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-full text-sm font-medium bg-black text-white"
            >
              Guardar producto
            </button>
          </div>
        </form>

        <div className="border rounded-lg mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Nombre</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="text-right px-3 py-2">Precio</th>
              </tr>
            </thead>
            <tbody>
              {loadingProducts && (
                <tr>
                  <td className="px-3 py-2 text-center" colSpan={3}>
                    Cargando productos...
                  </td>
                </tr>
              )}
              {!loadingProducts && products.length === 0 && (
                <tr>
                  <td className="px-3 py-2 text-center" colSpan={3}>
                    No hay productos. Crea el primero arriba.
                  </td>
                </tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2 text-right">{p.qty}</td>
                  <td className="px-3 py-2 text-right">
                    ${p.unitPrice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== ORDEN ==================== */}
      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Orden actual</h2>
          <button
            type="button"
            onClick={handleNewOrder}
            className="px-4 py-2 rounded-full text-sm font-medium bg-black text-white"
          >
            Nueva orden
          </button>
        </div>

        {!currentOrder && (
          <p className="text-sm text-gray-500">
            No hay orden activa. Crea una nueva orden para empezar a agregar
            productos.
          </p>
        )}

        {currentOrder && (
          <>
            <p className="text-sm text-gray-600">
              Orden: <span className="font-mono">{currentOrder.id}</span>
            </p>

            {/* Agregar detalle */}
            <form
              onSubmit={handleAddDetail}
              className="grid grid-cols-3 gap-4 items-end"
            >
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Producto
                </label>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">Selecciona un producto</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} – ${p.unitPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={detailQty}
                  min={1}
                  onChange={(e) => setDetailQty(Number(e.target.value))}
                />
              </div>
              <div className="col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full text-sm font-medium bg-black text-white"
                >
                  Agregar a la orden
                </button>
              </div>
            </form>

            {/* Detalles de la orden */}
            <div className="border rounded-lg mt-4">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Producto</th>
                    <th className="text-right px-3 py-2">Cant.</th>
                    <th className="text-right px-3 py-2">P. Unitario</th>
                    <th className="text-right px-3 py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.length === 0 && (
                    <tr>
                      <td className="px-3 py-2 text-center" colSpan={4}>
                        La orden está vacía.
                      </td>
                    </tr>
                  )}
                  {orderDetails.map((d, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-3 py-2">
                        {d.barProduct?.name ?? "Producto"}
                      </td>
                      <td className="px-3 py-2 text-right">{d.qty}</td>
                      <td className="px-3 py-2 text-right">
                        ${d.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${(d.unitPrice * d.qty).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-3 py-2 font-semibold" colSpan={3}>
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      ${orderTotal.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
